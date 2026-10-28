using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Models;
using RouteWise.Api.Options;
using RouteWise.Api.Providers.Routing.OpenRouteService;

namespace RouteWise.Api.Providers.Routing
{
    public class OpenRouteServiceRouteProvider : IRouteProvider
    {
        private readonly HttpClient _httpClient;
        private readonly OpenRouteServiceOptions _options;

        public OpenRouteServiceRouteProvider(
            HttpClient httpClient,
            IOptions<OpenRouteServiceOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
        }

        public Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            CancellationToken cancellationToken = default)
        {
            return BuildMatrixAsync(locations, TravelMode.Default, cancellationToken);
        }

        public async Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            string travelMode,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                throw new OpenRouteServiceException("OpenRouteService API key is missing. Please configure it in settings.");
            }

            var requestBody = new OrsMatrixRequest
            {
                Locations = locations
                    .Select(loc => new List<double> { loc.Longitude, loc.Latitude })
                    .ToList(),
                Metrics = new List<string> { "duration", "distance" }
            };

            var profile = TravelMode.ToOrsProfile(travelMode);

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"v2/matrix/{profile}")
            {
                Content = JsonContent.Create(requestBody)
            };

            httpRequest.Headers.TryAddWithoutValidation("Authorization", _options.ApiKey);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            }
            catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                throw new OpenRouteServiceException("Request to OpenRouteService timed out.", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new OpenRouteServiceException("Network error occurred while connecting to OpenRouteService.", ex);
            }

            using (response)
            {
                if (!response.IsSuccessStatusCode)
                {
                    OpenRouteServiceException.ThrowForStatusCode(response.StatusCode);
                }

                OrsMatrixResponse? matrixResponse;
                try
                {
                    matrixResponse = await response.Content.ReadFromJsonAsync<OrsMatrixResponse>(cancellationToken: cancellationToken);
                }
                catch (JsonException ex)
                {
                    throw new OpenRouteServiceException("Failed to parse response from OpenRouteService.", ex);
                }

                if (matrixResponse?.Durations is null || matrixResponse.Distances is null)
                {
                    throw new OpenRouteServiceException("OpenRouteService returned an empty or invalid matrix response.");
                }

                return MapToRouteMatrix(matrixResponse, locations.Count, travelMode);
            }
        }

        public Task<RouteGeometry> GetRouteGeometryAsync(
            List<LocationPoint> orderedLocations,
            CancellationToken cancellationToken = default)
        {
            return GetRouteGeometryAsync(orderedLocations, TravelMode.Default, cancellationToken);
        }

        public async Task<RouteGeometry> GetRouteGeometryAsync(
            List<LocationPoint> orderedLocations,
            string travelMode,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                throw new OpenRouteServiceException("OpenRouteService API key is missing. Please configure it in settings.");
            }

            if (orderedLocations == null || orderedLocations.Count < 2)
            {
                return new RouteGeometry();
            }

            var requestBody = new OrsDirectionsRequest
            {
                Coordinates = orderedLocations
                    .Select(loc => new List<double> { loc.Longitude, loc.Latitude })
                    .ToList()
            };

            var profile = TravelMode.ToOrsProfile(travelMode);

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"v2/directions/{profile}/geojson")
            {
                Content = JsonContent.Create(requestBody)
            };

            httpRequest.Headers.TryAddWithoutValidation("Authorization", _options.ApiKey);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            }
            catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                throw new OpenRouteServiceException("Request to OpenRouteService timed out.", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new OpenRouteServiceException("Network error occurred while connecting to OpenRouteService.", ex);
            }

            using (response)
            {
                if (!response.IsSuccessStatusCode)
                {
                    OpenRouteServiceException.ThrowForStatusCode(response.StatusCode);
                }

                OrsDirectionsGeoJsonResponse? geoJsonResponse;
                try
                {
                    geoJsonResponse = await response.Content.ReadFromJsonAsync<OrsDirectionsGeoJsonResponse>(cancellationToken: cancellationToken);
                }
                catch (JsonException ex)
                {
                    throw new OpenRouteServiceException("Failed to parse response from OpenRouteService.", ex);
                }

                var feature = geoJsonResponse?.Features?.FirstOrDefault();
                if (feature?.Geometry?.Coordinates is null || feature.Geometry.Coordinates.Count == 0)
                {
                    throw new OpenRouteServiceException("OpenRouteService returned an empty or invalid geometry response.");
                }

                var points = feature.Geometry.Coordinates
                    .Where(coord => coord.Count >= 2)
                    .Select(coord => new LocationPoint
                    {
                        Longitude = coord[0],
                        Latitude = coord[1]
                    })
                    .ToList();

                return new RouteGeometry
                {
                    Coordinates = points
                };
            }
        }

        private static RouteMatrix MapToRouteMatrix(OrsMatrixResponse response, int expectedCount, string travelMode)
        {
            if (response.Durations!.Count != expectedCount || response.Distances!.Count != expectedCount)
            {
                throw new OpenRouteServiceException("OpenRouteService matrix size does not match requested locations count.");
            }

            var travelTimesSeconds = new List<List<int>>();
            var travelTimesMinutes = new List<List<int>>();
            var distancesKm = new List<List<double>>();
            var isDriving = string.Equals(TravelMode.Normalize(travelMode), TravelMode.Driving, StringComparison.OrdinalIgnoreCase);

            for (int i = 0; i < expectedCount; i++)
            {
                var durationRow = response.Durations[i];
                var distanceRow = response.Distances[i];

                if (durationRow.Count != expectedCount || distanceRow.Count != expectedCount)
                {
                    throw new OpenRouteServiceException("OpenRouteService matrix row size is invalid.");
                }

                var timeSecondsRow = new List<int>();
                var timeMinutesRow = new List<int>();
                var distanceKmRow = new List<double>();

                for (int j = 0; j < expectedCount; j++)
                {
                    var durationSeconds = durationRow[j];
                    var distanceMeters = distanceRow[j];

                    if (!durationSeconds.HasValue || !distanceMeters.HasValue)
                    {
                        throw new OpenRouteServiceException($"Route between location {i} and {j} is unreachable.");
                    }

                    var rawSeconds = durationSeconds.Value;
                    var distanceKm = Math.Round(distanceMeters.Value / 1000.0, 2);

                    int seconds;
                    if (i == j || rawSeconds <= 0.0)
                    {
                        seconds = 0;
                    }
                    else if (isDriving)
                    {
                        // OpenRouteService calculates free-flow driving duration without traffic lights,
                        // pedestrian crosswalks or urban congestion. Apply urban impedance factor for city trips.
                        var trafficFactor = GetUrbanTrafficFactor(distanceKm);
                        seconds = (int)Math.Max(1, Math.Round(rawSeconds * trafficFactor));
                    }
                    else
                    {
                        seconds = (int)Math.Round(rawSeconds);
                    }

                    timeSecondsRow.Add(seconds);
                    timeMinutesRow.Add((int)Math.Round(seconds / 60.0));
                    distanceKmRow.Add(distanceKm);
                }

                travelTimesSeconds.Add(timeSecondsRow);
                travelTimesMinutes.Add(timeMinutesRow);
                distancesKm.Add(distanceKmRow);
            }

            return new RouteMatrix
            {
                TravelTimesSeconds = travelTimesSeconds,
                TravelTimesMinutes = travelTimesMinutes,
                DistancesKm = distancesKm
            };
        }

        private static double GetUrbanTrafficFactor(double distanceKm)
        {
            // Urban driving (< 8 km, e.g. crossing Zhytomyr, Hydropark to Vitruka):
            // Accounts for red traffic light waiting (30-60s per signal) and pedestrian crosswalks (+45%)
            if (distanceKm <= 8.0)
            {
                return 1.45;
            }

            // Suburban / ring road (8 to 25 km): smooth decline to highway conditions
            if (distanceKm <= 25.0)
            {
                var t = (distanceKm - 8.0) / (25.0 - 8.0);
                return 1.45 - t * (1.45 - 1.0);
            }

            // Highway / intercity (> 25 km, e.g. M-06): free-flow ORS speeds are accurate
            return 1.0;
        }
    }
}

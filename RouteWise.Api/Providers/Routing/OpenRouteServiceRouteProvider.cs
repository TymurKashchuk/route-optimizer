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

        public async Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
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

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "v2/matrix/driving-car")
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
                    HandleErrorStatusCode(response.StatusCode);
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

                return MapToRouteMatrix(matrixResponse, locations.Count);
            }
        }

        private static void HandleErrorStatusCode(HttpStatusCode statusCode)
        {
            if (statusCode == HttpStatusCode.Unauthorized)
            {
                throw new OpenRouteServiceException("Invalid or unauthorized OpenRouteService API key.", statusCode);
            }

            if (statusCode == HttpStatusCode.Forbidden)
            {
                throw new OpenRouteServiceException("Access to OpenRouteService is forbidden.", statusCode);
            }

            if (statusCode == HttpStatusCode.TooManyRequests)
            {
                throw new OpenRouteServiceException("OpenRouteService rate limit exceeded. Please try again later.", statusCode);
            }

            if ((int)statusCode >= 500)
            {
                throw new OpenRouteServiceException("OpenRouteService server error encountered. Service may be temporarily unavailable.", statusCode);
            }

            throw new OpenRouteServiceException($"OpenRouteService returned an unexpected error ({(int)statusCode}).", statusCode);
        }

        private static RouteMatrix MapToRouteMatrix(OrsMatrixResponse response, int expectedCount)
        {
            if (response.Durations!.Count != expectedCount || response.Distances!.Count != expectedCount)
            {
                throw new OpenRouteServiceException("OpenRouteService matrix size does not match requested locations count.");
            }

            var travelTimesMinutes = new List<List<int>>();
            var distancesKm = new List<List<double>>();

            for (int i = 0; i < expectedCount; i++)
            {
                var durationRow = response.Durations[i];
                var distanceRow = response.Distances[i];

                if (durationRow.Count != expectedCount || distanceRow.Count != expectedCount)
                {
                    throw new OpenRouteServiceException("OpenRouteService matrix row size is invalid.");
                }

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

                    timeMinutesRow.Add((int)Math.Round(durationSeconds.Value / 60.0));
                    distanceKmRow.Add(Math.Round(distanceMeters.Value / 1000.0, 2));
                }

                travelTimesMinutes.Add(timeMinutesRow);
                distancesKm.Add(distanceKmRow);
            }

            return new RouteMatrix
            {
                TravelTimesMinutes = travelTimesMinutes,
                DistancesKm = distancesKm
            };
        }
    }
}

using System.Net.Http.Json;
using Microsoft.Extensions.Options;
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

        public RouteMatrix BuildMatrix(List<LocationPoint> locations)
        {
            return BuildMatrixAsync(locations).GetAwaiter().GetResult();
        }

        public async Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            CancellationToken cancellationToken = default)
        {
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

            if (!string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                httpRequest.Headers.TryAddWithoutValidation("Authorization", _options.ApiKey);
            }

            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            response.EnsureSuccessStatusCode();

            var matrixResponse = await response.Content.ReadFromJsonAsync<OrsMatrixResponse>(cancellationToken: cancellationToken);

            if (matrixResponse?.Durations is null || matrixResponse.Distances is null)
            {
                throw new InvalidOperationException("OpenRouteService matrix response is empty or invalid.");
            }

            return MapToRouteMatrix(matrixResponse, locations.Count);
        }

        private static RouteMatrix MapToRouteMatrix(OrsMatrixResponse response, int expectedCount)
        {
            if (response.Durations!.Count != expectedCount || response.Distances!.Count != expectedCount)
            {
                throw new InvalidOperationException("OpenRouteService matrix size does not match requested locations count.");
            }

            var travelTimesMinutes = new List<List<int>>();
            var distancesKm = new List<List<double>>();

            for (int i = 0; i < expectedCount; i++)
            {
                var durationRow = response.Durations[i];
                var distanceRow = response.Distances[i];

                if (durationRow.Count != expectedCount || distanceRow.Count != expectedCount)
                {
                    throw new InvalidOperationException("OpenRouteService matrix row size is invalid.");
                }

                var timeMinutesRow = new List<int>();
                var distanceKmRow = new List<double>();

                for (int j = 0; j < expectedCount; j++)
                {
                    var durationSeconds = durationRow[j];
                    var distanceMeters = distanceRow[j];

                    if (!durationSeconds.HasValue || !distanceMeters.HasValue)
                    {
                        throw new InvalidOperationException($"Route between location {i} and {j} is unreachable.");
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

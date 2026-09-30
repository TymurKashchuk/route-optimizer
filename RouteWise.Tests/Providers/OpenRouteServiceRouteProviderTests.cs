using System.Net;
using Microsoft.Extensions.Options;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Models;
using RouteWise.Api.Options;
using RouteWise.Api.Providers.Routing;
using RouteWise.Tests.TestHelpers;

namespace RouteWise.Tests.Providers
{
    public class OpenRouteServiceRouteProviderTests
    {
        private readonly List<LocationPoint> _demoLocations = new()
        {
            new LocationPoint { Latitude = 50.25465, Longitude = 28.65867 },
            new LocationPoint { Latitude = 50.26407, Longitude = 28.67669 },
            new LocationPoint { Latitude = 50.25007, Longitude = 28.67011 }
        };

        private static (OpenRouteServiceRouteProvider Provider, TestHttpMessageHandler Handler) CreateProvider(
            string jsonResponse,
            HttpStatusCode statusCode = HttpStatusCode.OK,
            string apiKey = "test-api-key")
        {
            var handler = new TestHttpMessageHandler(jsonResponse, statusCode);
            var httpClient = new HttpClient(handler)
            {
                BaseAddress = new Uri("https://api.openrouteservice.org/")
            };

            var options = Microsoft.Extensions.Options.Options.Create(new OpenRouteServiceOptions
            {
                BaseUrl = "https://api.openrouteservice.org/",
                ApiKey = apiKey,
                TimeoutSeconds = 10
            });

            var provider = new OpenRouteServiceRouteProvider(httpClient, options);
            return (provider, handler);
        }

        [Fact]
        public async Task BuildMatrixAsync_WhenApiKeyMissing_ThrowsOpenRouteServiceException()
        {
            var (provider, _) = CreateProvider("{}", apiKey: "");

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.BuildMatrixAsync(_demoLocations));

            Assert.Contains("API key is missing", exception.Message);
        }

        [Fact]
        public async Task BuildMatrixAsync_SendsCorrectCoordinatesAndHeaders()
        {
            var validJson = """
            {
              "durations": [[0, 720, 1080], [660, 0, 600], [1020, 540, 0]],
              "distances": [[0, 5200, 8400], [5000, 0, 4100], [8000, 4000, 0]]
            }
            """;

            var (provider, handler) = CreateProvider(validJson, apiKey: "valid-key-123");

            await provider.BuildMatrixAsync(_demoLocations);

            Assert.NotNull(handler.LastRequest);
            Assert.EndsWith("v2/matrix/driving-car", handler.LastRequest!.RequestUri?.ToString());
            Assert.True(handler.LastRequest.Headers.Contains("Authorization"));
            Assert.Contains("valid-key-123", handler.LastRequest.Headers.GetValues("Authorization"));

            Assert.NotNull(handler.LastRequestBody);
            Assert.Contains("[28.65867,50.25465]", handler.LastRequestBody);
            Assert.Contains("\"metrics\":[\"duration\",\"distance\"]", handler.LastRequestBody);
        }

        [Fact]
        public async Task BuildMatrixAsync_WithValidResponse_CorrectlyMapsToMinutesAndKilometers()
        {
            var validJson = """
            {
              "durations": [
                [0.0, 720.0, 1080.0],
                [660.0, 0.0, 600.0],
                [1020.0, 540.0, 0.0]
              ],
              "distances": [
                [0.0, 5200.0, 8400.0],
                [5000.0, 0.0, 4100.0],
                [8000.0, 4000.0, 0.0]
              ]
            }
            """;

            var (provider, _) = CreateProvider(validJson);

            var matrix = await provider.BuildMatrixAsync(_demoLocations);

            Assert.NotNull(matrix);
            Assert.Equal(3, matrix.TravelTimesMinutes.Count);
            Assert.Equal(3, matrix.DistancesKm.Count);

            Assert.Equal(0, matrix.TravelTimesMinutes[0][0]);
            Assert.Equal(12, matrix.TravelTimesMinutes[0][1]);
            Assert.Equal(18, matrix.TravelTimesMinutes[0][2]);

            Assert.Equal(0.0, matrix.DistancesKm[0][0]);
            Assert.Equal(5.2, matrix.DistancesKm[0][1]);
            Assert.Equal(8.4, matrix.DistancesKm[0][2]);
        }

        [Fact]
        public async Task BuildMatrixAsync_WhenUnauthorized401_ThrowsOpenRouteServiceException()
        {
            var (provider, _) = CreateProvider("{}", HttpStatusCode.Unauthorized);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.BuildMatrixAsync(_demoLocations));

            Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
            Assert.Contains("unauthorized", exception.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task BuildMatrixAsync_WhenForbidden403_ThrowsOpenRouteServiceException()
        {
            var (provider, _) = CreateProvider("{}", HttpStatusCode.Forbidden);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.BuildMatrixAsync(_demoLocations));

            Assert.Equal(HttpStatusCode.Forbidden, exception.StatusCode);
            Assert.Contains("forbidden", exception.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task BuildMatrixAsync_WhenRateLimit429_ThrowsOpenRouteServiceException()
        {
            var (provider, _) = CreateProvider("{}", HttpStatusCode.TooManyRequests);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.BuildMatrixAsync(_demoLocations));

            Assert.Equal(HttpStatusCode.TooManyRequests, exception.StatusCode);
            Assert.Contains("rate limit", exception.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task BuildMatrixAsync_WhenServerError500_ThrowsOpenRouteServiceException()
        {
            var (provider, _) = CreateProvider("{}", HttpStatusCode.InternalServerError);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.BuildMatrixAsync(_demoLocations));

            Assert.Equal(HttpStatusCode.InternalServerError, exception.StatusCode);
            Assert.Contains("server error", exception.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task BuildMatrixAsync_WhenLocationUnreachable_ThrowsOpenRouteServiceException()
        {
            var unreachableJson = """
            {
              "durations": [
                [0.0, null, 1080.0],
                [660.0, 0.0, 600.0],
                [1020.0, 540.0, 0.0]
              ],
              "distances": [
                [0.0, null, 8400.0],
                [5000.0, 0.0, 4100.0],
                [8000.0, 4000.0, 0.0]
              ]
            }
            """;

            var (provider, _) = CreateProvider(unreachableJson);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.BuildMatrixAsync(_demoLocations));

            Assert.Contains("unreachable", exception.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task BuildMatrixAsync_WhenMalformedJson_ThrowsOpenRouteServiceException()
        {
            var malformedJson = "{ broken json content: ";

            var (provider, _) = CreateProvider(malformedJson);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.BuildMatrixAsync(_demoLocations));

            Assert.Contains("Failed to parse", exception.Message);
        }

        [Fact]
        public async Task GetRouteGeometryAsync_WhenApiKeyMissing_ThrowsOpenRouteServiceException()
        {
            var (provider, _) = CreateProvider("{}", apiKey: "");

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.GetRouteGeometryAsync(_demoLocations));

            Assert.Contains("API key is missing", exception.Message);
        }

        [Fact]
        public async Task GetRouteGeometryAsync_WithFewerThanTwoPoints_ReturnsEmptyGeometry()
        {
            var (provider, _) = CreateProvider("{}");

            var result = await provider.GetRouteGeometryAsync(new List<LocationPoint> { _demoLocations[0] });

            Assert.NotNull(result);
            Assert.Empty(result.Coordinates);
        }

        [Fact]
        public async Task GetRouteGeometryAsync_SendsCorrectCoordinatesAndHeaders()
        {
            var validGeoJson = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "LineString",
                    "coordinates": [
                      [28.65867, 50.25465],
                      [28.67669, 50.26407]
                    ]
                  }
                }
              ]
            }
            """;

            var (provider, handler) = CreateProvider(validGeoJson, apiKey: "valid-key-123");

            var result = await provider.GetRouteGeometryAsync(_demoLocations.Take(2).ToList());

            Assert.NotNull(handler.LastRequest);
            Assert.EndsWith("v2/directions/driving-car/geojson", handler.LastRequest!.RequestUri?.ToString());
            Assert.True(handler.LastRequest.Headers.Contains("Authorization"));
            Assert.Contains("valid-key-123", handler.LastRequest.Headers.GetValues("Authorization"));

            Assert.NotNull(handler.LastRequestBody);
            Assert.Contains("[28.65867,50.25465]", handler.LastRequestBody);

            Assert.Equal(2, result.Coordinates.Count);
            Assert.Equal(50.25465, result.Coordinates[0].Latitude);
            Assert.Equal(28.65867, result.Coordinates[0].Longitude);
            Assert.Equal(50.26407, result.Coordinates[1].Latitude);
            Assert.Equal(28.67669, result.Coordinates[1].Longitude);
        }

        [Fact]
        public async Task GetRouteGeometryAsync_WhenEmptyFeatures_ThrowsOpenRouteServiceException()
        {
            var emptyFeaturesJson = """
            {
              "type": "FeatureCollection",
              "features": []
            }
            """;

            var (provider, _) = CreateProvider(emptyFeaturesJson);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.GetRouteGeometryAsync(_demoLocations));

            Assert.Contains("empty or invalid geometry", exception.Message);
        }
    }
}

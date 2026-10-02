using System.Net;
using Microsoft.Extensions.Options;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Options;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Tests.TestHelpers;

namespace RouteWise.Tests.Providers
{
    public class OpenRouteServiceGeocodingProviderTests
    {
        private static (OpenRouteServiceGeocodingProvider Provider, TestHttpMessageHandler Handler) CreateProvider(
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

            var provider = new OpenRouteServiceGeocodingProvider(httpClient, options);
            return (provider, handler);
        }

        [Fact]
        public async Task SearchAsync_WhenApiKeyMissing_ThrowsOpenRouteServiceException()
        {
            var (provider, _) = CreateProvider("{}", apiKey: "");

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.SearchAsync("Zhytomyr"));

            Assert.Contains("API key is missing", exception.Message);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public async Task SearchAsync_WhenQueryIsNullOrWhiteSpace_ReturnsEmptyList(string? query)
        {
            var (provider, handler) = CreateProvider("{}");

            var result = await provider.SearchAsync(query!);

            Assert.Empty(result);
            Assert.Null(handler.LastRequest);
        }

        [Fact]
        public async Task SearchAsync_SendsCorrectRequestAndParsesFeatures()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [28.65867, 50.25465]
                  },
                  "properties": {
                    "id": "node/123",
                    "name": "Central Square",
                    "label": "Central Square, Zhytomyr, Ukraine",
                    "confidence": 0.95
                  }
                },
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [28.67669, 50.26407]
                  },
                  "properties": {
                    "name": "Railway Station",
                    "confidence": 0.8
                  }
                }
              ]
            }
            """;

            var (provider, handler) = CreateProvider(jsonResponse);

            var results = await provider.SearchAsync("Zhytomyr");

            Assert.NotNull(handler.LastRequest);
            Assert.Equal(HttpMethod.Get, handler.LastRequest.Method);
            Assert.Contains("geocode/search?text=Zhytomyr&size=5", handler.LastRequest.RequestUri?.ToString());
            Assert.True(handler.LastRequest.Headers.Contains("Authorization"));
            Assert.Equal("test-api-key", handler.LastRequest.Headers.GetValues("Authorization").First());

            Assert.Equal(2, results.Count);

            // Coordinates mapping: GeoJSON [lon, lat] -> LocationPoint { Latitude = lat, Longitude = lon }
            Assert.Equal(50.25465, results[0].Coordinates.Latitude);
            Assert.Equal(28.65867, results[0].Coordinates.Longitude);
            Assert.Equal("Central Square, Zhytomyr, Ukraine", results[0].DisplayName);
            Assert.Equal("Central Square, Zhytomyr, Ukraine", results[0].Address);
            Assert.Equal(0.95, results[0].Confidence);

            Assert.Equal(50.26407, results[1].Coordinates.Latitude);
            Assert.Equal(28.67669, results[1].Coordinates.Longitude);
            Assert.Equal("Railway Station", results[1].DisplayName);
        }

        [Fact]
        public async Task SearchAsync_WhenRateLimitExceeded_ThrowsOpenRouteServiceExceptionWith429()
        {
            var (provider, _) = CreateProvider("{}", HttpStatusCode.TooManyRequests);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.SearchAsync("Kyiv"));

            Assert.Equal(HttpStatusCode.TooManyRequests, exception.StatusCode);
            Assert.Contains("rate limit exceeded", exception.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task SearchAsync_WhenUnauthorized_ThrowsOpenRouteServiceExceptionWith401()
        {
            var (provider, _) = CreateProvider("{}", HttpStatusCode.Unauthorized);

            var exception = await Assert.ThrowsAsync<OpenRouteServiceException>(() =>
                provider.SearchAsync("Kyiv"));

            Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
            Assert.Contains("unauthorized", exception.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Geocode_WhenAddressFound_ReturnsFirstCoordinates()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [30.5238, 50.4547]
                  },
                  "properties": {
                    "label": "Khreshchatyk, Kyiv"
                  }
                }
              ]
            }
            """;

            var (provider, _) = CreateProvider(jsonResponse);

            var location = provider.Geocode("Khreshchatyk");

            Assert.Equal(50.4547, location.Latitude);
            Assert.Equal(30.5238, location.Longitude);
        }

        [Fact]
        public void Geocode_WhenNotFound_ThrowsInvalidOperationException()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": []
            }
            """;

            var (provider, _) = CreateProvider(jsonResponse);

            var exception = Assert.Throws<InvalidOperationException>(() =>
                provider.Geocode("NonExistentAddress123"));

            Assert.Contains("Address not found", exception.Message);
        }
    }
}

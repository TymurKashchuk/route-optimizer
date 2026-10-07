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
            Assert.Contains("autocomplete?text=Zhytomyr&size=5", handler.LastRequest.RequestUri?.ToString());
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
        public async Task SearchAsync_WhenKnownCityProvided_SetsFocusPointAndBoundaryCircle()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": []
            }
            """;

            var (provider, handler) = CreateProvider(jsonResponse);

            await provider.SearchAsync("Київська", limit: 5, city: "Житомир");

            Assert.NotNull(handler.LastRequest);
            var requestUri = handler.LastRequest.RequestUri?.ToString();
            Assert.NotNull(requestUri);
            var unescapedUri = Uri.UnescapeDataString(requestUri);
            Assert.Contains("autocomplete?text=Київська", unescapedUri);
            Assert.Contains("focus.point.lat=50.25465", unescapedUri);
            Assert.Contains("boundary.circle.radius=25", unescapedUri);
        }

        [Fact]
        public async Task SearchAsync_WhenCustomCityProvided_AppendsCityToSearchText()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": []
            }
            """;

            var (provider, handler) = CreateProvider(jsonResponse);

            await provider.SearchAsync("Шевченка", limit: 5, city: "Бровари");

            Assert.NotNull(handler.LastRequest);
            var requestUri = handler.LastRequest.RequestUri?.ToString();
            Assert.NotNull(requestUri);
            var unescapedUri = Uri.UnescapeDataString(requestUri);
            Assert.Contains("Шевченка, Бровари", unescapedUri);
        }

        [Fact]
        public async Task SearchAsync_WhenQueryAlreadyContainsCity_DoesNotDuplicateCity()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": []
            }
            """;

            var (provider, handler) = CreateProvider(jsonResponse);

            await provider.SearchAsync("Шевченка, Бровари", limit: 5, city: "Бровари");

            Assert.NotNull(handler.LastRequest);
            var requestUri = handler.LastRequest.RequestUri?.ToString();
            Assert.NotNull(requestUri);
            var unescapedUri = Uri.UnescapeDataString(requestUri);
            Assert.Contains("Шевченка, Бровари", unescapedUri);
            Assert.DoesNotContain("Бровари, Бровари", unescapedUri);
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

            var (provider, handler) = CreateProvider(jsonResponse);

            var location = provider.Geocode("Khreshchatyk");

            Assert.Equal(50.4547, location.Latitude);
            Assert.Equal(30.5238, location.Longitude);
            Assert.NotNull(handler.LastRequest);
            Assert.Contains("search?text=Khreshchatyk&size=1", handler.LastRequest.RequestUri?.ToString());
        }

        [Fact]
        public async Task GeocodeAsync_WhenAddressFound_ReturnsFirstCoordinatesAsync()
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

            var (provider, handler) = CreateProvider(jsonResponse);

            var location = await provider.GeocodeAsync("Khreshchatyk");

            Assert.Equal(50.4547, location.Latitude);
            Assert.Equal(30.5238, location.Longitude);
            Assert.NotNull(handler.LastRequest);
            Assert.Contains("search?text=Khreshchatyk&size=1", handler.LastRequest.RequestUri?.ToString());
        }

        [Fact]
        public async Task GeocodeAsync_WhenSearchReturnsEmpty_FallsBackToAutocomplete()
        {
            var emptySearchResponse = """{ "type": "FeatureCollection", "features": [] }""";
            var foundAutocompleteResponse = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [30.51519, 50.44585]
                  },
                  "properties": {
                    "label": "Золоті ворота, Kyiv, Ukraine"
                  }
                }
              ]
            }
            """;

            var handler = new TestHttpMessageHandler(req =>
            {
                if (req.RequestUri?.ToString().Contains("search") == true)
                {
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(emptySearchResponse, System.Text.Encoding.UTF8, "application/json")
                    };
                }
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(foundAutocompleteResponse, System.Text.Encoding.UTF8, "application/json")
                };
            });

            var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://api.openrouteservice.org/") };
            var options = Microsoft.Extensions.Options.Options.Create(new OpenRouteServiceOptions
            {
                ApiKey = "test-api-key",
                TimeoutSeconds = 10
            });
            var provider = new OpenRouteServiceGeocodingProvider(httpClient, options);

            var location = await provider.GeocodeAsync("Золоті ворота, Kyiv, Ukraine");

            Assert.Equal(50.44585, location.Latitude);
            Assert.Equal(30.51519, location.Longitude);
            Assert.Equal(2, handler.Requests.Count);
            Assert.Contains("search", handler.Requests[0].RequestUri?.ToString());
            Assert.Contains("autocomplete", handler.Requests[1].RequestUri?.ToString());
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

        [Fact]
        public async Task ReverseGeocodeAsync_SendsCorrectRequestAndReturnsResult()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [28.659181, 50.255318]
                  },
                  "properties": {
                    "label": "майдан Соборний, Zhytomyr, Ukraine",
                    "confidence": 1.0
                  }
                }
              ]
            }
            """;

            var (provider, handler) = CreateProvider(jsonResponse);

            var result = await provider.ReverseGeocodeAsync(50.255318, 28.659181);

            Assert.NotNull(result);
            Assert.Equal("майдан Соборний, Zhytomyr, Ukraine", result.Address);
            Assert.Equal(50.255318, result.Coordinates.Latitude);
            Assert.Equal(28.659181, result.Coordinates.Longitude);
            Assert.NotNull(handler.LastRequest);
            Assert.Contains("reverse?point.lat=50.255318&point.lon=28.659181&size=1", handler.LastRequest.RequestUri?.ToString());
        }

        [Fact]
        public async Task ReverseGeocodeAsync_WhenNoFeatures_ReturnsNull()
        {
            var jsonResponse = """
            {
              "type": "FeatureCollection",
              "features": []
            }
            """;

            var (provider, _) = CreateProvider(jsonResponse);

            var result = await provider.ReverseGeocodeAsync(0.0, 0.0);

            Assert.Null(result);
        }
    }
}

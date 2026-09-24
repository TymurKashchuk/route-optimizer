using Microsoft.Extensions.Options;
using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
using RouteWise.Api.Options;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;
using RouteWise.Api.Services;
using RouteWise.Tests.TestHelpers;

namespace RouteWise.Tests.Services
{
    public class RouteExecutionServiceTests
    {
        [Fact]
        public async Task Execute_WithNearestNeighbor_ReturnsCompleteOptimizeRouteResponse()
        {
            var routeMatrixService = new RouteMatrixService(
                new StaticGeocodingProvider(),
                new StaticRouteProvider());

            var optimizers = new List<IRouteOptimizer>
            {
                new OriginalOrderOptimizer(),
                new NearestNeighborOptimizer()
            };

            var service = new RouteExecutionService(
                routeMatrixService,
                optimizers,
                new MetricsService(),
                new TimelineService(),
                new RouteComparisonService(),
                new RouteExplanationService());

            var start = new AddressInput
            {
                Label = "Office",
                Address = "Zhytomyr Central Square"
            };

            var stops = new List<RouteStop>
            {
                new RouteStop
                {
                    Id = "1",
                    Label = "Client A",
                    Address = "Zhytomyr Railway Station",
                    ServiceMinutes = 20
                },
                new RouteStop
                {
                    Id = "2",
                    Label = "Client B",
                    Address = "Zhytomyr City Hospital",
                    ServiceMinutes = 15
                }
            };

            var departureTime = new DateTime(2026, 7, 31, 9, 0, 0);

            var result = await service.ExecuteAsync(
                "nearest-neighbor",
                start,
                departureTime,
                stops);

            Assert.Equal("nearest-neighbor", result.Algorithm);
            Assert.Equal(2, result.OrderedStops.Count);
            Assert.NotNull(result.Original);
            Assert.NotNull(result.Optimized);
            Assert.NotNull(result.Timeline);
            Assert.NotNull(result.ExplanationSteps);
            Assert.Equal(3, result.Timeline.Count);
            Assert.Equal(2, result.ExplanationSteps.Count);
        }

        [Fact]
        public async Task Execute_WithUnknownAlgorithm_ThrowsInvalidOperationException()
        {
            var routeMatrixService = new RouteMatrixService(
                new StaticGeocodingProvider(),
                new StaticRouteProvider());

            var optimizers = new List<IRouteOptimizer>
            {
                new OriginalOrderOptimizer(),
                new NearestNeighborOptimizer()
            };

            var service = new RouteExecutionService(
                routeMatrixService,
                optimizers,
                new MetricsService(),
                new TimelineService(),
                new RouteComparisonService(),
                new RouteExplanationService());

            var start = new AddressInput
            {
                Label = "Office",
                Address = "Zhytomyr Central Square"
            };

            var stops = new List<RouteStop>
            {
                new RouteStop
                {
                    Id = "1",
                    Label = "Client A",
                    Address = "Zhytomyr Railway Station",
                    ServiceMinutes = 20
                }
            };

            var departureTime = new DateTime(2026, 7, 31, 9, 0, 0);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.ExecuteAsync("does-not-exist", start, departureTime, stops));
        }

        [Fact]
        public async Task ExecuteAsync_WithOpenRouteServiceProvider_ReturnsExpectedOptimizedResponse()
        {
            var orsResponseJson = """
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

            var handler = new TestHttpMessageHandler(orsResponseJson);
            var httpClient = new HttpClient(handler)
            {
                BaseAddress = new Uri("https://api.openrouteservice.org/")
            };

            var options = Microsoft.Extensions.Options.Options.Create(new OpenRouteServiceOptions
            {
                BaseUrl = "https://api.openrouteservice.org/",
                ApiKey = "valid-test-key",
                TimeoutSeconds = 10
            });

            var orsProvider = new OpenRouteServiceRouteProvider(httpClient, options);
            var routeMatrixService = new RouteMatrixService(new StaticGeocodingProvider(), orsProvider);

            var optimizers = new List<IRouteOptimizer>
            {
                new OriginalOrderOptimizer(),
                new NearestNeighborOptimizer()
            };

            var service = new RouteExecutionService(
                routeMatrixService,
                optimizers,
                new MetricsService(),
                new TimelineService(),
                new RouteComparisonService(),
                new RouteExplanationService());

            var start = new AddressInput
            {
                Label = "Office",
                Address = "Zhytomyr Central Square"
            };

            var stops = new List<RouteStop>
            {
                new RouteStop
                {
                    Id = "1",
                    Label = "Client A",
                    Address = "Zhytomyr Railway Station",
                    ServiceMinutes = 20
                },
                new RouteStop
                {
                    Id = "2",
                    Label = "Client B",
                    Address = "Zhytomyr City Hospital",
                    ServiceMinutes = 15
                }
            };

            var departureTime = new DateTime(2026, 7, 31, 9, 0, 0);

            var result = await service.ExecuteAsync(
                "nearest-neighbor",
                start,
                departureTime,
                stops);

            Assert.Equal("nearest-neighbor", result.Algorithm);
            Assert.Equal(2, result.OrderedStops.Count);
            Assert.NotNull(result.Original);
            Assert.NotNull(result.Optimized);
            Assert.NotNull(result.Timeline);
            Assert.NotNull(result.ExplanationSteps);
            Assert.Equal(3, result.Timeline.Count);
        }
    }
}

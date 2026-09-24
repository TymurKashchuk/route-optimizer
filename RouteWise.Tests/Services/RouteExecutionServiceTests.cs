using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;
using RouteWise.Api.Services;

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
    }
}

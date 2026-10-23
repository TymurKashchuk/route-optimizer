using Microsoft.AspNetCore.Mvc;
using RouteWise.Api.Contracts.Requests;
using RouteWise.Api.Contracts.Responses;
using RouteWise.Api.Controllers;
using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;
using RouteWise.Api.Services;

namespace RouteWise.Tests.Controllers
{
    public class RouteOptimizationControllerTests
    {
        private static RouteExecutionService CreateService()
        {
            var staticRouteProvider = new StaticRouteProvider();
            return new RouteExecutionService(
                new RouteMatrixService(new StaticGeocodingProvider(), staticRouteProvider),
                new IRouteOptimizer[] { new OriginalOrderOptimizer(), new NearestNeighborOptimizer(), new TwoOptOptimizer() },
                new MetricsService(),
                new TimelineService(),
                new RouteComparisonService(),
                new RouteExplanationService(),
                new RoutePreviewService(staticRouteProvider));
        }

        [Fact]
        public async Task Optimize_WithValidRequest_ReturnsOkWithResponse()
        {
            var service = CreateService();
            var controller = new RouteOptimizationController(service);

            var request = new OptimizeRouteRequest
            {
                Algorithm = "original",
                PlanningMode = "depart-at",
                DepartureTime = new DateTime(2026, 7, 31, 9, 0, 0),
                Start = new AddressInput { Label = "Start", Address = "Zhytomyr Central Square" },
                Destination = new AddressInput { Label = "End", Address = "Zhytomyr City Hospital" },
                Stops = new List<RouteStop>
                {
                    new() { Id = "1", Label = "Stop 1", Address = "Zhytomyr Railway Station" }
                }
            };

            var actionResult = await controller.Optimize(request, CancellationToken.None);

            var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
            var response = Assert.IsType<OptimizeRouteResponse>(okResult.Value);
            Assert.Equal("original", response.Algorithm);
            Assert.NotEmpty(response.Timeline);
        }

        [Fact]
        public async Task Optimize_WhenUnknownAlgorithm_ThrowsExceptionToPropagateToMiddleware()
        {
            var service = CreateService();
            var controller = new RouteOptimizationController(service);

            var request = new OptimizeRouteRequest
            {
                Algorithm = "non-existent-algo",
                Start = new AddressInput { Label = "Start", Address = "Zhytomyr Central Square" },
                Destination = new AddressInput { Label = "End", Address = "Zhytomyr City Hospital" }
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                controller.Optimize(request, CancellationToken.None));
        }
    }
}

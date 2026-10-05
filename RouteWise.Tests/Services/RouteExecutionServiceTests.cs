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
            var staticRouteProvider = new StaticRouteProvider();
            var routeMatrixService = new RouteMatrixService(
                new StaticGeocodingProvider(),
                staticRouteProvider);

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
                new RouteExplanationService(),
                new RoutePreviewService(staticRouteProvider));

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
            Assert.NotNull(result.RoutePreview);
            Assert.NotNull(result.RoutePreview.StartPoint);
            Assert.Equal(2, result.RoutePreview.OrderedStops.Count);
            Assert.NotEmpty(result.RoutePreview.GeometryCoordinates);
            Assert.Equal(3, result.Timeline.Count);
            Assert.Equal(2, result.ExplanationSteps.Count);
        }

        [Fact]
        public async Task Execute_WithUnknownAlgorithm_ThrowsInvalidOperationException()
        {
            var staticRouteProvider = new StaticRouteProvider();
            var routeMatrixService = new RouteMatrixService(
                new StaticGeocodingProvider(),
                staticRouteProvider);

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
                new RouteExplanationService(),
                new RoutePreviewService(staticRouteProvider));

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
                      [28.67669, 50.26407],
                      [28.67011, 50.25007]
                    ]
                  }
                }
              ]
            }
            """;

            var handler = new TestHttpMessageHandler(req =>
            {
                var content = req.RequestUri?.ToString().Contains("geojson") == true
                    ? validGeoJson
                    : orsResponseJson;
                return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent(content, System.Text.Encoding.UTF8, "application/json")
                };
            });
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
                new RouteExplanationService(),
                new RoutePreviewService(orsProvider));

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
            Assert.Equal(3, result.RoutePreview.GeometryCoordinates.Count);
            Assert.Equal(2, result.RoutePreview.OrderedStops.Count);
            Assert.Equal(3, result.Timeline.Count);
        }

        [Fact]
        public async Task Execute_WithDestination_ReturnsCompleteOptimizeRouteResponseWithFixedDestination()
        {
            var staticRouteProvider = new StaticRouteProvider();
            var routeMatrixService = new RouteMatrixService(
                new StaticGeocodingProvider(),
                staticRouteProvider);

            var optimizers = new List<IRouteOptimizer>
            {
                new OriginalOrderOptimizer(),
                new NearestNeighborOptimizer(),
                new TwoOptOptimizer()
            };

            var service = new RouteExecutionService(
                routeMatrixService,
                optimizers,
                new MetricsService(),
                new TimelineService(),
                new RouteComparisonService(),
                new RouteExplanationService(),
                new RoutePreviewService(staticRouteProvider));

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

            var destination = new AddressInput
            {
                Label = "Central Depot",
                Address = "Zhytomyr Central Square"
            };

            var departureTime = new DateTime(2026, 7, 31, 9, 0, 0);

            var result = await service.ExecuteAsync(
                "two-opt",
                start,
                departureTime,
                stops,
                destination);

            Assert.Equal("two-opt", result.Algorithm);
            // Only intermediate stops are in OrderedStops
            Assert.Equal(2, result.OrderedStops.Count);

            // Timeline has Start + 2 Stops + Destination = 4 items
            Assert.Equal(4, result.Timeline.Count);
            Assert.Equal("Office", result.Timeline[0].Label);
            Assert.Equal("Central Depot", result.Timeline[3].Label);

            // ExplanationSteps has Start->Stop1, Stop1->Stop2, Stop2->Destination = 3 steps
            Assert.Equal(3, result.ExplanationSteps.Count);
            Assert.Equal("Office", result.ExplanationSteps[0].From);
            Assert.Equal("Central Depot", result.ExplanationSteps[2].To);

            // RoutePreview has StartPoint, 2 OrderedStops, DestinationPoint and Geometry
            Assert.NotNull(result.RoutePreview);
            Assert.Equal("start", result.RoutePreview.StartPoint.Id);
            Assert.Equal(2, result.RoutePreview.OrderedStops.Count);
            Assert.NotNull(result.RoutePreview.DestinationPoint);
            Assert.Equal("destination", result.RoutePreview.DestinationPoint.Id);
            Assert.Equal("Central Depot", result.RoutePreview.DestinationPoint.Label);
            Assert.Equal(4, result.RoutePreview.GeometryCoordinates.Count);

            // Metrics include travel to destination
            Assert.True(result.Optimized.TotalTravelMinutes > 0);
            Assert.True(result.Optimized.TotalDistanceKm > 0);
        }
    }
}

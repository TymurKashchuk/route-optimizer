using RouteWise.Api.Models;
using RouteWise.Api.Providers.Routing;
using RouteWise.Api.Services;

namespace RouteWise.Tests.Services
{
    public class RoutePreviewServiceTests
    {
        [Fact]
        public async Task BuildAsync_WithValidInputs_BuildsOrderedStopsAndGeometry()
        {
            var staticRouteProvider = new StaticRouteProvider();
            var service = new RoutePreviewService(staticRouteProvider);

            var start = new AddressInput
            {
                Label = "Start Hub",
                Address = "Zhytomyr Central Square"
            };

            var stops = new List<RouteStop>
            {
                new RouteStop { Id = "s1", Label = "Stop 1", Address = "Zhytomyr Railway Station" },
                new RouteStop { Id = "s2", Label = "Stop 2", Address = "Zhytomyr City Hospital" }
            };

            var allLocations = new List<LocationPoint>
            {
                new LocationPoint { Latitude = 50.25465, Longitude = 28.65867 }, // start
                new LocationPoint { Latitude = 50.26407, Longitude = 28.67669 }, // s1
                new LocationPoint { Latitude = 50.25007, Longitude = 28.67011 }  // s2
            };

            // Say optimizer ordered stops as [s2, s1] -> indices [1, 0]
            var orderedStops = new List<RouteStop> { stops[1], stops[0] };
            var orderedStopIndices = new List<int> { 1, 0 };

            var preview = await service.BuildAsync(start, orderedStops, orderedStopIndices, allLocations);

            Assert.NotNull(preview);
            Assert.Equal("start", preview.StartPoint.Id);
            Assert.Equal("Start Hub", preview.StartPoint.Label);
            Assert.Equal(50.25465, preview.StartPoint.Latitude);
            Assert.Equal(0, preview.StartPoint.Order);

            Assert.Equal(2, preview.OrderedStops.Count);
            Assert.Equal("s2", preview.OrderedStops[0].Id);
            Assert.Equal(1, preview.OrderedStops[0].Order);
            Assert.Equal(50.25007, preview.OrderedStops[0].Latitude);

            Assert.Equal("s1", preview.OrderedStops[1].Id);
            Assert.Equal(2, preview.OrderedStops[1].Order);
            Assert.Equal(50.26407, preview.OrderedStops[1].Latitude);

            Assert.Equal(3, preview.GeometryCoordinates.Count);
        }

        [Fact]
        public async Task BuildAsync_WhenLocationsEmpty_ReturnsEmptyPreview()
        {
            var staticRouteProvider = new StaticRouteProvider();
            var service = new RoutePreviewService(staticRouteProvider);

            var start = new AddressInput { Label = "Start", Address = "Unknown" };
            var preview = await service.BuildAsync(start, new List<RouteStop>(), new List<int>(), new List<LocationPoint>());

            Assert.NotNull(preview);
            Assert.Empty(preview.OrderedStops);
            Assert.Empty(preview.GeometryCoordinates);
        }

        [Fact]
        public async Task BuildAsync_WithDestination_IncludesDestinationPointAndGeometry()
        {
            var staticRouteProvider = new StaticRouteProvider();
            var service = new RoutePreviewService(staticRouteProvider);

            var start = new AddressInput
            {
                Label = "Start Hub",
                Address = "Zhytomyr Central Square"
            };

            var stops = new List<RouteStop>
            {
                new RouteStop { Id = "s1", Label = "Stop 1", Address = "Zhytomyr Railway Station" },
                new RouteStop { Id = "s2", Label = "Stop 2", Address = "Zhytomyr City Hospital" }
            };

            var destination = new AddressInput
            {
                Label = "Depot Finish",
                Address = "Zhytomyr Depot"
            };

            var allLocations = new List<LocationPoint>
            {
                new LocationPoint { Latitude = 50.25465, Longitude = 28.65867 }, // start
                new LocationPoint { Latitude = 50.26407, Longitude = 28.67669 }, // s1
                new LocationPoint { Latitude = 50.25007, Longitude = 28.67011 }, // s2
                new LocationPoint { Latitude = 50.24000, Longitude = 28.66000 }  // destination
            };

            var orderedStops = new List<RouteStop> { stops[1], stops[0] };
            var orderedStopIndices = new List<int> { 1, 0 };

            var preview = await service.BuildAsync(start, orderedStops, orderedStopIndices, allLocations, destination);

            Assert.NotNull(preview);
            Assert.Equal("start", preview.StartPoint.Id);
            Assert.Equal(2, preview.OrderedStops.Count);

            Assert.NotNull(preview.DestinationPoint);
            Assert.Equal("destination", preview.DestinationPoint.Id);
            Assert.Equal("Depot Finish", preview.DestinationPoint.Label);
            Assert.Equal(50.24000, preview.DestinationPoint.Latitude);
            Assert.Equal(3, preview.DestinationPoint.Order);

            Assert.Equal(4, preview.GeometryCoordinates.Count);
        }
    }
}

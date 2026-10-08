using RouteWise.Api.Models;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;
using RouteWise.Api.Services;

namespace RouteWise.Tests.Services
{
    public class RouteMatrixServiceTests
    {
        [Fact]
        public async Task BuildMatrix_WithKnownAddresses_ReturnsLocationsAndMatrix()
        {
            var geocodingProvider = new StaticGeocodingProvider();
            var routeProvider = new StaticRouteProvider();

            var service = new RouteMatrixService(geocodingProvider, routeProvider);

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

            var result = await service.BuildMatrixAsync(start, stops);

            Assert.Equal(3, result.Locations.Count);
            Assert.NotNull(result.Matrix);
            Assert.Equal(3, result.Matrix.TravelTimesMinutes.Count);
            Assert.Equal(3, result.Matrix.TravelTimesMinutes[0].Count);
        }

        [Fact]
        public async Task BuildMatrix_WithDestination_ReturnsLocationsAndMatrixIncludingDestination()
        {
            var geocodingProvider = new StaticGeocodingProvider();
            var routeProvider = new StaticRouteProvider();

            var service = new RouteMatrixService(geocodingProvider, routeProvider);

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
                Label = "Garage",
                Address = "Zhytomyr Central Square"
            };

            var result = await service.BuildMatrixAsync(start, stops, destination);

            Assert.Equal(4, result.Locations.Count);
            Assert.NotNull(result.Matrix);
            Assert.Equal(4, result.Matrix.TravelTimesMinutes.Count);
            Assert.Equal(4, result.Matrix.TravelTimesMinutes[0].Count);
        }

        [Fact]
        public async Task BuildMatrix_WithCoordinatesProvided_DoesNotCallGeocodingProvider()
        {
            var spyGeocodingProvider = new SpyGeocodingProvider();
            var routeProvider = new StaticRouteProvider();
            var service = new RouteMatrixService(spyGeocodingProvider, routeProvider);

            var start = new AddressInput
            {
                Label = "Start",
                Address = "Some Custom Address A",
                Latitude = 50.25,
                Longitude = 28.65
            };

            var stops = new List<RouteStop>
            {
                new RouteStop
                {
                    Id = "1",
                    Label = "Stop 1",
                    Address = "Some Custom Address B",
                    Latitude = 50.26,
                    Longitude = 28.66
                }
            };

            var destination = new AddressInput
            {
                Label = "Destination",
                Address = "Some Custom Address C",
                Latitude = 50.27,
                Longitude = 28.67
            };

            var result = await service.BuildMatrixAsync(start, stops, destination);

            Assert.Equal(0, spyGeocodingProvider.GeocodeCallCount);
            Assert.Equal(3, result.Locations.Count);
            Assert.Equal(50.25, result.Locations[0].Latitude);
            Assert.Equal(28.65, result.Locations[0].Longitude);
            Assert.Equal(50.26, result.Locations[1].Latitude);
            Assert.Equal(28.66, result.Locations[1].Longitude);
            Assert.Equal(50.27, result.Locations[2].Latitude);
            Assert.Equal(28.67, result.Locations[2].Longitude);
        }

        [Fact]
        public async Task BuildMatrix_WithMissingCoordinates_CallsGeocodingProviderFallback()
        {
            var spyGeocodingProvider = new SpyGeocodingProvider();
            var routeProvider = new StaticRouteProvider();
            var service = new RouteMatrixService(spyGeocodingProvider, routeProvider);

            var start = new AddressInput
            {
                Label = "Start",
                Address = "Manual Address Without Coords"
            };

            var stops = new List<RouteStop>
            {
                new RouteStop
                {
                    Id = "1",
                    Label = "Stop 1",
                    Address = "Another Manual Address"
                }
            };

            var result = await service.BuildMatrixAsync(start, stops);

            Assert.Equal(2, spyGeocodingProvider.GeocodeCallCount);
            Assert.Equal(2, result.Locations.Count);
        }

        private class SpyGeocodingProvider : IGeocodingProvider
        {
            public int GeocodeCallCount { get; private set; }

            public LocationPoint Geocode(string address) => throw new NotImplementedException();

            public Task<LocationPoint> GeocodeAsync(string address, CancellationToken cancellationToken = default)
            {
                GeocodeCallCount++;
                return Task.FromResult(new LocationPoint { Latitude = 50.0, Longitude = 30.0 });
            }

            public Task<IReadOnlyList<AddressSearchResult>> SearchAsync(string query, int limit = 5, string? city = null, CancellationToken cancellationToken = default)
                => Task.FromResult<IReadOnlyList<AddressSearchResult>>(Array.Empty<AddressSearchResult>());

            public Task<AddressSearchResult?> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
                => Task.FromResult<AddressSearchResult?>(null);
        }
    }
}

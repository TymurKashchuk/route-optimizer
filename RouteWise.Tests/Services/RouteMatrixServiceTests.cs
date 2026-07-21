using RouteWise.Api.Models;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;
using RouteWise.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RouteWise.Tests.Services
{
    public class RouteMatrixServiceTests
    {
        [Fact]
        public void BuildMatrix_WithKnownAddresses_ReturnsLocationsAndMatrix() 
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

            var result = service.BuildMatrix(start, stops);

            Assert.Equal(3, result.Locations.Count);
            Assert.NotNull(result.Matrix);
            Assert.Equal(3, result.Matrix.TravelTimesMinutes.Count);
            Assert.Equal(3, result.Matrix.TravelTimesMinutes[0].Count);
        }
    }
}

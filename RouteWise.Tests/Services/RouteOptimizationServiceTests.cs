using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
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
    public class RouteOptimizationServiceTests
    {
        [Fact]
        public void Optimize_WithOriginalAlgorithm_UsesOriginalOrderOptimizer()
        {
            var optimizers = new List<IRouteOptimizer>
            {
            new OriginalOrderOptimizer(),
            new NearestNeighborOptimizer()
            };

            var routeMatrixService = new RouteMatrixService(
                new StaticGeocodingProvider(),
                new StaticRouteProvider());

            var service = new RouteOptimizationService(optimizers, routeMatrixService);

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

            var result = service.Optimize("original", start, stops);

            Assert.Equal("original", result.Algorithm);
            Assert.Equal("Client A", result.OrderedStops[0].Label);
            Assert.Equal("Client B", result.OrderedStops[1].Label);
        }

        [Fact]
        public void Optimize_WithUnknownAlgorithm_ThrowsInvalidOperationException()
        {
            var optimizers = new List<IRouteOptimizer>
            {
                new OriginalOrderOptimizer(),
                new NearestNeighborOptimizer()
            };

            var routeMatrixService = new RouteMatrixService(
            new StaticGeocodingProvider(),
            new StaticRouteProvider());

            var service = new RouteOptimizationService(optimizers, routeMatrixService);

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

            Assert.Throws<InvalidOperationException>(() =>
                service.Optimize("does-not-exist", start, stops));
        }
    }
}

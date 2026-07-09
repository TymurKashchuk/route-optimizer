using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
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

            var service = new RouteOptimizationService(optimizers);

            var stops = new List<RouteStop>
            {
                new RouteStop { Id = "1", Label = "Client A", Address = "Address A", ServiceMinutes = 10 },
                new RouteStop { Id = "2", Label = "Client B", Address = "Address B", ServiceMinutes = 15 }
            };

            var result = service.Optimize("original", stops);

            Assert.Equal("original", result.Algorithm);
        }

        [Fact]
        public void Optimize_WithUnknownAlgorithm_ThrowsInvalidOperationException()
        {
            var optimizers = new List<IRouteOptimizer>
            {
                new OriginalOrderOptimizer(),
                new NearestNeighborOptimizer()
            };

            var service = new RouteOptimizationService(optimizers);

            var stops = new List<RouteStop>
            {
            new RouteStop { Id = "1", Label = "Client A", Address = "Address A", ServiceMinutes = 10 }
            };

            Assert.Throws<InvalidOperationException>(() => service.Optimize("does-not-exist", stops));
        }
    }
}

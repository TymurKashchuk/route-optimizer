using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RouteWise.Tests.Optimizers
{
    public class NearestNeighborOptimizerTests
    {
        [Fact]
        public void Optimize_WithoutMatrixYet_ReturnsStopsInCurrentOrder()
        {
            var optimizer = new NearestNeighborOptimizer();

            var stops = new List<RouteStop>
            {
            new RouteStop { Id = "1", Label = "Client A", Address = "Address A", ServiceMinutes = 10 },
            new RouteStop { Id = "2", Label = "Client B", Address = "Address B", ServiceMinutes = 15 }
            };

            var result = optimizer.Optimize(stops);

            Assert.Equal("nearest-neighbor", result.Algorithm);
            Assert.Equal(2, result.OrderedStops.Count);
            Assert.Equal("Client A", result.OrderedStops[0].Label);
            Assert.Equal("Client B", result.OrderedStops[1].Label);
        }
    }
}

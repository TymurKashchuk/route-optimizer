using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RouteWise.Tests.Optimizers
{
    public class OriginalOrderOptimizerTests
    {
        [Fact]
        public void Optimize_WithStops_ReturnsStopsInOriginalOrder() { 
            var optimizer = new OriginalOrderOptimizer();
            var stops = new List<RouteStop>
            {
            new RouteStop { Id = "1", Label = "Client A", Address = "Address A", ServiceMinutes = 10 },
            new RouteStop { Id = "2", Label = "Client B", Address = "Address B", ServiceMinutes = 15 },
            new RouteStop { Id = "3", Label = "Client C", Address = "Address C", ServiceMinutes = 20 }
            };

            var result = optimizer.Optimize(stops);
            Assert.Equal("original", result.Algorithm);
            Assert.Equal(3, result.OrderedStops.Count);
            Assert.Equal("Client A", result.OrderedStops[0].Label);
            Assert.Equal("Client B", result.OrderedStops[1].Label);
            Assert.Equal("Client C", result.OrderedStops[2].Label);
        }
    }
}

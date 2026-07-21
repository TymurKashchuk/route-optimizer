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
            new RouteStop { Id = "2", Label = "Client B", Address = "Address B", ServiceMinutes = 15 },
            new RouteStop { Id = "3", Label = "Client C", Address = "Address C", ServiceMinutes = 20 }
            };

            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
                {
                new() { 0, 15, 5, 20 },   
                new() { 15, 0, 8, 6 },   
                new() { 5, 8, 0, 4 },    
                new() { 20, 6, 4, 0 }    
                },
                DistancesKm = new List<List<double>>()
            };

            var result = optimizer.Optimize(stops,matrix);

            Assert.Equal("nearest-neighbor", result.Algorithm);
            Assert.Equal(3, result.OrderedStops.Count);

            Assert.Equal("Client B", result.OrderedStops[0].Label);
            Assert.Equal("Client C", result.OrderedStops[1].Label);
            Assert.Equal("Client A", result.OrderedStops[2].Label);

            Assert.Equal(1, result.OrderedStopIndices[0]);
            Assert.Equal(2, result.OrderedStopIndices[1]);
            Assert.Equal(0, result.OrderedStopIndices[2]);
        }
    }
}

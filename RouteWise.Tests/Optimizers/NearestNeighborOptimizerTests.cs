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

        [Fact]
        public void Optimize_WithDestinationMatrixIndex_TakesDestinationIntoAccountForLastStops()
        {
            var optimizer = new NearestNeighborOptimizer();

            var stops = new List<RouteStop>
            {
                new() { Id = "1", Label = "Stop A", Address = "Address A" },
                new() { Id = "2", Label = "Stop B", Address = "Address B" }
            };

            // Indices: 0 = Start, 1 = Stop A, 2 = Stop B, 3 = Destination
            var matrix = new RouteMatrix
            {
                TravelTimesSeconds = new List<List<int>>
                {
                    new() { 0, 100, 100, 200 },    // 0: Start
                    new() { 100, 0, 50, 500 },     // 1: Stop A (far from Dest: 500s)
                    new() { 100, 50, 0, 50 },      // 2: Stop B (close to Dest: 50s)
                    new() { 200, 500, 50, 0 }      // 3: Destination
                }
            };

            // Start -> A -> B -> Dest = 100 + 50 + 50 = 200s
            // Start -> B -> A -> Dest = 100 + 50 + 500 = 650s
            var result = optimizer.Optimize(stops, matrix, destinationMatrixIndex: 3);

            Assert.Equal("Stop A", result.OrderedStops[0].Label);
            Assert.Equal("Stop B", result.OrderedStops[1].Label);
        }
    }
}

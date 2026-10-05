using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;
using RouteWise.Api.Services;
using System.Collections.Generic;
using Xunit;

namespace RouteWise.Tests.Optimizers
{
    public class TwoOptOptimizerTests
    {
        [Fact]
        public void Optimize_WhenTwoStops_ReturnsOptimizedRoute()
        {
            var optimizer = new TwoOptOptimizer();

            var stops = new List<RouteStop>
            {
                new() { Id = "1", Label = "Client A", Address = "Address A" },
                new() { Id = "2", Label = "Client B", Address = "Address B" }
            };

            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
                {
                    new() { 0, 15, 5 }, // Start A: 15 хв, Start B: 5 хв
                    new() { 15, 0, 8 },
                    new() { 5, 8, 0 }
                },
                DistancesKm = new List<List<double>>()
            };

            var result = optimizer.Optimize(stops, matrix);

            Assert.Equal("two-opt", result.Algorithm);
            Assert.Equal(2, result.OrderedStops.Count);
            Assert.Equal("Client B", result.OrderedStops[0].Label);
            Assert.Equal("Client A", result.OrderedStops[1].Label);
        }

        [Fact]
        public void Optimize_WhenNearestNeighborMakesSuboptimalGreedyChoice_ImprovesRoute()
        {
            var nnOptimizer = new NearestNeighborOptimizer();
            var twoOptOptimizer = new TwoOptOptimizer();
            var metricsService = new MetricsService();

            var stops = new List<RouteStop>
            {
                new() { Id = "1", Label = "Client 1", Address = "Addr 1" },
                new() { Id = "2", Label = "Client 2", Address = "Addr 2" },
                new() { Id = "3", Label = "Client 3", Address = "Addr 3" },
                new() { Id = "4", Label = "Client 4", Address = "Addr 4" }
            };

            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
                {
                    new() { 0,  5,  6, 50, 50 },
                    new() { 5,  0, 20,  6, 25 },
                    new() { 6, 20,  0, 25,  5 },
                    new() { 50, 6, 25,  0,  5 },
                    new() { 50, 25, 30, 5,  0 }
                },
                DistancesKm = new List<List<double>>
                {
                    new() { 0, 1, 1, 1, 1 },
                    new() { 1, 0, 1, 1, 1 },
                    new() { 1, 1, 0, 1, 1 },
                    new() { 1, 1, 1, 0, 1 },
                    new() { 1, 1, 1, 1, 0 }
                }
            };

            var nnResult = nnOptimizer.Optimize(stops, matrix);
            var nnMetrics = metricsService.Calculate(nnResult.OrderedStops, nnResult.OrderedStopIndices, matrix);

            var twoOptResult = twoOptOptimizer.Optimize(stops, matrix);
            var twoOptMetrics = metricsService.Calculate(twoOptResult.OrderedStops, twoOptResult.OrderedStopIndices, matrix);

            Assert.Equal("two-opt", twoOptResult.Algorithm);
            Assert.True(twoOptMetrics.TotalTravelMinutes < nnMetrics.TotalTravelMinutes,
                $"Two-Opt ({twoOptMetrics.TotalTravelMinutes} хв) має бути швидшим за NN ({nnMetrics.TotalTravelMinutes} хв)");
            Assert.Equal(22, twoOptMetrics.TotalTravelMinutes);
        }

        [Fact]
        public void Optimize_WithFixedDestination_ConsidersDestinationAndReordersStops()
        {
            var optimizer = new TwoOptOptimizer();

            var stops = new List<RouteStop>
            {
                new() { Id = "1", Label = "Client A", Address = "Addr A" },
                new() { Id = "2", Label = "Client B", Address = "Addr B" }
            };

            // 0: Start, 1: Stop A, 2: Stop B, 3: Destination
            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
                {
                    new() { 0,   5,  10, 50 },  // Start -> A (5 хв), Start -> B (10 хв)
                    new() { 5,   0,  10,  2 },  // A -> B (10 хв), A -> Dest (2 хв!)
                    new() { 10, 10,   0, 80 },  // B -> A (10 хв), B -> Dest (80 хв!)
                    new() { 50,  2,  80,  0 }   // Dest
                },
                DistancesKm = new List<List<double>>()
            };

            // NN обере спочатку найближчий до старту Stop A (5 хв vs 10 хв), даючи порядок [A, B]
            // Але від B до Dest аж 80 хв (разом: 5 + 10 + 80 = 95 хв).
            // Порядок [B, A] дає: Start->B (10) + B->A (10) + A->Dest (2) = 22 хв!
            var result = optimizer.Optimize(stops, matrix, destinationMatrixIndex: 3);

            Assert.Equal("two-opt", result.Algorithm);
            Assert.Equal(2, result.OrderedStops.Count);
            Assert.Equal("Client B", result.OrderedStops[0].Label);
            Assert.Equal("Client A", result.OrderedStops[1].Label);
        }
    }
}

using RouteWise.Api.Models;
using RouteWise.Api.Services;

namespace RouteWise.Tests.Services
{
    public class MetricsServiceTests
    {
        [Fact]
        public void Calculate_WithSecondsMatrix_PreventsAccumulatedRoundingErrors()
        {
            var service = new MetricsService();

            var stops = new List<RouteStop>
            {
                new() { Id = "1", Label = "Stop 1", ServiceMinutes = 5 },
                new() { Id = "2", Label = "Stop 2", ServiceMinutes = 10 }
            };
            var indices = new List<int> { 0, 1 };

            // 0 -> 1: 85s (1.41 min)
            // 1 -> 2: 85s (1.41 min)
            // 2 -> 3 (dest): 85s (1.41 min)
            // Total seconds = 255s = 4.25 min -> rounds to 4 min.
            // If rounded per-leg (85s -> 1 min each), total would incorrectly be 3 min.
            var matrix = new RouteMatrix
            {
                TravelTimesSeconds = new List<List<int>>
                {
                    new() { 0, 85, 0, 0 },
                    new() { 0, 0, 85, 0 },
                    new() { 0, 0, 0, 85 },
                    new() { 0, 0, 0, 0 }
                },
                DistancesKm = new List<List<double>>
                {
                    new() { 0, 1.2, 0, 0 },
                    new() { 0, 0, 1.2, 0 },
                    new() { 0, 0, 0, 1.2 },
                    new() { 0, 0, 0, 0 }
                }
            };

            var metrics = service.Calculate(stops, indices, matrix, destinationMatrixIndex: 3);

            Assert.Equal(4, metrics.TotalTravelMinutes);
            Assert.Equal(15, metrics.TotalServiceMinutes);
            Assert.Equal(3.6, metrics.TotalDistanceKm);
        }

        [Fact]
        public void Calculate_WithMinutesOnlyMatrix_FallsBackGracefully()
        {
            var service = new MetricsService();

            var stops = new List<RouteStop>
            {
                new() { Id = "1", Label = "Stop 1", ServiceMinutes = 0 }
            };
            var indices = new List<int> { 0 };

            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
                {
                    new() { 0, 15 },
                    new() { 15, 0 }
                },
                DistancesKm = new List<List<double>>
                {
                    new() { 0, 10.0 },
                    new() { 10.0, 0 }
                }
            };

            var metrics = service.Calculate(stops, indices, matrix);

            Assert.Equal(15, metrics.TotalTravelMinutes);
            Assert.Equal(10.0, metrics.TotalDistanceKm);
        }
    }
}

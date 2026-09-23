using RouteWise.Api.Models;
using RouteWise.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RouteWise.Tests.Services
{
    public class RouteComparisonServiceTests
    {
        [Fact]
        public void Compare_WithBetterOptimizedMetrics_ReturnsSavedValuesAndImprovementPercent() {
            var service = new RouteComparisonService();

            var original = new RouteMetrics
            {
                TotalTravelMinutes = 100,
                TotalDistanceKm = 50,
                TotalServiceMinutes = 30
            };

            var optimized = new RouteMetrics
            {
                TotalTravelMinutes = 80,
                TotalDistanceKm = 42,
                TotalServiceMinutes = 30
            };

            var result = service.Compare(original, optimized);

            Assert.Equal(20, result.SavedMinutes);
            Assert.Equal(8, result.SavedDistanceKm);
            Assert.Equal(20, result.ImprovementPercent);
        }

        [Fact]
        public void Compare_WithZeroOriginalTravelMinutes_ReturnsZeroImprovementPercent()
        {
            var service = new RouteComparisonService();

            var original = new RouteMetrics
            {
                TotalTravelMinutes = 0,
                TotalDistanceKm = 0,
                TotalServiceMinutes = 10
            };

            var optimized = new RouteMetrics
            {
                TotalTravelMinutes = 0,
                TotalDistanceKm = 0,
                TotalServiceMinutes = 10
            };

            var result = service.Compare(original, optimized);

            Assert.Equal(0, result.SavedMinutes);
            Assert.Equal(0, result.SavedDistanceKm);
            Assert.Equal(0, result.ImprovementPercent);
        }
    }
}

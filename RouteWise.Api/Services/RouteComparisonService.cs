using RouteWise.Api.Models;

namespace RouteWise.Api.Services
{
    public class RouteComparisonService
    {
        public RouteComparisonResult Compare(RouteMetrics original, RouteMetrics optimized)
        {
            var savedMinutes = original.TotalTravelMinutes - optimized.TotalTravelMinutes;
            var savedDistanceKm = original.TotalDistanceKm - optimized.TotalDistanceKm;

            double improvementPercent = 0;

            if (original.TotalTravelMinutes > 0)
            {
                improvementPercent = (double)savedMinutes / original.TotalTravelMinutes * 100;
            }

            return new RouteComparisonResult
            {
                SavedMinutes = savedMinutes,
                SavedDistanceKm = Math.Round(savedDistanceKm, 2),
                ImprovementPercent = Math.Round(improvementPercent, 2)
            };
        }
    }
}

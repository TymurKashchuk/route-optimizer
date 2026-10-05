using RouteWise.Api.Models;

namespace RouteWise.Api.Services
{
    public class MetricsService
    {
        public RouteMetrics Calculate(
            List<RouteStop> orderedStops,
            List<int> orderedStopIndices,
            RouteMatrix matrix,
            int? destinationMatrixIndex = null)
        { 
            var totalTravelMinutes = 0;
            var totalDistanceKm = 0.0;
            var totalServiceMinutes = orderedStops.Sum(stop => stop.ServiceMinutes);

            var currentMatrixIndex = 0;

            for (int i = 0; i < orderedStopIndices.Count; i++)
            {
                var nextMatrixIndex = orderedStopIndices[i] + 1;

                totalTravelMinutes += matrix.TravelTimesMinutes[currentMatrixIndex][nextMatrixIndex];
                totalDistanceKm += matrix.DistancesKm[currentMatrixIndex][nextMatrixIndex];

                currentMatrixIndex = nextMatrixIndex;
            }

            if (destinationMatrixIndex.HasValue)
            {
                totalTravelMinutes += matrix.TravelTimesMinutes[currentMatrixIndex][destinationMatrixIndex.Value];
                totalDistanceKm += matrix.DistancesKm[currentMatrixIndex][destinationMatrixIndex.Value];
            }

            return new RouteMetrics
            {
                TotalTravelMinutes = totalTravelMinutes,
                TotalDistanceKm = Math.Round(totalDistanceKm, 2),
                TotalServiceMinutes = totalServiceMinutes
            };
        }
    }
}

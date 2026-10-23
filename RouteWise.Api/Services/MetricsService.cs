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
            var totalTravelSeconds = 0;
            var totalDistanceKm = 0.0;
            var totalServiceMinutes = orderedStops.Sum(stop => stop.ServiceMinutes);

            var currentMatrixIndex = 0;

            for (int i = 0; i < orderedStopIndices.Count; i++)
            {
                var nextMatrixIndex = orderedStopIndices[i] + 1;

                totalTravelSeconds += matrix.GetTravelTimeSeconds(currentMatrixIndex, nextMatrixIndex);
                totalDistanceKm += matrix.DistancesKm[currentMatrixIndex][nextMatrixIndex];

                currentMatrixIndex = nextMatrixIndex;
            }

            if (destinationMatrixIndex.HasValue)
            {
                totalTravelSeconds += matrix.GetTravelTimeSeconds(currentMatrixIndex, destinationMatrixIndex.Value);
                totalDistanceKm += matrix.DistancesKm[currentMatrixIndex][destinationMatrixIndex.Value];
            }

            var totalTravelMinutes = (int)Math.Round(totalTravelSeconds / 60.0);

            return new RouteMetrics
            {
                TotalTravelMinutes = totalTravelMinutes,
                TotalDistanceKm = Math.Round(totalDistanceKm, 2),
                TotalServiceMinutes = totalServiceMinutes
            };
        }
    }
}

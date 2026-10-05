using RouteWise.Api.Models;

namespace RouteWise.Api.Optimizers
{
    public class NearestNeighborOptimizer : IRouteOptimizer
    {
        public string AlgorithmName => "nearest-neighbor";

        public OptimizationResult Optimize(List<RouteStop> stops, RouteMatrix matrix, int? destinationMatrixIndex = null)
        {
            var orderedStops = new List<RouteStop>();
            var orderedIndices = new List<int>();

            var visited = new HashSet<int>();
            var currentMatrixIndex = 0;

            while (orderedStops.Count < stops.Count)
            {
                int? bestStopIndex = null;
                int bestTravelTime = int.MaxValue;

                for (int stopIndex = 0; stopIndex < stops.Count; stopIndex++)
                {
                    if (visited.Contains(stopIndex))
                    {
                        continue;
                    }

                    var candidateMatrixIndex = stopIndex + 1;
                    var travelTime = matrix.TravelTimesMinutes[currentMatrixIndex][candidateMatrixIndex];

                    if (travelTime < bestTravelTime)
                    {
                        bestTravelTime = travelTime;
                        bestStopIndex = stopIndex;
                    }
                }

                if (bestStopIndex is null)
                {
                    break;
                }

                visited.Add(bestStopIndex.Value);
                orderedStops.Add(stops[bestStopIndex.Value]);
                orderedIndices.Add(bestStopIndex.Value);

                currentMatrixIndex = bestStopIndex.Value + 1;
            }

            return new OptimizationResult
            {
                Algorithm = AlgorithmName,
                OrderedStops = orderedStops,
                OrderedStopIndices = orderedIndices
            };
        }
    }
}

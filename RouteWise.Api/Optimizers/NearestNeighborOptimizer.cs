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
                var remainingCount = stops.Count - visited.Count;

                if (remainingCount == 1)
                {
                    for (int s = 0; s < stops.Count; s++)
                    {
                        if (!visited.Contains(s))
                        {
                            visited.Add(s);
                            orderedStops.Add(stops[s]);
                            orderedIndices.Add(s);
                            break;
                        }
                    }
                    break;
                }

                if (destinationMatrixIndex.HasValue && remainingCount == 2)
                {
                    var remaining = new List<int>(2);
                    for (int s = 0; s < stops.Count; s++)
                    {
                        if (!visited.Contains(s)) remaining.Add(s);
                    }

                    int s1 = remaining[0], s2 = remaining[1];
                    int idx1 = s1 + 1, idx2 = s2 + 1;
                    int cost1Then2 = matrix.GetTravelTimeSeconds(currentMatrixIndex, idx1) +
                                     matrix.GetTravelTimeSeconds(idx1, idx2) +
                                     matrix.GetTravelTimeSeconds(idx2, destinationMatrixIndex.Value);
                    int cost2Then1 = matrix.GetTravelTimeSeconds(currentMatrixIndex, idx2) +
                                     matrix.GetTravelTimeSeconds(idx2, idx1) +
                                     matrix.GetTravelTimeSeconds(idx1, destinationMatrixIndex.Value);

                    int chosen = cost1Then2 <= cost2Then1 ? s1 : s2;
                    visited.Add(chosen);
                    orderedStops.Add(stops[chosen]);
                    orderedIndices.Add(chosen);
                    currentMatrixIndex = chosen + 1;
                    continue;
                }

                int? bestStopIndex = null;
                int bestTravelTime = int.MaxValue;

                for (int stopIndex = 0; stopIndex < stops.Count; stopIndex++)
                {
                    if (visited.Contains(stopIndex))
                    {
                        continue;
                    }

                    var candidateMatrixIndex = stopIndex + 1;
                    var travelTime = matrix.GetTravelTimeSeconds(currentMatrixIndex, candidateMatrixIndex);

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

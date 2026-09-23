using RouteWise.Api.Models;

namespace RouteWise.Api.Optimizers
{
    public class TwoOptOptimizer : IRouteOptimizer
    {
        private readonly IRouteOptimizer _initialOptimizer;

        public string AlgorithmName => "two-opt";

        public TwoOptOptimizer(IRouteOptimizer? initialOptimizer = null)
        {
            _initialOptimizer = initialOptimizer ?? new NearestNeighborOptimizer();
        }

        public OptimizationResult Optimize(List<RouteStop> stops, RouteMatrix matrix)
        {
            if (stops.Count <= 2)
            {
                var baseResult = _initialOptimizer.Optimize(stops, matrix);
                return new OptimizationResult
                {
                    Algorithm = AlgorithmName,
                    OrderedStops = baseResult.OrderedStops,
                    OrderedStopIndices = baseResult.OrderedStopIndices
                };
            }

            var initialResult = _initialOptimizer.Optimize(stops, matrix);
            var bestRoute = new List<int>(initialResult.OrderedStopIndices);
            var bestTime = CalculateTotalTravelTime(bestRoute, matrix);

            bool improved = true;
            while (improved)
            {
                improved = false;

                for (int i = 0; i < bestRoute.Count - 1; i++)
                {
                    for (int j = i + 1; j < bestRoute.Count; j++)
                    {
                        var candidateRoute = TwoOptSwap(bestRoute, i, j);
                        var candidateTime = CalculateTotalTravelTime(candidateRoute, matrix);

                        if (candidateTime < bestTime)
                        {
                            bestRoute = candidateRoute;
                            bestTime = candidateTime;
                            improved = true;
                            break;
                        }
                    }

                    if (improved)
                    {
                        break;
                    }
                }
            }

            return new OptimizationResult
            {
                Algorithm = AlgorithmName,
                OrderedStops = bestRoute.Select(index => stops[index]).ToList(),
                OrderedStopIndices = bestRoute
            };
        }

        private static List<int> TwoOptSwap(List<int> route, int i, int j)
        {
            var newRoute = new List<int>(route.Count);

            for (int k = 0; k < i; k++)
            {
                newRoute.Add(route[k]);
            }

            for (int k = j; k >= i; k--)
            {
                newRoute.Add(route[k]);
            }

            for (int k = j + 1; k < route.Count; k++)
            {
                newRoute.Add(route[k]);
            }

            return newRoute;
        }

        private static int CalculateTotalTravelTime(List<int> routeIndices, RouteMatrix matrix)
        {
            var total = 0;
            var currentMatrixIndex = 0;

            for (int k = 0; k < routeIndices.Count; k++)
            {
                var nextMatrixIndex = routeIndices[k] + 1;
                total += matrix.TravelTimesMinutes[currentMatrixIndex][nextMatrixIndex];
                currentMatrixIndex = nextMatrixIndex;
            }

            return total;
        }
    }
}

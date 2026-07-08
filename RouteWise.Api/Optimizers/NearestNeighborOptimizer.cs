using RouteWise.Api.Models;

namespace RouteWise.Api.Optimizers
{
    public class NearestNeighborOptimizer : IRouteOptimizer
    {
        public string AlgorithmName => "nearest-neighbor";

        public OptimizationResult Optimize(List<RouteStop> stops) {
            return new OptimizationResult
            {
                Algorithm = AlgorithmName,
                OrderedStops = stops.ToList()
            };
        }
    }
}

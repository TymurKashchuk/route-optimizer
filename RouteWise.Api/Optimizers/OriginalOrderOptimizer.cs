using RouteWise.Api.Models;

namespace RouteWise.Api.Optimizers
{
    public class OriginalOrderOptimizer : IRouteOptimizer
    {
        public string AlgorithmName => "Original Order";

        public OptimizationResult Optimize(List<RouteStop> stops) {
            return new OptimizationResult
            {
                Algorithm = AlgorithmName,
                OrderedStops = stops.ToList()
            };
        }
    }
}

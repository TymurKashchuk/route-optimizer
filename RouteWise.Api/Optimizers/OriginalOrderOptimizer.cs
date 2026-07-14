using RouteWise.Api.Models;

namespace RouteWise.Api.Optimizers
{
    public class OriginalOrderOptimizer : IRouteOptimizer
    {
        public string AlgorithmName => "original";

        public OptimizationResult Optimize(List<RouteStop> stops, RouteMatrix matrix)
        {
            return new OptimizationResult
            {
                Algorithm = AlgorithmName,
                OrderedStops = stops.ToList(),
                OrderedStopIndices = Enumerable.Range(0, stops.Count).ToList()
            };
        }
    }
}

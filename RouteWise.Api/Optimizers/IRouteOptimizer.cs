using RouteWise.Api.Models;

namespace RouteWise.Api.Optimizers
{
    public interface IRouteOptimizer
    {
        string AlgorithmName { get; }

        OptimizationResult Optimize(List<RouteStop> stops);
    }
}

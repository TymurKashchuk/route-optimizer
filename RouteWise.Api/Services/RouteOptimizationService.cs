using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;

namespace RouteWise.Api.Services
{
    public class RouteOptimizationService
    {
        private readonly IEnumerable<IRouteOptimizer> _optimizers;

        public RouteOptimizationService(IEnumerable<IRouteOptimizer> optimizers) 
        { 
            _optimizers = optimizers;
        }

        public OptimizationResult Optimize(string algorithm, List<RouteStop> stops) {
            var optimizer = _optimizers.FirstOrDefault(o => o.AlgorithmName.Equals(algorithm, StringComparison.OrdinalIgnoreCase));

            if (optimizer is null)
            {
                throw new InvalidOperationException($"Unknown algorithm: {algorithm}");
            }

            return optimizer.Optimize(stops);
        }
    }
}

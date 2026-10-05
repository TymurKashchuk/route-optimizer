using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;

namespace RouteWise.Api.Services
{
    public class RouteOptimizationService
    {
        private readonly IEnumerable<IRouteOptimizer> _optimizers;
        private readonly RouteMatrixService _routeMatrixService;

        public RouteOptimizationService(
            IEnumerable<IRouteOptimizer> optimizers,
            RouteMatrixService routeMatrixService)
        {
            _optimizers = optimizers;
            _routeMatrixService = routeMatrixService;
        }

        public Task<OptimizationResult> OptimizeAsync(
            string algorithm,
            AddressInput start,
            List<RouteStop> stops,
            CancellationToken cancellationToken = default)
        {
            return OptimizeAsync(algorithm, start, stops, null, cancellationToken);
        }

        public async Task<OptimizationResult> OptimizeAsync(
            string algorithm,
            AddressInput start,
            List<RouteStop> stops,
            AddressInput? destination,
            CancellationToken cancellationToken = default)
        {
            var optimizer = _optimizers.FirstOrDefault(o =>
                o.AlgorithmName.Equals(algorithm, StringComparison.OrdinalIgnoreCase));

            if (optimizer is null)
            {
                throw new InvalidOperationException($"Unknown algorithm: {algorithm}");
            }

            var matrixResult = await _routeMatrixService.BuildMatrixAsync(start, stops, destination, cancellationToken);
            int? destinationMatrixIndex = destination != null ? stops.Count + 1 : null;

            return optimizer.Optimize(stops, matrixResult.Matrix, destinationMatrixIndex);
        }
    }
}

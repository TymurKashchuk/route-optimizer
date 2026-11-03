namespace RouteWise.Api.Optimizers
{
    public class RouteOptimizerRegistry : IRouteOptimizerRegistry
    {
        private readonly Dictionary<string, IRouteOptimizer> _optimizers;

        public RouteOptimizerRegistry(IEnumerable<IRouteOptimizer> optimizers)
        {
            _optimizers = new Dictionary<string, IRouteOptimizer>(StringComparer.OrdinalIgnoreCase);

            foreach (var optimizer in optimizers)
            {
                if (!string.IsNullOrWhiteSpace(optimizer.AlgorithmName))
                {
                    _optimizers[optimizer.AlgorithmName] = optimizer;
                }
            }
        }

        public IRouteOptimizer? GetOptimizer(string algorithmName)
        {
            if (string.IsNullOrWhiteSpace(algorithmName))
            {
                return null;
            }

            return _optimizers.TryGetValue(algorithmName, out var optimizer) ? optimizer : null;
        }

        public IReadOnlyCollection<string> GetAvailableAlgorithmNames()
        {
            return _optimizers.Keys;
        }

        public bool IsSupported(string algorithmName)
        {
            if (string.IsNullOrWhiteSpace(algorithmName))
            {
                return false;
            }

            return _optimizers.ContainsKey(algorithmName);
        }
    }
}

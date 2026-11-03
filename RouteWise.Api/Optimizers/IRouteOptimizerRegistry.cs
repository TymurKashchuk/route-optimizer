namespace RouteWise.Api.Optimizers
{
    public interface IRouteOptimizerRegistry
    {
        IRouteOptimizer? GetOptimizer(string algorithmName);

        IReadOnlyCollection<string> GetAvailableAlgorithmNames();

        bool IsSupported(string algorithmName);
    }
}

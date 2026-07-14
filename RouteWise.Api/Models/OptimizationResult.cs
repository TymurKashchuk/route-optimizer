namespace RouteWise.Api.Models
{
    public class OptimizationResult
    {
        public string Algorithm { get; set; } = string.Empty;

        public List<RouteStop> OrderedStops { get; set; } = new();

        public List<int> OrderedStopIndices { get; set; } = new();
    }
}

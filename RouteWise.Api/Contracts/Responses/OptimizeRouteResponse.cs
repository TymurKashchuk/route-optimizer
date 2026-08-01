namespace RouteWise.Api.Contracts.Responses
{
    public class OptimizeRouteResponse
    {
        public string Algorithm { get; set; } = string.Empty;

        public RouteMetricsDto Original { get; set; } = new();

        public RouteMetricsDto Optimized { get; set; } = new();

        public int SavedMinutes { get; set; }

        public double SavedDistanceKm { get; set; }

        public double ImprovementPercent { get; set; }

        public List<string> OrderedStops { get; set; } = new();

        public List<RouteStepDto> ExplanationSteps { get; set; } = new();

        public List<TimelineItemDto> Timeline { get; set; } = new();
    }
}

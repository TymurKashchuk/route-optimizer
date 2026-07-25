namespace RouteWise.Api.Contracts.Responses
{
    public class OptimizeRouteResponse
    {
        public string Algorithm { get; set; } = string.Empty;

        public RouteMetricsDto Optimized { get; set; } = new();

        public List<string> OrderedStops { get; set; } = new();

        public List<TimelineItemDto> Timeline { get; set; } = new();
    }
}

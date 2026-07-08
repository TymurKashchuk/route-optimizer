namespace RouteWise.Api.Contracts.Responses
{
    public class OptimizeRouteResponse
    {
        public string Algorithm { get; set; } = string.Empty;
        public int TotalStops { get; set; }

        public string StartLabel { get; set; } = string.Empty;

        public List<string> OrderedStops { get; set; } = new();

        public int TotalServiceMinutes { get; set; }
    }
}

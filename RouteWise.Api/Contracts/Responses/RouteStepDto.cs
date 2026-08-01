namespace RouteWise.Api.Contracts.Responses
{
    public class RouteStepDto
    {
        public string From { get; set; } = string.Empty;

        public string To { get; set; } = string.Empty;

        public int TravelMinutes { get; set; }
    }
}

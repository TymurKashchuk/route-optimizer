namespace RouteWise.Api.Contracts.Responses
{
    public class TimelineItemDto
    {
        public string Label { get; set; } = string.Empty;

        public DateTime ArrivalTime { get; set; }

        public DateTime DepartureTime { get; set; }
    }
}

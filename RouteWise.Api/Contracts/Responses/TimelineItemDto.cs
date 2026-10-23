namespace RouteWise.Api.Contracts.Responses
{
    public class TimelineItemDto
    {
        public string Label { get; set; } = string.Empty;

        public DateTimeOffset ArrivalTime { get; set; }

        public DateTimeOffset DepartureTime { get; set; }
    }
}

namespace RouteWise.Api.Models
{
    public class TimelineItem
    {
        public string Label { get; set; } = string.Empty;
        public DateTimeOffset ArrivalTime { get; set; }
        public DateTimeOffset DepartureTime { get; set; }
    }
}

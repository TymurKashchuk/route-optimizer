namespace RouteWise.Api.Models
{
    public class TimelineItem
    {
        public string Label { get; set; } = string.Empty;
        public DateTime ArrivalTime { get; set; }
        public DateTime DepartureTime { get; set; }
    }
}

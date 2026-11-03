namespace RouteWise.Api.Models
{
    public class RouteMetrics
    {
        public int TotalTravelMinutes { get; set; }

        /// <summary>Exact travel time. Used for scheduling so rounding never accumulates.</summary>
        public int TotalTravelSeconds { get; set; }
        public double TotalDistanceKm { get; set; }
        public int TotalServiceMinutes { get; set; }
    }
}

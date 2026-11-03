using RouteWise.Api.Models;

namespace RouteWise.Api.Contracts.Requests
{
    public class OptimizeRouteRequest
    {
        public string Algorithm { get; set; } = string.Empty;

        public string PlanningMode { get; set; } = "depart-at";

        public string TravelMode { get; set; } = Models.TravelMode.Driving;

        public DateTimeOffset? DepartureTime { get; set; }

        public DateTimeOffset? ArrivalBy { get; set; }

        public AddressInput Start { get; set; } = new();

        public AddressInput Destination { get; set; } = new();

        public List<RouteStop> Stops { get; set; } = new();
    }
}

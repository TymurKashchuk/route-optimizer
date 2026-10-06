using RouteWise.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace RouteWise.Api.Contracts.Requests
{
    public class OptimizeRouteRequest
    {
        [Required]
        public string Algorithm { get; set; } = string.Empty;

        public string PlanningMode { get; set; } = "depart-at";

        public DateTime? DepartureTime { get; set; }

        public DateTime? ArrivalBy { get; set; }

        [Required]
        public AddressInput Start { get; set; } = new();

        [Required]
        public AddressInput Destination { get; set; } = new();

        [Required]
        [MaxLength(10)]
        public List<RouteStop> Stops { get; set; } = new();
    }
}

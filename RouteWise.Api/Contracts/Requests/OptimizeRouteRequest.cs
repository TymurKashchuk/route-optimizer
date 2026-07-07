using RouteWise.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace RouteWise.Api.Contracts.Requests
{
    public class OptimizeRouteRequest
    {
        [Required]
        public string Algorithm { get; set; } = string.Empty;

        [Required]
        public DateTime DepartureTime { get; set; }

        [Required]
        public AddressInput Start { get; set; } = new();

        [Required]
        [MinLength(1)]
        [MaxLength(10)]
        public List<RouteStop> Stops { get; set; } = new();
    }
}

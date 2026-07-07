using System.ComponentModel.DataAnnotations;

namespace RouteWise.Api.Models
{
    public class RouteStop
    {
        [Required]
        public string Id { get; set; } = string.Empty;

        [Required]
        public string Label { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Range(0, 480)]
        public int ServiceMinutes { get; set; }
    }
}

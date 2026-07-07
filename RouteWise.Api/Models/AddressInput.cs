using System.ComponentModel.DataAnnotations;

namespace RouteWise.Api.Models
{
    public class AddressInput
    {
        [Required]
        public string Label { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;
    }
}

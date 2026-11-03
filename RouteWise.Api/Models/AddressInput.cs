namespace RouteWise.Api.Models
{
    public class AddressInput
    {
        public string Label { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }
    }
}

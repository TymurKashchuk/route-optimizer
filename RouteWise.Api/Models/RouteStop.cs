namespace RouteWise.Api.Models
{
    public class RouteStop
    {
        public string Id { get; set; } = string.Empty;

        public string Label { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public int ServiceMinutes { get; set; }

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }
    }
}

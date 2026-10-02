namespace RouteWise.Api.Models
{
    public class AddressSearchResult
    {
        public string Address { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public LocationPoint Coordinates { get; set; } = new();
        public double? Confidence { get; set; }
    }
}

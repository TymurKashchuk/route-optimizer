using System.Text.Json.Serialization;

namespace RouteWise.Api.Providers.Geocoding.OpenRouteService
{
    public class OrsGeocodingResponse
    {
        [JsonPropertyName("features")]
        public List<OrsGeoFeature> Features { get; set; } = new();
    }

    public class OrsGeoFeature
    {
        [JsonPropertyName("geometry")]
        public OrsGeoGeometry? Geometry { get; set; }

        [JsonPropertyName("properties")]
        public OrsGeoProperties? Properties { get; set; }
    }

    public class OrsGeoGeometry
    {
        [JsonPropertyName("coordinates")]
        public List<double> Coordinates { get; set; } = new();
    }

    public class OrsGeoProperties
    {
        [JsonPropertyName("label")]
        public string Label { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("confidence")]
        public double? Confidence { get; set; }
    }
}

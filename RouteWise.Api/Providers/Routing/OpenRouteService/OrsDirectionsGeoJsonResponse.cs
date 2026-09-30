using System.Text.Json.Serialization;

namespace RouteWise.Api.Providers.Routing.OpenRouteService
{
    public class OrsDirectionsGeoJsonResponse
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("features")]
        public List<OrsFeature>? Features { get; set; }
    }

    public class OrsFeature
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("geometry")]
        public OrsGeometry? Geometry { get; set; }
    }

    public class OrsGeometry
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("coordinates")]
        public List<List<double>>? Coordinates { get; set; }
    }
}

using System.Text.Json.Serialization;

namespace RouteWise.Api.Providers.Routing.OpenRouteService
{
    public class OrsMatrixRequest
    {
        [JsonPropertyName("locations")]
        public List<List<double>> Locations { get; set; } = new();

        [JsonPropertyName("metrics")]
        public List<string> Metrics { get; set; } = new() { "duration", "distance" };
    }
}

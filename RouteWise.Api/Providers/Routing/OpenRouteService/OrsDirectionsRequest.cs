using System.Text.Json.Serialization;

namespace RouteWise.Api.Providers.Routing.OpenRouteService
{
    public class OrsDirectionsRequest
    {
        [JsonPropertyName("coordinates")]
        public List<List<double>> Coordinates { get; set; } = new();
    }
}

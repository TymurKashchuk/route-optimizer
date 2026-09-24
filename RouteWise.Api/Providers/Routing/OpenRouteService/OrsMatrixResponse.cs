using System.Text.Json.Serialization;

namespace RouteWise.Api.Providers.Routing.OpenRouteService
{
    public class OrsMatrixResponse
    {
        [JsonPropertyName("durations")]
        public List<List<double?>>? Durations { get; set; }

        [JsonPropertyName("distances")]
        public List<List<double?>>? Distances { get; set; }
    }
}

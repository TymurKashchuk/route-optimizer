namespace RouteWise.Api.Options
{
    public class OpenRouteServiceOptions
    {
        public const string SectionName = "OpenRouteService";

        public string BaseUrl { get; set; } = "https://api.openrouteservice.org";

        public string ApiKey { get; set; } = string.Empty;

        public int TimeoutSeconds { get; set; } = 10;
    }
}

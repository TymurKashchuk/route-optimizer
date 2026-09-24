using Microsoft.Extensions.Options;
using RouteWise.Api.Models;
using RouteWise.Api.Options;

namespace RouteWise.Api.Providers.Routing
{
    public class OpenRouteServiceRouteProvider : IRouteProvider
    {
        private readonly HttpClient _httpClient;
        private readonly OpenRouteServiceOptions _options;

        public OpenRouteServiceRouteProvider(
            HttpClient httpClient,
            IOptions<OpenRouteServiceOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
        }

        public RouteMatrix BuildMatrix(List<LocationPoint> locations)
        {
            throw new NotImplementedException();
        }
    }
}

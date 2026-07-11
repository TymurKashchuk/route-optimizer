using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Geocoding
{
    public interface IGeocodingProvider
    {
        LocationPoint Geocode(string address);
    }
}

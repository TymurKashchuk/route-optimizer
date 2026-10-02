using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Geocoding
{
    public interface IGeocodingProvider
    {
        LocationPoint Geocode(string address);

        Task<LocationPoint> GeocodeAsync(
            string address,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<AddressSearchResult>> SearchAsync(
            string query,
            CancellationToken cancellationToken = default);
    }
}

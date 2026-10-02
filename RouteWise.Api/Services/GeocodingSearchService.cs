using Microsoft.Extensions.Caching.Memory;
using RouteWise.Api.Contracts.Responses;
using RouteWise.Api.Providers.Geocoding;

namespace RouteWise.Api.Services
{
    public class GeocodingSearchService
    {
        private readonly IGeocodingProvider _geocodingProvider;
        private readonly IMemoryCache _cache;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);

        public GeocodingSearchService(
            IGeocodingProvider geocodingProvider,
            IMemoryCache cache)
        {
            _geocodingProvider = geocodingProvider;
            _cache = cache;
        }

        public async Task<IReadOnlyList<AddressSuggestionDto>> SearchAsync(
            string query,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                return Array.Empty<AddressSuggestionDto>();
            }

            var normalizedQuery = query.Trim().ToLowerInvariant();
            var cacheKey = $"geo_search_{normalizedQuery}";

            if (_cache.TryGetValue(cacheKey, out IReadOnlyList<AddressSuggestionDto>? cachedResults) && cachedResults != null)
            {
                return cachedResults;
            }

            var searchResults = await _geocodingProvider.SearchAsync(query.Trim(), cancellationToken);

            var dtos = searchResults.Select(r => new AddressSuggestionDto
            {
                Address = r.Address,
                DisplayName = r.DisplayName,
                Latitude = r.Coordinates.Latitude,
                Longitude = r.Coordinates.Longitude,
                Confidence = r.Confidence
            }).ToList();

            _cache.Set(cacheKey, dtos, CacheDuration);

            return dtos;
        }
    }
}

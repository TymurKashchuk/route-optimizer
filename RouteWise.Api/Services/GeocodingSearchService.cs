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
            int limit = 5,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                return Array.Empty<AddressSuggestionDto>();
            }

            limit = Math.Clamp(limit, 1, 10);
            var normalizedQuery = query.Trim().ToLowerInvariant();
            var cacheKey = $"geo_search_{normalizedQuery}_{limit}";

            if (_cache.TryGetValue(cacheKey, out IReadOnlyList<AddressSuggestionDto>? cachedResults) && cachedResults != null)
            {
                return cachedResults;
            }

            var searchResults = await _geocodingProvider.SearchAsync(query.Trim(), limit, cancellationToken);

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

        public async Task<AddressSuggestionDto?> ReverseGeocodeAsync(
            double latitude,
            double longitude,
            CancellationToken cancellationToken = default)
        {
            var roundedLat = Math.Round(latitude, 5);
            var roundedLon = Math.Round(longitude, 5);
            var cacheKey = $"geo_rev_{roundedLat}_{roundedLon}";

            if (_cache.TryGetValue(cacheKey, out AddressSuggestionDto? cachedResult) && cachedResult != null)
            {
                return cachedResult;
            }

            var result = await _geocodingProvider.ReverseGeocodeAsync(latitude, longitude, cancellationToken);
            if (result == null)
            {
                return null;
            }

            var dto = new AddressSuggestionDto
            {
                Address = result.Address,
                DisplayName = result.DisplayName,
                Latitude = result.Coordinates.Latitude,
                Longitude = result.Coordinates.Longitude,
                Confidence = result.Confidence
            };

            _cache.Set(cacheKey, dto, CacheDuration);
            return dto;
        }
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Models;
using RouteWise.Api.Options;
using RouteWise.Api.Providers.Geocoding.OpenRouteService;

namespace RouteWise.Api.Providers.Geocoding
{
    public class OpenRouteServiceGeocodingProvider : IGeocodingProvider
    {
        private readonly HttpClient _httpClient;
        private readonly OpenRouteServiceOptions _options;

        public OpenRouteServiceGeocodingProvider(
            HttpClient httpClient,
            IOptions<OpenRouteServiceOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
        }

        public LocationPoint Geocode(string address)
        {
            return GeocodeAsync(address).GetAwaiter().GetResult();
        }

        public async Task<LocationPoint> GeocodeAsync(
            string address,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(address))
            {
                throw new ArgumentException("Address cannot be empty.", nameof(address));
            }

            var results = await SearchAsync(address, 1, null, cancellationToken);
            var first = results.FirstOrDefault();

            if (first == null)
            {
                throw new InvalidOperationException($"Address not found: {address}");
            }

            return first.Coordinates;
        }

        public async Task<IReadOnlyList<AddressSearchResult>> SearchAsync(
            string query,
            int limit = 5,
            string? city = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Array.Empty<AddressSearchResult>();
            }

            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                throw new OpenRouteServiceException("OpenRouteService API key is missing. Please configure it in settings.");
            }

            var countryParam = !string.IsNullOrWhiteSpace(_options.CountryCode)
                ? $"&boundary.country={Uri.EscapeDataString(_options.CountryCode.Trim())}"
                : string.Empty;

            var effectiveQuery = query.Trim();
            if (!string.IsNullOrWhiteSpace(city) && !effectiveQuery.Contains(city.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                effectiveQuery = $"{effectiveQuery}, {city.Trim()}";
            }

            var requestUri = $"search?text={Uri.EscapeDataString(effectiveQuery)}&size={limit}{countryParam}";

            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, requestUri);
            httpRequest.Headers.TryAddWithoutValidation("Authorization", _options.ApiKey);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            }
            catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                throw new OpenRouteServiceException("Request to OpenRouteService timed out.", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new OpenRouteServiceException("Network error occurred while connecting to OpenRouteService.", ex);
            }

            using (response)
            {
                if (!response.IsSuccessStatusCode)
                {
                    HandleErrorStatusCode(response.StatusCode);
                }

                OrsGeocodingResponse? geocodingResponse;
                try
                {
                    geocodingResponse = await response.Content.ReadFromJsonAsync<OrsGeocodingResponse>(cancellationToken: cancellationToken);
                }
                catch (JsonException ex)
                {
                    throw new OpenRouteServiceException("Failed to parse geocoding response from OpenRouteService.", ex);
                }

                if (geocodingResponse?.Features is null || geocodingResponse.Features.Count == 0)
                {
                    return Array.Empty<AddressSearchResult>();
                }

                return MapToSearchResults(geocodingResponse);
            }
        }

        public async Task<AddressSearchResult?> ReverseGeocodeAsync(
            double latitude,
            double longitude,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                throw new OpenRouteServiceException("OpenRouteService API key is missing. Please configure it in settings.");
            }

            var latStr = latitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var lonStr = longitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var requestUri = $"reverse?point.lat={latStr}&point.lon={lonStr}&size=1";

            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, requestUri);
            httpRequest.Headers.TryAddWithoutValidation("Authorization", _options.ApiKey);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            }
            catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                throw new OpenRouteServiceException("Request to OpenRouteService timed out.", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new OpenRouteServiceException("Network error occurred while connecting to OpenRouteService.", ex);
            }

            using (response)
            {
                if (!response.IsSuccessStatusCode)
                {
                    HandleErrorStatusCode(response.StatusCode);
                }

                OrsGeocodingResponse? geocodingResponse;
                try
                {
                    geocodingResponse = await response.Content.ReadFromJsonAsync<OrsGeocodingResponse>(cancellationToken: cancellationToken);
                }
                catch (JsonException ex)
                {
                    throw new OpenRouteServiceException("Failed to parse geocoding response from OpenRouteService.", ex);
                }

                if (geocodingResponse?.Features is null || geocodingResponse.Features.Count == 0)
                {
                    return null;
                }

                return MapToSearchResults(geocodingResponse).FirstOrDefault();
            }
        }

        private static IReadOnlyList<AddressSearchResult> MapToSearchResults(OrsGeocodingResponse response)
        {
            var results = new List<AddressSearchResult>();

            foreach (var feature in response.Features)
            {
                if (feature.Geometry?.Coordinates is null || feature.Geometry.Coordinates.Count < 2)
                {
                    continue;
                }

                var label = feature.Properties?.Label;
                var name = feature.Properties?.Name;
                var addressText = !string.IsNullOrWhiteSpace(label) ? label : (name ?? string.Empty);

                results.Add(new AddressSearchResult
                {
                    Address = addressText,
                    DisplayName = addressText,
                    Coordinates = new LocationPoint
                    {
                        Longitude = feature.Geometry.Coordinates[0],
                        Latitude = feature.Geometry.Coordinates[1]
                    },
                    Confidence = feature.Properties?.Confidence
                });
            }

            return results;
        }

        private static void HandleErrorStatusCode(HttpStatusCode statusCode)
        {
            if (statusCode == HttpStatusCode.Unauthorized)
            {
                throw new OpenRouteServiceException("Invalid or unauthorized OpenRouteService API key.", statusCode);
            }

            if (statusCode == HttpStatusCode.Forbidden)
            {
                throw new OpenRouteServiceException("Access to OpenRouteService is forbidden.", statusCode);
            }

            if (statusCode == HttpStatusCode.TooManyRequests)
            {
                throw new OpenRouteServiceException("OpenRouteService rate limit exceeded. Please try again later.", statusCode);
            }

            if ((int)statusCode >= 500)
            {
                throw new OpenRouteServiceException("OpenRouteService server error encountered. Service may be temporarily unavailable.", statusCode);
            }

            throw new OpenRouteServiceException($"OpenRouteService returned an unexpected error ({(int)statusCode}).", statusCode);
        }
    }
}

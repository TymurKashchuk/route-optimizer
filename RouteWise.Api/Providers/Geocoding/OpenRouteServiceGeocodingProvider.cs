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

        private static readonly Dictionary<string, (double Lat, double Lon)> KnownCityCoordinates = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Житомир"] = (50.25465, 28.65867),
            ["Zhytomyr"] = (50.25465, 28.65867),
            ["Київ"] = (50.45010, 30.52340),
            ["Kyiv"] = (50.45010, 30.52340),
            ["Львів"] = (49.84190, 24.03150),
            ["Lviv"] = (49.84190, 24.03150),
            ["Вінниця"] = (49.23308, 28.46822),
            ["Vinnytsia"] = (49.23308, 28.46822),
            ["Дніпро"] = (48.46472, 35.04618),
            ["Dnipro"] = (48.46472, 35.04618),
            ["Одеса"] = (46.48253, 30.72331),
            ["Odesa"] = (46.48253, 30.72331),
            ["Харків"] = (49.99350, 36.23038),
            ["Kharkiv"] = (49.99350, 36.23038),
            ["Полтава"] = (49.58827, 34.55142),
            ["Poltava"] = (49.58827, 34.55142),
            ["Черкаси"] = (49.44443, 32.05977),
            ["Cherkasy"] = (49.44443, 32.05977),
            ["Чернігів"] = (51.49820, 31.28935),
            ["Chernihiv"] = (51.49820, 31.28935),
            ["Івано-Франківськ"] = (48.92263, 24.71112),
            ["Ivano-Frankivsk"] = (48.92263, 24.71112),
            ["Тернопіль"] = (49.55352, 25.59477),
            ["Ternopil"] = (49.55352, 25.59477),
            ["Рівне"] = (50.61990, 26.25162),
            ["Rivne"] = (50.61990, 26.25162),
            ["Луцьк"] = (50.74723, 25.32538),
            ["Lutsk"] = (50.74723, 25.32538),
            ["Хмельницький"] = (49.42298, 26.98713),
            ["Khmelnytskyi"] = (49.42298, 26.98713),
            ["Запоріжжя"] = (47.83880, 35.13957),
            ["Zaporizhzhia"] = (47.83880, 35.13957),
            ["Миколаїв"] = (46.97503, 31.99458),
            ["Mykolaiv"] = (46.97503, 31.99458),
            ["Ужгород"] = (48.62080, 22.28788),
            ["Uzhhorod"] = (48.62080, 22.28788),
            ["Чернівці"] = (48.29208, 25.93584),
            ["Chernivtsi"] = (48.29208, 25.93584),
            ["Кропивницький"] = (48.50793, 32.26232),
            ["Kropyvnytskyi"] = (48.50793, 32.26232)
        };

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

            // 1. Full address lookup uses 'search' endpoint (designed for complete address strings e.g. "Золоті ворота, Kyiv, Ukraine")
            var results = await ExecutePeliasRequestAsync("search", address, limit: 1, city: null, cancellationToken);

            // 2. Fallback to 'autocomplete' if search returns empty
            if (results.Count == 0)
            {
                results = await ExecutePeliasRequestAsync("autocomplete", address, limit: 1, city: null, cancellationToken);
            }

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

            return await ExecutePeliasRequestAsync("autocomplete", query, limit, city, cancellationToken);
        }

        private async Task<IReadOnlyList<AddressSearchResult>> ExecutePeliasRequestAsync(
            string endpoint,
            string query,
            int limit,
            string? city,
            CancellationToken cancellationToken)
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
            var cityParams = string.Empty;

            if (!string.IsNullOrWhiteSpace(city))
            {
                var trimmedCity = city.Trim();
                if (KnownCityCoordinates.TryGetValue(trimmedCity, out var coords))
                {
                    var latStr = coords.Lat.ToString(System.Globalization.CultureInfo.InvariantCulture);
                    var lonStr = coords.Lon.ToString(System.Globalization.CultureInfo.InvariantCulture);
                    cityParams = $"&focus.point.lat={latStr}&focus.point.lon={lonStr}&boundary.circle.lat={latStr}&boundary.circle.lon={lonStr}&boundary.circle.radius=25";
                }
                else if (!effectiveQuery.Contains(trimmedCity, StringComparison.OrdinalIgnoreCase))
                {
                    effectiveQuery = $"{effectiveQuery}, {trimmedCity}";
                }
            }

            var requestUri = $"{endpoint}?text={Uri.EscapeDataString(effectiveQuery)}&size={limit}{countryParam}{cityParams}";

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

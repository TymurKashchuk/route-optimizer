using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Geocoding
{
    public class StaticGeocodingProvider : IGeocodingProvider
    {
        private readonly Dictionary<string, LocationPoint> _knownAddresses = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Zhytomyr Central Square"] = new LocationPoint
            {
                Latitude = 50.25465,
                Longitude = 28.65867
            },
            ["Zhytomyr Railway Station"] = new LocationPoint
            {
                Latitude = 50.26407,
                Longitude = 28.67669
            },
            ["Zhytomyr City Hospital"] = new LocationPoint
            {
                Latitude = 50.25007,
                Longitude = 28.67011
            },
            ["майдан Соборний, Житомир"] = new LocationPoint
            {
                Latitude = 50.255318,
                Longitude = 28.659181
            },
            ["майдан Перемоги, Житомир"] = new LocationPoint
            {
                Latitude = 50.257481,
                Longitude = 28.659194
            },
            ["вулиця Покровська, Житомир"] = new LocationPoint
            {
                Latitude = 50.264250,
                Longitude = 28.666830
            },
            ["вулиця Київська, Житомир"] = new LocationPoint
            {
                Latitude = 50.255577,
                Longitude = 28.659561
            }
        };

        public LocationPoint Geocode(string address) {
            if (_knownAddresses.TryGetValue(address, out var location)) { 
                return location;
            }

            var availableAddresses = string.Join(",", _knownAddresses.Keys);

            throw new InvalidOperationException($"Unknown address: {address}. Available demo addresses: {availableAddresses}");
        }

        public Task<LocationPoint> GeocodeAsync(
            string address,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Geocode(address));
        }

        public Task<IReadOnlyList<AddressSearchResult>> SearchAsync(
            string query,
            int limit = 5,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Task.FromResult<IReadOnlyList<AddressSearchResult>>(Array.Empty<AddressSearchResult>());
            }

            var results = _knownAddresses
                .Where(kvp => kvp.Key.Contains(query.Trim(), StringComparison.OrdinalIgnoreCase))
                .Take(limit)
                .Select(kvp => new AddressSearchResult
                {
                    Address = kvp.Key,
                    DisplayName = kvp.Key,
                    Coordinates = kvp.Value,
                    Confidence = 1.0
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<AddressSearchResult>>(results);
        }
    }
}

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
            }
        };

        public LocationPoint Geocode(string address) {
            if (_knownAddresses.TryGetValue(address, out var location)) { 
                return location;
            }

            var availableAddresses = string.Join(",", _knownAddresses.Keys);

            throw new InvalidOperationException($"Unknown address: {address}. Available demo addresses: {availableAddresses}");
        }
    }
}

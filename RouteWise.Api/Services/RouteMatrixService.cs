using Microsoft.Extensions.Caching.Memory;
using RouteWise.Api.Models;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;

namespace RouteWise.Api.Services
{
    public class RouteMatrixService
    {
        private readonly IGeocodingProvider _geocodingProvider;
        private readonly IRouteProvider _routeProvider;
        private readonly IMemoryCache? _cache;
        private static readonly TimeSpan GeocodingCacheDuration = TimeSpan.FromHours(24);

        public RouteMatrixService(
            IGeocodingProvider geocodingProvider,
            IRouteProvider routeProvider,
            IMemoryCache? cache = null)
        {
            _geocodingProvider = geocodingProvider;
            _routeProvider = routeProvider;
            _cache = cache;
        }

        public Task<RouteMatrixResult> BuildMatrixAsync(
            AddressInput start,
            List<RouteStop> stops,
            CancellationToken cancellationToken = default)
        {
            return BuildMatrixAsync(start, stops, null, TravelMode.Default, cancellationToken);
        }

        public Task<RouteMatrixResult> BuildMatrixAsync(
            AddressInput start,
            List<RouteStop> stops,
            AddressInput? destination,
            CancellationToken cancellationToken = default)
        {
            return BuildMatrixAsync(start, stops, destination, TravelMode.Default, cancellationToken);
        }

        public async Task<RouteMatrixResult> BuildMatrixAsync(
            AddressInput start,
            List<RouteStop> stops,
            AddressInput? destination,
            string travelMode,
            CancellationToken cancellationToken = default)
        {
            var pointsToResolve = new List<(string Address, double? Latitude, double? Longitude)>
            {
                (start.Address, start.Latitude, start.Longitude)
            };

            foreach (var stop in stops)
            {
                pointsToResolve.Add((stop.Address, stop.Latitude, stop.Longitude));
            }

            if (destination != null)
            {
                pointsToResolve.Add((destination.Address, destination.Latitude, destination.Longitude));
            }

            var inFlightResolutions = new Dictionary<string, Task<LocationPoint>>(StringComparer.OrdinalIgnoreCase);
            var resolutionTasks = new List<Task<LocationPoint>>();

            foreach (var point in pointsToResolve)
            {
                if (point.Latitude.HasValue && point.Longitude.HasValue)
                {
                    resolutionTasks.Add(Task.FromResult(new LocationPoint
                    {
                        Latitude = point.Latitude.Value,
                        Longitude = point.Longitude.Value
                    }));
                    continue;
                }

                var normalizedAddress = point.Address.Trim();
                if (!inFlightResolutions.TryGetValue(normalizedAddress, out var task))
                {
                    task = ResolveFromCacheOrProviderAsync(normalizedAddress, cancellationToken);
                    inFlightResolutions[normalizedAddress] = task;
                }

                resolutionTasks.Add(task);
            }

            var resolvedLocations = await Task.WhenAll(resolutionTasks);
            var locations = resolvedLocations.ToList();

            var matrix = await _routeProvider.BuildMatrixAsync(locations, travelMode, cancellationToken);

            return new RouteMatrixResult
            {
                Locations = locations,
                Matrix = matrix
            };
        }

        private async Task<LocationPoint> ResolveFromCacheOrProviderAsync(
            string address,
            CancellationToken cancellationToken)
        {
            var cacheKey = $"geocode_{address.ToLowerInvariant()}";

            if (_cache != null && _cache.TryGetValue(cacheKey, out LocationPoint? cachedPoint) && cachedPoint != null)
            {
                return cachedPoint;
            }

            var resolved = await _geocodingProvider.GeocodeAsync(address, cancellationToken);

            if (_cache != null)
            {
                _cache.Set(cacheKey, resolved, GeocodingCacheDuration);
            }

            return resolved;
        }
    }
}

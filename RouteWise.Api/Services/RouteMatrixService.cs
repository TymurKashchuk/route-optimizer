using RouteWise.Api.Models;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;

namespace RouteWise.Api.Services
{
    public class RouteMatrixService
    {
        private readonly IGeocodingProvider _geocodingProvider;
        private readonly IRouteProvider _routeProvider;

        public RouteMatrixService(
            IGeocodingProvider geocodingProvider,
            IRouteProvider routeProvider)
        {
            _geocodingProvider = geocodingProvider;
            _routeProvider = routeProvider;
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
            var resolveTasks = new List<Task<LocationPoint>>
            {
                ResolveLocationAsync(start.Address, start.Latitude, start.Longitude, cancellationToken)
            };

            foreach (var stop in stops)
            {
                resolveTasks.Add(ResolveLocationAsync(stop.Address, stop.Latitude, stop.Longitude, cancellationToken));
            }

            if (destination != null)
            {
                resolveTasks.Add(ResolveLocationAsync(destination.Address, destination.Latitude, destination.Longitude, cancellationToken));
            }

            var resolvedLocations = await Task.WhenAll(resolveTasks);
            var locations = resolvedLocations.ToList();

            var matrix = await _routeProvider.BuildMatrixAsync(locations, travelMode, cancellationToken);

            return new RouteMatrixResult
            {
                Locations = locations,
                Matrix = matrix
            };
        }

        private Task<LocationPoint> ResolveLocationAsync(
            string address,
            double? latitude,
            double? longitude,
            CancellationToken cancellationToken)
        {
            if (latitude.HasValue && longitude.HasValue)
            {
                return Task.FromResult(new LocationPoint
                {
                    Latitude = latitude.Value,
                    Longitude = longitude.Value
                });
            }

            return _geocodingProvider.GeocodeAsync(address, cancellationToken);
        }
    }
}

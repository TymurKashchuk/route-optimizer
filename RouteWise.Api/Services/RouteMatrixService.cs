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
            return BuildMatrixAsync(start, stops, null, cancellationToken);
        }

        public async Task<RouteMatrixResult> BuildMatrixAsync(
            AddressInput start,
            List<RouteStop> stops,
            AddressInput? destination,
            CancellationToken cancellationToken = default)
        {
            var locations = new List<LocationPoint>();

            var startLocation = await ResolveLocationAsync(start.Address, start.Latitude, start.Longitude, cancellationToken);
            locations.Add(startLocation);

            foreach (var stop in stops)
            {
                var stopLocation = await ResolveLocationAsync(stop.Address, stop.Latitude, stop.Longitude, cancellationToken);
                locations.Add(stopLocation);
            }

            if (destination != null)
            {
                var destinationLocation = await ResolveLocationAsync(destination.Address, destination.Latitude, destination.Longitude, cancellationToken);
                locations.Add(destinationLocation);
            }

            var matrix = await _routeProvider.BuildMatrixAsync(locations, cancellationToken);

            return new RouteMatrixResult
            {
                Locations = locations,
                Matrix = matrix
            };
        }

        private async Task<LocationPoint> ResolveLocationAsync(
            string address,
            double? latitude,
            double? longitude,
            CancellationToken cancellationToken)
        {
            if (latitude.HasValue && longitude.HasValue)
            {
                return new LocationPoint
                {
                    Latitude = latitude.Value,
                    Longitude = longitude.Value
                };
            }

            return await _geocodingProvider.GeocodeAsync(address, cancellationToken);
        }
    }
}

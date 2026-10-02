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

        public async Task<RouteMatrixResult> BuildMatrixAsync(
            AddressInput start,
            List<RouteStop> stops,
            CancellationToken cancellationToken = default)
        {
            var locations = new List<LocationPoint>();

            var startLocation = await _geocodingProvider.GeocodeAsync(start.Address, cancellationToken);
            locations.Add(startLocation);

            foreach (var stop in stops)
            {
                var stopLocation = await _geocodingProvider.GeocodeAsync(stop.Address, cancellationToken);
                locations.Add(stopLocation);
            }

            var matrix = await _routeProvider.BuildMatrixAsync(locations, cancellationToken);

            return new RouteMatrixResult
            {
                Locations = locations,
                Matrix = matrix
            };
        }
    }
}

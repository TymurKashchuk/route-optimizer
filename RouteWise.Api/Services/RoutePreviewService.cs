using RouteWise.Api.Contracts.Responses;
using RouteWise.Api.Models;
using RouteWise.Api.Providers.Routing;

namespace RouteWise.Api.Services
{
    public class RoutePreviewService
    {
        private readonly IRouteProvider _routeProvider;

        public RoutePreviewService(IRouteProvider routeProvider)
        {
            _routeProvider = routeProvider;
        }

        public async Task<RoutePreviewDto> BuildAsync(
            AddressInput start,
            List<RouteStop> orderedStops,
            List<int> orderedStopIndices,
            List<LocationPoint> allLocations,
            CancellationToken cancellationToken = default)
        {
            if (allLocations == null || allLocations.Count == 0)
            {
                return new RoutePreviewDto();
            }

            var startLocation = allLocations[0];
            var startPoint = new RoutePointDto
            {
                Id = "start",
                Label = start.Label,
                Address = start.Address,
                Latitude = startLocation.Latitude,
                Longitude = startLocation.Longitude,
                Order = 0
            };

            var orderedRoutePoints = new List<RoutePointDto>();
            var orderedLocations = new List<LocationPoint> { startLocation };

            for (int i = 0; i < orderedStops.Count; i++)
            {
                var stop = orderedStops[i];
                var locationIndex = orderedStopIndices[i] + 1;
                var location = allLocations[locationIndex];

                orderedLocations.Add(location);
                orderedRoutePoints.Add(new RoutePointDto
                {
                    Id = stop.Id,
                    Label = stop.Label,
                    Address = stop.Address,
                    Latitude = location.Latitude,
                    Longitude = location.Longitude,
                    Order = i + 1
                });
            }

            var routeGeometry = await _routeProvider.GetRouteGeometryAsync(orderedLocations, cancellationToken);

            return new RoutePreviewDto
            {
                StartPoint = startPoint,
                OrderedStops = orderedRoutePoints,
                GeometryCoordinates = routeGeometry.Coordinates
            };
        }
    }
}

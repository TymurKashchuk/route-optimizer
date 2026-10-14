using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Routing
{
    public interface IRouteProvider
    {
        Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            CancellationToken cancellationToken = default);

        Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            string travelMode,
            CancellationToken cancellationToken = default);

        Task<RouteGeometry> GetRouteGeometryAsync(
            List<LocationPoint> orderedLocations,
            CancellationToken cancellationToken = default);

        Task<RouteGeometry> GetRouteGeometryAsync(
            List<LocationPoint> orderedLocations,
            string travelMode,
            CancellationToken cancellationToken = default);
    }
}

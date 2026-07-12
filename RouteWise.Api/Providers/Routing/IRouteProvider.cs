using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Routing
{
    public interface IRouteProvider
    {
        RouteMatrix BuildMatrix(List<LocationPoint> locations);
    }
}

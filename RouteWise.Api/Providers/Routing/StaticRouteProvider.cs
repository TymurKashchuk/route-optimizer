using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Routing
{
    public class StaticRouteProvider : IRouteProvider
    {
        public Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            CancellationToken cancellationToken = default)
        {
            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
                {
                    new() { 0, 12, 18 },
                    new() { 11, 0, 10 },
                    new() { 17, 9, 0 }
                },
                DistancesKm = new List<List<double>> 
                {
                    new() { 0, 5.2, 8.4 },
                    new() { 5.0, 0, 4.1 },
                    new() { 8.0, 4.0, 0 }
                }
            };

            return Task.FromResult(matrix);
        }
    }
}

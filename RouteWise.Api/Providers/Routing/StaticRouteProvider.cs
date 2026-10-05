using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Routing
{
    public class StaticRouteProvider : IRouteProvider
    {
        public Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            CancellationToken cancellationToken = default)
        {
            var count = locations.Count;
            var baseTimes = new int[,]
            {
                { 0, 12, 18, 15 },
                { 11, 0, 10, 14 },
                { 17, 9, 0, 8 },
                { 16, 13, 7, 0 }
            };
            var baseDistances = new double[,]
            {
                { 0, 5.2, 8.4, 6.5 },
                { 5.0, 0, 4.1, 5.8 },
                { 8.0, 4.0, 0, 3.2 },
                { 7.5, 6.0, 3.0, 0 }
            };

            var travelTimesMinutes = new List<List<int>>();
            var distancesKm = new List<List<double>>();

            for (int i = 0; i < count; i++)
            {
                var timeRow = new List<int>();
                var distRow = new List<double>();

                for (int j = 0; j < count; j++)
                {
                    if (i == j)
                    {
                        timeRow.Add(0);
                        distRow.Add(0.0);
                    }
                    else if (i < 4 && j < 4)
                    {
                        timeRow.Add(baseTimes[i, j]);
                        distRow.Add(baseDistances[i, j]);
                    }
                    else
                    {
                        var diff = Math.Abs(i - j);
                        timeRow.Add(diff * 10);
                        distRow.Add(Math.Round(diff * 4.5, 2));
                    }
                }

                travelTimesMinutes.Add(timeRow);
                distancesKm.Add(distRow);
            }

            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = travelTimesMinutes,
                DistancesKm = distancesKm
            };

            return Task.FromResult(matrix);
        }

        public Task<RouteGeometry> GetRouteGeometryAsync(
            List<LocationPoint> orderedLocations,
            CancellationToken cancellationToken = default)
        {
            var geometry = new RouteGeometry
            {
                Coordinates = orderedLocations.Select(loc => new LocationPoint
                {
                    Latitude = loc.Latitude,
                    Longitude = loc.Longitude
                }).ToList()
            };

            return Task.FromResult(geometry);
        }
    }
}

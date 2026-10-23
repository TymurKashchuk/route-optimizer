using RouteWise.Api.Models;

namespace RouteWise.Api.Providers.Routing
{
    public class StaticRouteProvider : IRouteProvider
    {
        private const double EarthRadiusKm = 6371.0;

        public Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            CancellationToken cancellationToken = default)
        {
            return BuildMatrixAsync(locations, TravelMode.Default, cancellationToken);
        }

        public Task<RouteMatrix> BuildMatrixAsync(
            List<LocationPoint> locations,
            string travelMode,
            CancellationToken cancellationToken = default)
        {
            var count = locations.Count;
            var speedKmH = GetSpeedKmH(travelMode);

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
                    else
                    {
                        var distance = CalculateHaversineDistanceKm(locations[i], locations[j]);
                        var roundedDistance = Math.Round(distance, 2);

                        var minutes = roundedDistance <= 0.0
                            ? 0
                            : (int)Math.Max(1, Math.Round((distance / speedKmH) * 60.0));

                        timeRow.Add(minutes);
                        distRow.Add(roundedDistance);
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
            return GetRouteGeometryAsync(orderedLocations, TravelMode.Default, cancellationToken);
        }

        public Task<RouteGeometry> GetRouteGeometryAsync(
            List<LocationPoint> orderedLocations,
            string travelMode,
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

        private static double GetSpeedKmH(string? travelMode)
        {
            var normalizedMode = TravelMode.Normalize(travelMode);
            return normalizedMode switch
            {
                TravelMode.Walking => 5.0,
                TravelMode.Cycling => 15.0,
                _ => 50.0
            };
        }

        private static double CalculateHaversineDistanceKm(LocationPoint origin, LocationPoint destination)
        {
            var dLat = ToRadians(destination.Latitude - origin.Latitude);
            var dLon = ToRadians(destination.Longitude - origin.Longitude);

            var lat1 = ToRadians(origin.Latitude);
            var lat2 = ToRadians(destination.Latitude);

            var a = Math.Sin(dLat / 2.0) * Math.Sin(dLat / 2.0) +
                    Math.Cos(lat1) * Math.Cos(lat2) *
                    Math.Sin(dLon / 2.0) * Math.Sin(dLon / 2.0);

            var c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));

            return EarthRadiusKm * c;
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
    }
}

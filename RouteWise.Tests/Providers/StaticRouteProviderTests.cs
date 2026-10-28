using RouteWise.Api.Models;
using RouteWise.Api.Providers.Routing;

namespace RouteWise.Tests.Providers
{
    public class StaticRouteProviderTests
    {
        private readonly LocationPoint _pointA = new() { Latitude = 50.25465, Longitude = 28.65867 };
        private readonly LocationPoint _pointB = new() { Latitude = 50.26407, Longitude = 28.67669 };
        private readonly LocationPoint _pointC = new() { Latitude = 50.25007, Longitude = 28.67011 };

        [Fact]
        public async Task BuildMatrixAsync_CalculatesHaversineDistancesAndSymmetricMatrix()
        {
            var provider = new StaticRouteProvider();
            var locations = new List<LocationPoint> { _pointA, _pointB, _pointC };

            var matrix = await provider.BuildMatrixAsync(locations, TravelMode.Driving);

            Assert.Equal(3, matrix.DistancesKm.Count);
            Assert.Equal(3, matrix.TravelTimesMinutes.Count);

            // Diagonal should be 0
            for (int i = 0; i < 3; i++)
            {
                Assert.Equal(0.0, matrix.DistancesKm[i][i]);
                Assert.Equal(0, matrix.TravelTimesMinutes[i][i]);
            }

            // Distances should be symmetric: dist(A, B) == dist(B, A)
            Assert.Equal(matrix.DistancesKm[0][1], matrix.DistancesKm[1][0]);
            Assert.Equal(matrix.DistancesKm[0][2], matrix.DistancesKm[2][0]);
            Assert.Equal(matrix.DistancesKm[1][2], matrix.DistancesKm[2][1]);

            // Distance between Point A and Point B is ~1.65 km
            Assert.InRange(matrix.DistancesKm[0][1], 1.6, 1.7);
            Assert.True(matrix.TravelTimesMinutes[0][1] >= 1);
            Assert.True(matrix.TravelTimesSeconds[0][1] >= 60);
            Assert.Equal(matrix.TravelTimesSeconds[0][1], matrix.GetTravelTimeSeconds(0, 1));
        }

        [Fact]
        public async Task BuildMatrixAsync_TravelModesScaleTimeCorrectly()
        {
            var provider = new StaticRouteProvider();
            var locations = new List<LocationPoint> { _pointA, _pointB };

            var drivingMatrix = await provider.BuildMatrixAsync(locations, TravelMode.Driving);
            var cyclingMatrix = await provider.BuildMatrixAsync(locations, TravelMode.Cycling);
            var walkingMatrix = await provider.BuildMatrixAsync(locations, TravelMode.Walking);

            // Distances must be equal across travel modes
            Assert.Equal(drivingMatrix.DistancesKm[0][1], cyclingMatrix.DistancesKm[0][1]);
            Assert.Equal(drivingMatrix.DistancesKm[0][1], walkingMatrix.DistancesKm[0][1]);

            // Travel times: Walking > Cycling > Driving
            Assert.True(walkingMatrix.TravelTimesMinutes[0][1] > cyclingMatrix.TravelTimesMinutes[0][1]);
            Assert.True(cyclingMatrix.TravelTimesMinutes[0][1] > drivingMatrix.TravelTimesMinutes[0][1]);
            Assert.True(walkingMatrix.TravelTimesSeconds[0][1] > cyclingMatrix.TravelTimesSeconds[0][1]);
            Assert.True(cyclingMatrix.TravelTimesSeconds[0][1] > drivingMatrix.TravelTimesSeconds[0][1]);
        }

        [Fact]
        public async Task BuildMatrixAsync_WithIdenticalCoordinates_ReturnsZeroTimeAndDistance()
        {
            var provider = new StaticRouteProvider();
            var locations = new List<LocationPoint>
            {
                new() { Latitude = 50.25, Longitude = 28.65 },
                new() { Latitude = 50.25, Longitude = 28.65 }
            };

            var matrix = await provider.BuildMatrixAsync(locations);

            Assert.Equal(0.0, matrix.DistancesKm[0][1]);
            Assert.Equal(0, matrix.TravelTimesMinutes[0][1]);
        }

        [Fact]
        public async Task GetRouteGeometryAsync_ReturnsCoordinatesInOrder()
        {
            var provider = new StaticRouteProvider();
            var locations = new List<LocationPoint> { _pointA, _pointB, _pointC };

            var geometry = await provider.GetRouteGeometryAsync(locations);

            Assert.NotNull(geometry);
            Assert.Equal(3, geometry.Coordinates.Count);
            Assert.Equal(_pointA.Latitude, geometry.Coordinates[0].Latitude);
            Assert.Equal(_pointB.Latitude, geometry.Coordinates[1].Latitude);
            Assert.Equal(_pointC.Latitude, geometry.Coordinates[2].Latitude);
        }

        [Fact]
        public async Task BuildMatrixAsync_DrivingSpeedScalesWithDistance_HigherSpeedOnHighways()
        {
            var provider = new StaticRouteProvider();
            var urbanLocations = new List<LocationPoint> { _pointA, _pointB }; // ~1.65 km
            var highwayLocations = new List<LocationPoint>
            {
                new() { Latitude = 50.25465, Longitude = 28.65867 }, // Zhytomyr
                new() { Latitude = 50.45010, Longitude = 30.52340 }  // Kyiv (~135 km)
            };

            var urbanMatrix = await provider.BuildMatrixAsync(urbanLocations, TravelMode.Driving);
            var highwayMatrix = await provider.BuildMatrixAsync(highwayLocations, TravelMode.Driving);

            var urbanDistance = urbanMatrix.DistancesKm[0][1];
            var urbanMinutes = urbanMatrix.TravelTimesMinutes[0][1];
            var urbanSpeedKmH = (urbanDistance / urbanMinutes) * 60.0;

            var highwayDistance = highwayMatrix.DistancesKm[0][1];
            var highwayMinutes = highwayMatrix.TravelTimesMinutes[0][1];
            var highwaySpeedKmH = (highwayDistance / highwayMinutes) * 60.0;

            Assert.True(highwayDistance > 100.0);
            Assert.True(highwaySpeedKmH > urbanSpeedKmH);
            Assert.InRange(highwaySpeedKmH, 75.0, 95.0);
        }
    }
}

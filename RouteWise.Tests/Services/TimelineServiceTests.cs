using RouteWise.Api.Models;
using RouteWise.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RouteWise.Tests.Services
{
    public class TimelineServiceTests
    {
        [Fact]
        public void Build_WithTravelAndServiceTimes_ReturnsCorrectTimeline()
        {
            var service = new TimelineService();

            var start = new AddressInput
            {
                Label = "Office",
                Address = "Zhytomyr Central Square"
            };

            var departureTime = new DateTime(2026, 7, 31, 9, 0, 0);

            var orderedStops = new List<RouteStop>
            {
            new RouteStop
            {
                Id = "2",
                Label = "Client B",
                Address = "Zhytomyr City Hospital",
                ServiceMinutes = 15
            },
            new RouteStop
            {
                Id = "1",
                Label = "Client A",
                Address = "Zhytomyr Railway Station",
                ServiceMinutes = 20
            }
        };

            var orderedStopIndices = new List<int> { 1, 0 };

            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
            {
                new() { 0, 12, 8 },
                new() { 11, 0, 10 },
                new() { 7, 9, 0 }
            },
                DistancesKm = new List<List<double>>()
            };

            var result = service.Build(
                start,
                departureTime,
                orderedStops,
                orderedStopIndices,
                matrix);

                Assert.Equal(3, result.Count);

                Assert.Collection(result,
                item =>
                {
                    Assert.Equal("Office", item.Label);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 0, 0), item.ArrivalTime);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 0, 0), item.DepartureTime);
                },
                item =>
                {
                    Assert.Equal("Client B", item.Label);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 8, 0), item.ArrivalTime);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 23, 0), item.DepartureTime);
                },
                item =>
                {
                    Assert.Equal("Client A", item.Label);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 32, 0), item.ArrivalTime);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 52, 0), item.DepartureTime);
                });
        }

        [Fact]
        public void Build_WithDestination_IncludesDestinationAtEndOfTimeline()
        {
            var service = new TimelineService();

            var start = new AddressInput
            {
                Label = "Office",
                Address = "Zhytomyr Central Square"
            };

            var departureTime = new DateTime(2026, 7, 31, 9, 0, 0);

            var orderedStops = new List<RouteStop>
            {
                new RouteStop
                {
                    Id = "2",
                    Label = "Client B",
                    Address = "Zhytomyr City Hospital",
                    ServiceMinutes = 15
                },
                new RouteStop
                {
                    Id = "1",
                    Label = "Client A",
                    Address = "Zhytomyr Railway Station",
                    ServiceMinutes = 20
                }
            };

            var orderedStopIndices = new List<int> { 1, 0 };

            var destination = new AddressInput
            {
                Label = "Garage",
                Address = "Zhytomyr Depot"
            };

            // 0: Office, 1: Client A, 2: Client B, 3: Garage
            var matrix = new RouteMatrix
            {
                TravelTimesMinutes = new List<List<int>>
                {
                    new() { 0, 12, 8, 20 },
                    new() { 11, 0, 10, 14 },
                    new() { 7, 9, 0, 25 },
                    new() { 20, 14, 25, 0 }
                },
                DistancesKm = new List<List<double>>()
            };

            var result = service.Build(
                start,
                departureTime,
                orderedStops,
                orderedStopIndices,
                matrix,
                destination,
                destinationMatrixIndex: 3);

            Assert.Equal(4, result.Count);

            Assert.Collection(result,
                item =>
                {
                    Assert.Equal("Office", item.Label);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 0, 0), item.ArrivalTime);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 0, 0), item.DepartureTime);
                },
                item =>
                {
                    Assert.Equal("Client B", item.Label);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 8, 0), item.ArrivalTime);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 23, 0), item.DepartureTime);
                },
                item =>
                {
                    Assert.Equal("Client A", item.Label);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 32, 0), item.ArrivalTime);
                    Assert.Equal(new DateTime(2026, 7, 31, 9, 52, 0), item.DepartureTime);
                },
                item =>
                {
                    Assert.Equal("Garage", item.Label);
                    // From Client A (index 1 in matrix) to Garage (index 3) is 14 minutes
                    Assert.Equal(new DateTime(2026, 7, 31, 10, 6, 0), item.ArrivalTime);
                    Assert.Equal(new DateTime(2026, 7, 31, 10, 6, 0), item.DepartureTime);
                });
        }
    }
}

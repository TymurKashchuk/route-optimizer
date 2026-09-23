using RouteWise.Api.Models;
using RouteWise.Api.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RouteWise.Tests.Services
{
    public class RouteExplanationServiceTests
    {
        [Fact]
        public void Build_WithOrderedStopsAndMatrix_ReturnsExplanationStepsInCorrectOrder()
        {
            var service = new RouteExplanationService();

            var start = new AddressInput
            {
                Label = "Office",
                Address = "Zhytomyr Central Square"
            };

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

            var result = service.Build(start, orderedStops, orderedStopIndices, matrix);

            Assert.Equal(2, result.Count);

            Assert.Collection(result,
                step =>
                {
                    Assert.Equal("Office", step.From);
                    Assert.Equal("Client B", step.To);
                    Assert.Equal(8, step.TravelMinutes);
                },
                step =>
                {
                    Assert.Equal("Client B", step.From);
                    Assert.Equal("Client A", step.To);
                    Assert.Equal(9, step.TravelMinutes);
                });
        }
    }
}

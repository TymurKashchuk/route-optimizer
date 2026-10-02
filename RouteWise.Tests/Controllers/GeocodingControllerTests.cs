using System.Collections;
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using RouteWise.Api.Controllers;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Models;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Services;

namespace RouteWise.Tests.Controllers
{
    public class GeocodingControllerTests
    {
        private class MockGeocodingProvider : IGeocodingProvider
        {
            public Func<string, int, Task<IReadOnlyList<AddressSearchResult>>>? OnSearch { get; set; }

            public LocationPoint Geocode(string address) => new();

            public Task<LocationPoint> GeocodeAsync(string address, CancellationToken cancellationToken = default) =>
                Task.FromResult(new LocationPoint());

            public Task<IReadOnlyList<AddressSearchResult>> SearchAsync(
                string query,
                int limit = 5,
                CancellationToken cancellationToken = default)
            {
                if (OnSearch != null)
                {
                    return OnSearch(query, limit);
                }

                return Task.FromResult<IReadOnlyList<AddressSearchResult>>(new List<AddressSearchResult>());
            }
        }

        private static (GeocodingController Controller, MockGeocodingProvider Provider) CreateController()
        {
            var provider = new MockGeocodingProvider();
            var cache = new MemoryCache(new MemoryCacheOptions());
            var service = new GeocodingSearchService(provider, cache);
            var controller = new GeocodingController(service);
            return (controller, provider);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("a")]
        public async Task Search_WhenQueryShorterThan2Chars_ReturnsOkWithEmptyList(string? query)
        {
            var (controller, _) = CreateController();

            var result = await controller.Search(query);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
            var items = Assert.IsAssignableFrom<IEnumerable>(okResult.Value);
            Assert.Empty(items);
        }

        [Fact]
        public async Task Search_WhenValidQuery_ReturnsOkWithSuggestions()
        {
            var (controller, provider) = CreateController();

            provider.OnSearch = (q, l) => Task.FromResult<IReadOnlyList<AddressSearchResult>>(new List<AddressSearchResult>
            {
                new()
                {
                    Address = "Zhytomyr, Ukraine",
                    DisplayName = "Zhytomyr",
                    Coordinates = new LocationPoint { Latitude = 50.25, Longitude = 28.65 }
                }
            });

            var result = await controller.Search("Zhytomyr", limit: 3);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
            var items = Assert.IsAssignableFrom<IEnumerable>(okResult.Value);
            var list = items.Cast<object>().ToList();
            Assert.Single(list);
        }

        [Fact]
        public async Task Search_WhenRateLimitExceeded_Returns429TooManyRequests()
        {
            var (controller, provider) = CreateController();

            provider.OnSearch = (_, _) =>
                throw new OpenRouteServiceException("Rate limit exceeded", HttpStatusCode.TooManyRequests);

            var result = await controller.Search("Kyiv");

            var objectResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status429TooManyRequests, objectResult.StatusCode);
        }

        [Fact]
        public async Task Search_WhenUnauthorized_Returns502BadGateway()
        {
            var (controller, provider) = CreateController();

            provider.OnSearch = (_, _) =>
                throw new OpenRouteServiceException("Unauthorized API key", HttpStatusCode.Unauthorized);

            var result = await controller.Search("Kyiv");

            var objectResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status502BadGateway, objectResult.StatusCode);
        }

        [Fact]
        public async Task Search_WhenServerError_Returns502BadGateway()
        {
            var (controller, provider) = CreateController();

            provider.OnSearch = (_, _) =>
                throw new OpenRouteServiceException("ORS Server Error", HttpStatusCode.InternalServerError);

            var result = await controller.Search("Kyiv");

            var objectResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status502BadGateway, objectResult.StatusCode);
        }

        [Fact]
        public async Task Search_WhenInvalidOperationException_Returns400BadRequest()
        {
            var (controller, provider) = CreateController();

            provider.OnSearch = (_, _) =>
                throw new InvalidOperationException("Invalid geocoding operation");

            var result = await controller.Search("Kyiv");

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal(StatusCodes.Status400BadRequest, badRequestResult.StatusCode);
        }
    }
}

using Microsoft.Extensions.Caching.Memory;
using RouteWise.Api.Models;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Services;

namespace RouteWise.Tests.Services
{
    public class GeocodingSearchServiceTests
    {
        private class TestGeocodingProvider : IGeocodingProvider
        {
            public int SearchCallCount { get; private set; }
            public List<AddressSearchResult> ResultsToReturn { get; set; } = new();

            public LocationPoint Geocode(string address) => new();

            public Task<LocationPoint> GeocodeAsync(
                string address,
                CancellationToken cancellationToken = default) => Task.FromResult(new LocationPoint());

            public Task<IReadOnlyList<AddressSearchResult>> SearchAsync(
                string query,
                int limit = 5,
                CancellationToken cancellationToken = default)
            {
                SearchCallCount++;
                return Task.FromResult<IReadOnlyList<AddressSearchResult>>(ResultsToReturn.Take(limit).ToList());
            }
        }

        [Theory]
        [InlineData("")]
        [InlineData(" ")]
        [InlineData("a")]
        [InlineData(" b ")]
        public async Task SearchAsync_WhenQueryShorterThan2Chars_ReturnsEmptyWithoutCallingProvider(string query)
        {
            var provider = new TestGeocodingProvider();
            using var cache = new MemoryCache(new MemoryCacheOptions());
            var service = new GeocodingSearchService(provider, cache);

            var results = await service.SearchAsync(query);

            Assert.Empty(results);
            Assert.Equal(0, provider.SearchCallCount);
        }

        [Fact]
        public async Task SearchAsync_WhenCalled_MapsResultsToDtoAndCaches()
        {
            var provider = new TestGeocodingProvider
            {
                ResultsToReturn = new List<AddressSearchResult>
                {
                    new()
                    {
                        Address = "Zhytomyr, Ukraine",
                        DisplayName = "Zhytomyr",
                        Coordinates = new LocationPoint { Latitude = 50.25, Longitude = 28.65 },
                        Confidence = 0.9
                    }
                }
            };

            using var cache = new MemoryCache(new MemoryCacheOptions());
            var service = new GeocodingSearchService(provider, cache);

            var results = await service.SearchAsync("Zhytomyr");

            Assert.Single(results);
            Assert.Equal("Zhytomyr, Ukraine", results[0].Address);
            Assert.Equal("Zhytomyr", results[0].DisplayName);
            Assert.Equal(50.25, results[0].Latitude);
            Assert.Equal(28.65, results[0].Longitude);
            Assert.Equal(0.9, results[0].Confidence);
            Assert.Equal(1, provider.SearchCallCount);
        }

        [Fact]
        public async Task SearchAsync_WhenCalledTwice_ReturnsCachedResultWithoutCallingProviderAgain()
        {
            var provider = new TestGeocodingProvider
            {
                ResultsToReturn = new List<AddressSearchResult>
                {
                    new()
                    {
                        Address = "Kyiv, Ukraine",
                        DisplayName = "Kyiv",
                        Coordinates = new LocationPoint { Latitude = 50.45, Longitude = 30.52 }
                    }
                }
            };

            using var cache = new MemoryCache(new MemoryCacheOptions());
            var service = new GeocodingSearchService(provider, cache);

            var firstCall = await service.SearchAsync("Kyiv");
            var secondCall = await service.SearchAsync("  kyiv  ");

            Assert.Single(firstCall);
            Assert.Single(secondCall);
            Assert.Equal("Kyiv, Ukraine", secondCall[0].Address);

            // Provider should only be called once because the second call hits the cache
            Assert.Equal(1, provider.SearchCallCount);
        }

        [Fact]
        public async Task SearchAsync_WhenDifferentLimits_CallsProviderForDifferentCacheKeys()
        {
            var provider = new TestGeocodingProvider
            {
                ResultsToReturn = new List<AddressSearchResult>
                {
                    new() { Address = "Addr 1", DisplayName = "Addr 1" },
                    new() { Address = "Addr 2", DisplayName = "Addr 2" },
                    new() { Address = "Addr 3", DisplayName = "Addr 3" }
                }
            };

            using var cache = new MemoryCache(new MemoryCacheOptions());
            var service = new GeocodingSearchService(provider, cache);

            var limit2 = await service.SearchAsync("Lviv", limit: 2);
            var limit3 = await service.SearchAsync("Lviv", limit: 3);

            Assert.Equal(2, limit2.Count);
            Assert.Equal(3, limit3.Count);
            Assert.Equal(2, provider.SearchCallCount);
        }
    }
}

using RouteWise.Api.Models;
using Xunit;

namespace RouteWise.Tests.Models
{
    public class TravelModeTests
    {
        [Theory]
        [InlineData("driving", true)]
        [InlineData("walking", true)]
        [InlineData("cycling", true)]
        [InlineData("DRIVING", true)]
        [InlineData("Walking", true)]
        [InlineData("CYCLING", true)]
        [InlineData("flying", false)]
        [InlineData("train", false)]
        [InlineData("", false)]
        [InlineData(null, false)]
        public void IsValid_ReturnsExpectedResult(string? mode, bool expected)
        {
            Assert.Equal(expected, TravelMode.IsValid(mode));
        }

        [Theory]
        [InlineData("driving", "driving")]
        [InlineData("DRIVING", "driving")]
        [InlineData("walking", "walking")]
        [InlineData("cycling", "cycling")]
        [InlineData("invalid", "driving")]
        [InlineData("", "driving")]
        [InlineData(null, "driving")]
        public void Normalize_ReturnsExpectedMode(string? mode, string expected)
        {
            Assert.Equal(expected, TravelMode.Normalize(mode));
        }

        [Theory]
        [InlineData("driving", "driving-car")]
        [InlineData("walking", "foot-walking")]
        [InlineData("cycling", "cycling-regular")]
        [InlineData("invalid", "driving-car")]
        [InlineData(null, "driving-car")]
        public void ToOrsProfile_ReturnsExpectedProfile(string? mode, string expectedProfile)
        {
            Assert.Equal(expectedProfile, TravelMode.ToOrsProfile(mode));
        }

        [Fact]
        public void All_ContainsAllThreeTravelModes()
        {
            Assert.Contains(TravelMode.Driving, TravelMode.All);
            Assert.Contains(TravelMode.Walking, TravelMode.All);
            Assert.Contains(TravelMode.Cycling, TravelMode.All);
            Assert.Equal(3, TravelMode.All.Count);
        }
    }
}

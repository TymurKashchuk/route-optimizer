using RouteWise.Api.Optimizers;
using Xunit;

namespace RouteWise.Tests.Optimizers
{
    public class RouteOptimizerRegistryTests
    {
        private readonly RouteOptimizerRegistry _registry;
        private readonly OriginalOrderOptimizer _original = new();
        private readonly NearestNeighborOptimizer _nn = new();
        private readonly TwoOptOptimizer _twoOpt;

        public RouteOptimizerRegistryTests()
        {
            _twoOpt = new TwoOptOptimizer(_nn);
            _registry = new RouteOptimizerRegistry(new IRouteOptimizer[]
            {
                _original,
                _nn,
                _twoOpt
            });
        }

        [Theory]
        [InlineData("original")]
        [InlineData("ORIGINAL")]
        [InlineData("Original")]
        public void GetOptimizer_Original_ReturnsOriginalOptimizerCaseInsensitively(string algorithmName)
        {
            var optimizer = _registry.GetOptimizer(algorithmName);

            Assert.NotNull(optimizer);
            Assert.Same(_original, optimizer);
        }

        [Theory]
        [InlineData("two-opt")]
        [InlineData("TWO-OPT")]
        public void GetOptimizer_TwoOpt_ReturnsTwoOptOptimizer(string algorithmName)
        {
            var optimizer = _registry.GetOptimizer(algorithmName);

            Assert.NotNull(optimizer);
            Assert.Same(_twoOpt, optimizer);
        }

        [Theory]
        [InlineData("nearest-neighbor")]
        [InlineData("NEAREST-NEIGHBOR")]
        public void GetOptimizer_NearestNeighbor_ReturnsNearestNeighborOptimizer(string algorithmName)
        {
            var optimizer = _registry.GetOptimizer(algorithmName);

            Assert.NotNull(optimizer);
            Assert.Same(_nn, optimizer);
        }

        [Theory]
        [InlineData("quantum-annealing")]
        [InlineData("genetic")]
        [InlineData("random")]
        [InlineData("")]
        [InlineData(null)]
        public void GetOptimizer_UnknownOrInvalidAlgorithm_ReturnsNull(string? algorithmName)
        {
            var optimizer = _registry.GetOptimizer(algorithmName!);

            Assert.Null(optimizer);
        }

        [Fact]
        public void IsSupported_ReturnsTrueForRegisteredAndFalseForUnknown()
        {
            Assert.True(_registry.IsSupported("original"));
            Assert.True(_registry.IsSupported("two-opt"));
            Assert.True(_registry.IsSupported("nearest-neighbor"));
            Assert.False(_registry.IsSupported("unknown"));
            Assert.False(_registry.IsSupported(""));
        }

        [Fact]
        public void GetAvailableAlgorithmNames_ReturnsAllRegisteredNames()
        {
            var names = _registry.GetAvailableAlgorithmNames();

            Assert.Contains("original", names);
            Assert.Contains("nearest-neighbor", names);
            Assert.Contains("two-opt", names);
            Assert.Equal(3, names.Count);
        }
    }
}

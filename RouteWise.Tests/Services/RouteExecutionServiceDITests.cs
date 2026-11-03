using Microsoft.Extensions.DependencyInjection;
using RouteWise.Api.Optimizers;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;
using RouteWise.Api.Services;
using Xunit;

namespace RouteWise.Tests.Services
{
    public class RouteExecutionServiceDITests
    {
        [Fact]
        public void RouteExecutionService_CanBeResolvedFromDI_WithoutAmbiguousConstructorException()
        {
            var services = new ServiceCollection();

            services.AddScoped<RouteMatrixService>();
            services.AddScoped<IGeocodingProvider, StaticGeocodingProvider>();
            services.AddScoped<IRouteProvider, StaticRouteProvider>();
            services.AddScoped<StaticRouteProvider>();

            services.AddScoped<IRouteOptimizer, OriginalOrderOptimizer>();
            services.AddScoped<IRouteOptimizer, NearestNeighborOptimizer>();
            services.AddScoped<IRouteOptimizerRegistry, RouteOptimizerRegistry>();

            services.AddScoped<MetricsService>();
            services.AddScoped<TimelineService>();
            services.AddScoped<RouteComparisonService>();
            services.AddScoped<RouteExplanationService>();
            services.AddScoped<RoutePreviewService>();

            services.AddScoped<RouteExecutionService>();

            // Build with validation enabled (same as ASP.NET Core Development mode)
            var serviceProvider = services.BuildServiceProvider(new ServiceProviderOptions
            {
                ValidateOnBuild = true,
                ValidateScopes = true
            });

            using var scope = serviceProvider.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<RouteExecutionService>();

            Assert.NotNull(service);
        }
    }
}

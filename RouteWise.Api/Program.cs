using RouteWise.Api.Optimizers;
using RouteWise.Api.Services;
using RouteWise.Api.Providers.Geocoding;
using RouteWise.Api.Providers.Routing;
using FluentValidation;
using FluentValidation.AspNetCore;
using RouteWise.Api.Validators;
using RouteWise.Api.Options;
using Microsoft.Extensions.Options;
using System.Reflection;

namespace RouteWise.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddFluentValidationAutoValidation();

            builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var defaultCorsOrigins = new[]
            {
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:80",
                "http://localhost"
            };
            var configuredCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            var allowedOrigins = (configuredCorsOrigins != null && configuredCorsOrigins.Length > 0)
                ? configuredCorsOrigins
                : defaultCorsOrigins;

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            builder.Services.AddScoped<RouteOptimizationService>();
            builder.Services.AddScoped<RouteMatrixService>();

            builder.Services.AddScoped<IRouteOptimizer, OriginalOrderOptimizer>();
            builder.Services.AddScoped<IRouteOptimizer, NearestNeighborOptimizer>();
            builder.Services.AddScoped<IRouteOptimizer>(sp => new TwoOptOptimizer(new NearestNeighborOptimizer()));

            builder.Services.AddMemoryCache();
            builder.Services.AddScoped<GeocodingSearchService>();

            builder.Services.AddScoped<StaticGeocodingProvider>();
            builder.Services.AddScoped<IGeocodingProvider>(sp =>
            {
                var options = sp.GetRequiredService<IOptions<OpenRouteServiceOptions>>().Value;
                return !string.IsNullOrWhiteSpace(options.ApiKey)
                    ? sp.GetRequiredService<OpenRouteServiceGeocodingProvider>()
                    : sp.GetRequiredService<StaticGeocodingProvider>();
            });
            builder.Services.AddScoped<StaticRouteProvider>();
            builder.Services.AddScoped<IRouteProvider>(sp =>
            {
                var options = sp.GetRequiredService<IOptions<OpenRouteServiceOptions>>().Value;
                return !string.IsNullOrWhiteSpace(options.ApiKey)
                    ? sp.GetRequiredService<OpenRouteServiceRouteProvider>()
                    : sp.GetRequiredService<StaticRouteProvider>();
            });

            builder.Services.AddScoped<MetricsService>();
            builder.Services.AddScoped<TimelineService>();

            builder.Services.AddScoped<RouteComparisonService>();
            builder.Services.AddScoped<RouteExecutionService>();

            builder.Services.AddScoped<RouteExplanationService>();
            builder.Services.AddScoped<RoutePreviewService>();

            builder.Services.Configure<OpenRouteServiceOptions>(
                builder.Configuration.GetSection(OpenRouteServiceOptions.SectionName));

            builder.Services.AddHttpClient<OpenRouteServiceRouteProvider>((serviceProvider, httpClient) =>
            {
                var options = serviceProvider.GetRequiredService<IOptions<OpenRouteServiceOptions>>().Value;
                httpClient.BaseAddress = new Uri(options.BaseUrl);
                httpClient.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
            });

            builder.Services.AddHttpClient<OpenRouteServiceGeocodingProvider>((serviceProvider, httpClient) =>
            {
                var options = serviceProvider.GetRequiredService<IOptions<OpenRouteServiceOptions>>().Value;
                var geocodingUrl = (options.GeocodingBaseUrl ?? "https://api.heigit.org/pelias/v1").TrimEnd('/') + "/";
                httpClient.BaseAddress = new Uri(geocodingUrl);
                httpClient.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors();

            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseAuthorization();


            app.MapControllers();


            app.Run();
        }
    }
}

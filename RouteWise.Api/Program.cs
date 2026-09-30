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

            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            builder.Services.AddScoped<RouteOptimizationService>();
            builder.Services.AddScoped<RouteMatrixService>();

            builder.Services.AddScoped<IRouteOptimizer, OriginalOrderOptimizer>();
            builder.Services.AddScoped<IRouteOptimizer, NearestNeighborOptimizer>();
            builder.Services.AddScoped<IRouteOptimizer>(sp => new TwoOptOptimizer(new NearestNeighborOptimizer()));

            builder.Services.AddScoped<IGeocodingProvider, StaticGeocodingProvider>();
            builder.Services.AddScoped<IRouteProvider, StaticRouteProvider>();

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

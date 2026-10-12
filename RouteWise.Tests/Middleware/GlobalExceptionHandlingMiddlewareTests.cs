using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Middleware;

namespace RouteWise.Tests.Middleware
{
    public class GlobalExceptionHandlingMiddlewareTests
    {
        [Fact]
        public async Task InvokeAsync_WhenNoException_DoesNotModifyResponse()
        {
            var middleware = new GlobalExceptionHandlingMiddleware(
                _ => Task.CompletedTask,
                NullLogger<GlobalExceptionHandlingMiddleware>.Instance);

            var context = new DefaultHttpContext();
            await middleware.InvokeAsync(context);

            Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        }

        [Fact]
        public async Task InvokeAsync_WhenOpenRouteServiceException_ReturnsMappedStatusCodeAndJsonError()
        {
            var middleware = new GlobalExceptionHandlingMiddleware(
                _ => throw new OpenRouteServiceException("Quota exceeded", HttpStatusCode.TooManyRequests),
                NullLogger<GlobalExceptionHandlingMiddleware>.Instance);

            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            await middleware.InvokeAsync(context);

            Assert.Equal(StatusCodes.Status429TooManyRequests, context.Response.StatusCode);
            Assert.Equal("application/json", context.Response.ContentType);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var responseBody = await reader.ReadToEndAsync();
            var json = JsonSerializer.Deserialize<Dictionary<string, string>>(responseBody);
            Assert.NotNull(json);
            Assert.Equal("Quota exceeded", json["error"]);
        }

        [Fact]
        public async Task InvokeAsync_WhenInvalidOperationException_Returns400BadRequest()
        {
            var middleware = new GlobalExceptionHandlingMiddleware(
                _ => throw new InvalidOperationException("Invalid operation performed"),
                NullLogger<GlobalExceptionHandlingMiddleware>.Instance);

            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            await middleware.InvokeAsync(context);

            Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
            Assert.Equal("application/json", context.Response.ContentType);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var responseBody = await reader.ReadToEndAsync();
            var json = JsonSerializer.Deserialize<Dictionary<string, string>>(responseBody);
            Assert.NotNull(json);
            Assert.Equal("Invalid operation performed", json["error"]);
        }

        [Fact]
        public async Task InvokeAsync_WhenUnhandledException_Returns500InternalServerError()
        {
            var middleware = new GlobalExceptionHandlingMiddleware(
                _ => throw new Exception("Unexpected crash"),
                NullLogger<GlobalExceptionHandlingMiddleware>.Instance);

            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            await middleware.InvokeAsync(context);

            Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
            Assert.Equal("application/json", context.Response.ContentType);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var responseBody = await reader.ReadToEndAsync();
            var json = JsonSerializer.Deserialize<Dictionary<string, string>>(responseBody);
            Assert.NotNull(json);
            Assert.Equal("An unexpected error occurred. Please try again later.", json["error"]);
        }
    }
}

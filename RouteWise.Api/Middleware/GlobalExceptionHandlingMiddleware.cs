using System.Net;
using System.Text.Json;
using RouteWise.Api.Exceptions;

namespace RouteWise.Api.Middleware
{
    public class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

        public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                // The client hung up (e.g. the browser cancelled the request). Nobody is listening,
                // so this is not an error: log quietly and use 499 ("Client Closed Request").
                _logger.LogDebug("Request {Path} was cancelled by the client", context.Request.Path);
                context.Response.StatusCode = 499;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred while processing request {Path}", context.Request.Path);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var (statusCode, message) = exception switch
            {
                OpenRouteServiceException orsEx => (ApiExceptionMapper.ToStatusCode(orsEx), orsEx.Message),
                InvalidOperationException invEx => (StatusCodes.Status400BadRequest, invEx.Message),
                _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred. Please try again later.")
            };

            context.Response.StatusCode = statusCode;
            var response = new { error = message };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}

using System.Net;

namespace RouteWise.Api.Exceptions
{
    public class OpenRouteServiceException : Exception
    {
        public HttpStatusCode? StatusCode { get; }

        public OpenRouteServiceException(string message) 
            : base(message)
        {
        }

        public OpenRouteServiceException(string message, HttpStatusCode statusCode) 
            : base(message)
        {
            StatusCode = statusCode;
        }

        public OpenRouteServiceException(string message, Exception innerException) 
            : base(message, innerException)
        {
        }

        public OpenRouteServiceException(string message, HttpStatusCode statusCode, Exception innerException) 
            : base(message, innerException)
        {
            StatusCode = statusCode;
        }

        public static void ThrowForStatusCode(HttpStatusCode statusCode)
        {
            var message = statusCode switch
            {
                HttpStatusCode.Unauthorized => "Invalid or unauthorized OpenRouteService API key.",
                HttpStatusCode.Forbidden => "Access to OpenRouteService is forbidden.",
                HttpStatusCode.TooManyRequests => "OpenRouteService rate limit exceeded. Please try again later.",
                _ when (int)statusCode >= 500 => "OpenRouteService server error encountered. Service may be temporarily unavailable.",
                _ => $"OpenRouteService returned an unexpected error ({(int)statusCode})."
            };

            throw new OpenRouteServiceException(message, statusCode);
        }
    }
}

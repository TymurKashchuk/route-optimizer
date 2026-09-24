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
    }
}

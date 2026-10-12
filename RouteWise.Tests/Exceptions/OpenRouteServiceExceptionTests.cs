using System.Net;
using RouteWise.Api.Exceptions;

namespace RouteWise.Tests.Exceptions
{
    public class OpenRouteServiceExceptionTests
    {
        [Theory]
        [InlineData(HttpStatusCode.Unauthorized, "unauthorized")]
        [InlineData(HttpStatusCode.Forbidden, "forbidden")]
        [InlineData(HttpStatusCode.TooManyRequests, "rate limit")]
        [InlineData(HttpStatusCode.InternalServerError, "server error")]
        [InlineData(HttpStatusCode.BadGateway, "server error")]
        [InlineData(HttpStatusCode.ServiceUnavailable, "server error")]
        [InlineData(HttpStatusCode.NotFound, "unexpected error")]
        public void ThrowForStatusCode_ThrowsAppropriateException(HttpStatusCode statusCode, string expectedMessageSubstring)
        {
            var ex = Assert.Throws<OpenRouteServiceException>(() =>
                OpenRouteServiceException.ThrowForStatusCode(statusCode));

            Assert.Equal(statusCode, ex.StatusCode);
            Assert.Contains(expectedMessageSubstring, ex.Message, StringComparison.OrdinalIgnoreCase);
        }
    }
}

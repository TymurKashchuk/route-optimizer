using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RouteWise.Api.Exceptions;
using Xunit;

namespace RouteWise.Tests.Exceptions
{
    public class ApiExceptionMapperTests
    {
        [Theory]
        [InlineData(HttpStatusCode.Unauthorized, StatusCodes.Status502BadGateway)]
        [InlineData(HttpStatusCode.Forbidden, StatusCodes.Status502BadGateway)]
        [InlineData(HttpStatusCode.TooManyRequests, StatusCodes.Status429TooManyRequests)]
        [InlineData(HttpStatusCode.InternalServerError, StatusCodes.Status502BadGateway)]
        [InlineData(HttpStatusCode.BadGateway, StatusCodes.Status502BadGateway)]
        [InlineData(HttpStatusCode.ServiceUnavailable, StatusCodes.Status503ServiceUnavailable)]
        [InlineData(HttpStatusCode.GatewayTimeout, StatusCodes.Status504GatewayTimeout)]
        public void ToStatusCode_MapsKnownStatusesCorrectly(HttpStatusCode orsStatus, int expectedHttpCode)
        {
            var ex = new OpenRouteServiceException("Test error", orsStatus);

            var code = ApiExceptionMapper.ToStatusCode(ex);

            Assert.Equal(expectedHttpCode, code);
        }

        [Fact]
        public void ToStatusCode_WhenStatusCodeNull_DefaultsTo502()
        {
            var ex = new OpenRouteServiceException("Network failed");

            var code = ApiExceptionMapper.ToStatusCode(ex);

            Assert.Equal(StatusCodes.Status502BadGateway, code);
        }

        [Fact]
        public void ToActionResult_ForOpenRouteServiceException_ReturnsObjectResult()
        {
            var ex = new OpenRouteServiceException("Rate limit reached", HttpStatusCode.TooManyRequests);

            var result = ApiExceptionMapper.ToActionResult(ex);

            Assert.Equal(StatusCodes.Status429TooManyRequests, result.StatusCode);
            Assert.NotNull(result.Value);
        }

        [Fact]
        public void ToActionResult_ForUserInputException_ReturnsBadRequestObjectResult()
        {
            var ex = new UserInputException("Invalid stop specified");

            var result = ApiExceptionMapper.ToActionResult(ex);

            Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(StatusCodes.Status400BadRequest, result.StatusCode);
            Assert.NotNull(result.Value);
        }
    }
}

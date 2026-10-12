using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace RouteWise.Api.Exceptions
{
    public static class ApiExceptionMapper
    {
        public static int ToStatusCode(OpenRouteServiceException ex)
        {
            return ex.StatusCode switch
            {
                HttpStatusCode.Unauthorized => StatusCodes.Status502BadGateway,
                HttpStatusCode.Forbidden => StatusCodes.Status502BadGateway,
                HttpStatusCode.TooManyRequests => StatusCodes.Status429TooManyRequests,
                HttpStatusCode.InternalServerError => StatusCodes.Status502BadGateway,
                HttpStatusCode.BadGateway => StatusCodes.Status502BadGateway,
                HttpStatusCode.ServiceUnavailable => StatusCodes.Status503ServiceUnavailable,
                HttpStatusCode.GatewayTimeout => StatusCodes.Status504GatewayTimeout,
                _ => StatusCodes.Status502BadGateway
            };
        }

        public static ObjectResult ToActionResult(OpenRouteServiceException ex)
        {
            return new ObjectResult(new { error = ex.Message })
            {
                StatusCode = ToStatusCode(ex)
            };
        }

        public static BadRequestObjectResult ToActionResult(InvalidOperationException ex)
        {
            return new BadRequestObjectResult(new { error = ex.Message });
        }
    }
}

using System.Net;
using Microsoft.AspNetCore.Mvc;
using RouteWise.Api.Contracts.Requests;
using RouteWise.Api.Contracts.Responses;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Services;

namespace RouteWise.Api.Controllers
{
    [ApiController]
    [Route("api/routes")]
    public class RouteOptimizationController : ControllerBase
    {
        private readonly RouteExecutionService _routeExecutionService;

        public RouteOptimizationController(RouteExecutionService routeExecutionService)
        {
            _routeExecutionService = routeExecutionService;
        }

        [HttpPost("optimize")]
        public async Task<ActionResult<OptimizeRouteResponse>> Optimize(
            OptimizeRouteRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var response = await _routeExecutionService.ExecuteAsync(
                    request.Algorithm,
                    request.Start,
                    request.DepartureTime ?? DateTime.UtcNow,
                    request.Stops,
                    request.Destination,
                    cancellationToken);

                return Ok(response);
            }
            catch (OpenRouteServiceException ex)
            {
                var statusCode = ex.StatusCode switch
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

                return StatusCode(statusCode, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}

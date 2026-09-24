using Microsoft.AspNetCore.Mvc;
using RouteWise.Api.Contracts.Requests;
using RouteWise.Api.Contracts.Responses;
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
            var response = await _routeExecutionService.ExecuteAsync(
                request.Algorithm,
                request.Start,
                request.DepartureTime,
                request.Stops,
                cancellationToken);

            return Ok(response);
        }
    }
}

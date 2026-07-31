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

        public RouteOptimizationController(RouteExecutionService routeExecutionService){
            _routeExecutionService = routeExecutionService;
        }

        [HttpPost("optimize")]
        public ActionResult<OptimizeRouteResponse> Optimize(OptimizeRouteRequest request) {
            var response = _routeExecutionService.Execute(
                request.Algorithm,
                request.Start,
                request.DepartureTime,
                request.Stops
                );

            return Ok(response);
        }
    }
}

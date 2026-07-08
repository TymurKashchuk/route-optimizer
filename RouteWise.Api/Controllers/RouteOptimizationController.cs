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
        private readonly RouteOptimizationService _routeOptimizationService;

        public RouteOptimizationController(RouteOptimizationService routeOptimizationService)
        {
            _routeOptimizationService = routeOptimizationService;
        }

        [HttpPost("optimize")]
        public ActionResult<OptimizeRouteResponse> Optimize(OptimizeRouteRequest request) {
            var optimizationResult = _routeOptimizationService.Optimize(request.Algorithm, request.Stops);

            var totalServiceMinutes = optimizationResult.OrderedStops.Sum(stop => stop.ServiceMinutes);

            var response = new OptimizeRouteResponse
            {
                Algorithm = optimizationResult.Algorithm,
                TotalStops = optimizationResult.OrderedStops.Count,
                StartLabel = request.Start.Label,
                OrderedStops = optimizationResult.OrderedStops.Select(stop => stop.Label).ToList(),
                TotalServiceMinutes = totalServiceMinutes
            };

            return Ok(response);
        }
    }
}

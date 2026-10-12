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
                var response = await _routeExecutionService.ExecuteAsync(request, cancellationToken);

                return Ok(response);
            }
            catch (OpenRouteServiceException ex)
            {
                return ApiExceptionMapper.ToActionResult(ex);
            }
            catch (InvalidOperationException ex)
            {
                return ApiExceptionMapper.ToActionResult(ex);
            }
        }
    }
}

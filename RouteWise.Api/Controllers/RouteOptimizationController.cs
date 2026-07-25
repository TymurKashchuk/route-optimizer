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
        private readonly RouteMatrixService _routeMatrixService;
        private readonly MetricsService _metricsService;
        private readonly TimelineService _timelineService;

        public RouteOptimizationController(
            RouteOptimizationService routeOptimizationService, 
            RouteMatrixService routeMatrixService, 
            MetricsService metricsService, 
            TimelineService timelineService)
        {
            _routeOptimizationService = routeOptimizationService;
            _routeMatrixService = routeMatrixService;
            _metricsService = metricsService;
            _timelineService = timelineService;
        }

        [HttpPost("optimize")]
        public ActionResult<OptimizeRouteResponse> Optimize(OptimizeRouteRequest request) {
            var matrixResult = _routeMatrixService.BuildMatrix(request.Start, request.Stops);
            
            var optimizationResult = _routeOptimizationService.Optimize(
                request.Algorithm,
                request.Start,
                request.Stops);

            var metrics = _metricsService.Calculate(
                optimizationResult.OrderedStops,
                optimizationResult.OrderedStopIndices,
                matrixResult.Matrix);

            var timeline = _timelineService.Build(
                request.Start,
                request.DepartureTime,
                optimizationResult.OrderedStops,
                optimizationResult.OrderedStopIndices,
                matrixResult.Matrix);

            var response = new OptimizeRouteResponse
            {
                Algorithm = optimizationResult.Algorithm,
                OrderedStops = optimizationResult.OrderedStops
                .Select(stop => stop.Label)
                .ToList(),
                Optimized = new RouteMetricsDto
                {
                    TotalTravelMinutes = metrics.TotalTravelMinutes,
                    TotalDistanceKm = metrics.TotalDistanceKm,
                    TotalServiceMinutes = metrics.TotalServiceMinutes
                },
                Timeline = timeline.Select(item => new TimelineItemDto
                {
                    Label = item.Label,
                    ArrivalTime = item.ArrivalTime,
                    DepartureTime = item.DepartureTime
                }).ToList()
            };

            return Ok(response);
        }
    }
}

using RouteWise.Api.Contracts.Requests;
using RouteWise.Api.Contracts.Responses;
using RouteWise.Api.Models;
using RouteWise.Api.Optimizers;

namespace RouteWise.Api.Services
{
    public class RouteExecutionService
    {
        private readonly RouteMatrixService _routeMatrixService;
        private readonly IEnumerable<IRouteOptimizer> _optimizers;
        private readonly MetricsService _metricsService;
        private readonly TimelineService _timelineService;
        private readonly RouteComparisonService _routeComparisonService;
        private readonly RouteExplanationService _routeExplanationService;
        private readonly RoutePreviewService _routePreviewService;

        public RouteExecutionService(
            RouteMatrixService routeMatrixService,
            IEnumerable<IRouteOptimizer> optimizers,
            MetricsService metricsService,
            TimelineService timelineService,
            RouteComparisonService routeComparisonService,
            RouteExplanationService routeExplanationService,
            RoutePreviewService routePreviewService)
        {
            _routeMatrixService = routeMatrixService;
            _optimizers = optimizers;
            _metricsService = metricsService;
            _timelineService = timelineService;
            _routeComparisonService = routeComparisonService;
            _routeExplanationService = routeExplanationService;
            _routePreviewService = routePreviewService;
        }

        public async Task<OptimizeRouteResponse> ExecuteAsync(
            OptimizeRouteRequest request,
            CancellationToken cancellationToken = default)
        {
            var algorithm = request.Algorithm;
            var start = request.Start;
            var planningMode = request.PlanningMode;
            var departureTime = request.DepartureTime;
            var arrivalBy = request.ArrivalBy;
            var stops = request.Stops;
            var destination = (request.Destination != null && (!string.IsNullOrWhiteSpace(request.Destination.Address) || request.Destination.Latitude.HasValue))
                ? request.Destination
                : null;
            var travelMode = request.TravelMode;

            var matrixResult = await _routeMatrixService.BuildMatrixAsync(start, stops, destination, travelMode, cancellationToken);

            var originalOptimizer = _optimizers.First(o =>
                o.AlgorithmName.Equals("original", StringComparison.OrdinalIgnoreCase));

            var selectedOptimizer = _optimizers.FirstOrDefault(o =>
                o.AlgorithmName.Equals(algorithm, StringComparison.OrdinalIgnoreCase));

            if (selectedOptimizer is null)
            {
                throw new InvalidOperationException($"Unknown algorithm: {algorithm}");
            }

            int? destinationMatrixIndex = destination != null ? stops.Count + 1 : null;

            var originalResult = originalOptimizer.Optimize(stops, matrixResult.Matrix, destinationMatrixIndex);
            var optimizedResult = selectedOptimizer.Optimize(stops, matrixResult.Matrix, destinationMatrixIndex);

            var originalMetrics = _metricsService.Calculate(
                originalResult.OrderedStops,
                originalResult.OrderedStopIndices,
                matrixResult.Matrix,
                destinationMatrixIndex);

            var optimizedMetrics = _metricsService.Calculate(
                optimizedResult.OrderedStops,
                optimizedResult.OrderedStopIndices,
                matrixResult.Matrix,
                destinationMatrixIndex);

            var comparison = _routeComparisonService.Compare(originalMetrics, optimizedMetrics);

            var isArriveBy = string.Equals(planningMode, "arrive-by", StringComparison.OrdinalIgnoreCase);
            var totalTripMinutes = optimizedMetrics.TotalTravelMinutes + optimizedMetrics.TotalServiceMinutes;

            DateTime effectiveDepartureTime;
            DateTime? recommendedDepartureTime = null;

            if (isArriveBy && arrivalBy.HasValue)
            {
                effectiveDepartureTime = arrivalBy.Value.AddMinutes(-totalTripMinutes);
                recommendedDepartureTime = effectiveDepartureTime;
            }
            else
            {
                effectiveDepartureTime = departureTime ?? DateTime.UtcNow;
                recommendedDepartureTime = effectiveDepartureTime;
            }

            var timeline = _timelineService.Build(
                start,
                effectiveDepartureTime,
                optimizedResult.OrderedStops,
                optimizedResult.OrderedStopIndices,
                matrixResult.Matrix,
                destination,
                destinationMatrixIndex);

            var explanationSteps = _routeExplanationService.Build(
                start,
                optimizedResult.OrderedStops,
                optimizedResult.OrderedStopIndices,
                matrixResult.Matrix,
                destination,
                destinationMatrixIndex);

            var routePreview = await _routePreviewService.BuildAsync(
                start,
                optimizedResult.OrderedStops,
                optimizedResult.OrderedStopIndices,
                matrixResult.Locations,
                destination,
                travelMode,
                cancellationToken);

            return new OptimizeRouteResponse
            {
                Algorithm = optimizedResult.Algorithm,
                PlanningMode = isArriveBy ? "arrive-by" : "depart-at",
                TravelMode = TravelMode.Normalize(travelMode),
                RecommendedDepartureTime = recommendedDepartureTime,
                Original = new RouteMetricsDto
                {
                    TotalTravelMinutes = originalMetrics.TotalTravelMinutes,
                    TotalDistanceKm = originalMetrics.TotalDistanceKm,
                    TotalServiceMinutes = originalMetrics.TotalServiceMinutes
                },
                Optimized = new RouteMetricsDto
                {
                    TotalTravelMinutes = optimizedMetrics.TotalTravelMinutes,
                    TotalDistanceKm = optimizedMetrics.TotalDistanceKm,
                    TotalServiceMinutes = optimizedMetrics.TotalServiceMinutes
                },
                SavedMinutes = comparison.SavedMinutes,
                SavedDistanceKm = comparison.SavedDistanceKm,
                ImprovementPercent = comparison.ImprovementPercent,
                ExplanationSteps = explanationSteps,
                OrderedStops = optimizedResult.OrderedStops
                    .Select(stop => stop.Label)
                    .ToList(),
                Timeline = timeline.Select(item => new TimelineItemDto
                {
                    Label = item.Label,
                    ArrivalTime = item.ArrivalTime,
                    DepartureTime = item.DepartureTime
                }).ToList(),
                RoutePreview = routePreview
            };
        }
    }
}

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

        public RouteExecutionService(
            RouteMatrixService routeMatrixService,
            IEnumerable<IRouteOptimizer> optimizers,
            MetricsService metricsService,
            TimelineService timelineService,
            RouteComparisonService routeComparisonService,
            RouteExplanationService routeExplanationService)
        {
            _routeMatrixService = routeMatrixService;
            _optimizers = optimizers;
            _metricsService = metricsService;
            _timelineService = timelineService;
            _routeComparisonService = routeComparisonService;
            _routeExplanationService = routeExplanationService;
        }

        public async Task<OptimizeRouteResponse> ExecuteAsync(
            string algorithm,
            AddressInput start,
            DateTime departureTime,
            List<RouteStop> stops,
            CancellationToken cancellationToken = default)
        {
            var matrixResult = await _routeMatrixService.BuildMatrixAsync(start, stops, cancellationToken);

            var originalOptimizer = _optimizers.First(o =>
                o.AlgorithmName.Equals("original", StringComparison.OrdinalIgnoreCase));

            var selectedOptimizer = _optimizers.FirstOrDefault(o =>
                o.AlgorithmName.Equals(algorithm, StringComparison.OrdinalIgnoreCase));

            if (selectedOptimizer is null)
            {
                throw new InvalidOperationException($"Unknown algorithm: {algorithm}");
            }

            var originalResult = originalOptimizer.Optimize(stops, matrixResult.Matrix);
            var optimizedResult = selectedOptimizer.Optimize(stops, matrixResult.Matrix);

            var originalMetrics = _metricsService.Calculate(
                originalResult.OrderedStops,
                originalResult.OrderedStopIndices,
                matrixResult.Matrix);

            var optimizedMetrics = _metricsService.Calculate(
                optimizedResult.OrderedStops,
                optimizedResult.OrderedStopIndices,
                matrixResult.Matrix);

            var comparison = _routeComparisonService.Compare(originalMetrics, optimizedMetrics);

            var timeline = _timelineService.Build(
                start,
                departureTime,
                optimizedResult.OrderedStops,
                optimizedResult.OrderedStopIndices,
                matrixResult.Matrix);

            var explanationSteps = _routeExplanationService.Build(
                start,
                optimizedResult.OrderedStops,
                optimizedResult.OrderedStopIndices,
                matrixResult.Matrix);

            return new OptimizeRouteResponse
            {
                Algorithm = optimizedResult.Algorithm,
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
                }).ToList()
            };
        }
    }
}

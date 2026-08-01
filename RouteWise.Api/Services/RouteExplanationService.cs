using RouteWise.Api.Contracts.Responses;
using RouteWise.Api.Models;

namespace RouteWise.Api.Services
{
    public class RouteExplanationService
    {
        public List<RouteStepDto> Build(
        AddressInput start,
        List<RouteStop> orderedStops,
        List<int> orderedStopIndices,
        RouteMatrix matrix)
        { 
            var steps = new List<RouteStepDto>();
            var currentLabel = start.Label;
            var currentMatrixIndex = 0;

            for (int i = 0; i < orderedStops.Count; i++)
            {
                var stop = orderedStops[i];
                var nextMatrixIndex = orderedStopIndices[i] + 1;

                var travelMinutes = matrix.TravelTimesMinutes[currentMatrixIndex][nextMatrixIndex];

                steps.Add(new RouteStepDto
                {
                    From = currentLabel,
                    To = stop.Label,
                    TravelMinutes = travelMinutes
                });

                currentLabel = stop.Label;
                currentMatrixIndex = nextMatrixIndex;
            }

            return steps;
        }
    }
}

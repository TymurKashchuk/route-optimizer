using RouteWise.Api.Models;

namespace RouteWise.Api.Services
{
    public class TimelineService
    {
        public List<TimelineItem> Build(
        AddressInput start,
        DateTime departureTime,
        List<RouteStop> orderedStops,
        List<int> orderedStopIndices,
        RouteMatrix matrix)
        {
            var timeline = new List<TimelineItem>
        {
            new TimelineItem
            {
                Label = start.Label,
                ArrivalTime = departureTime,
                DepartureTime = departureTime
            }
        };

            var currentTime = departureTime;
            var currentMatrixIndex = 0;

            for (int i = 0; i < orderedStops.Count; i++)
            {
                var stop = orderedStops[i];
                var nextMatrixIndex = orderedStopIndices[i] + 1;

                var travelMinutes = matrix.TravelTimesMinutes[currentMatrixIndex][nextMatrixIndex];
                currentTime = currentTime.AddMinutes(travelMinutes);

                var arrivalTime = currentTime;
                var departureFromStop = arrivalTime.AddMinutes(stop.ServiceMinutes);

                timeline.Add(new TimelineItem
                {
                    Label = stop.Label,
                    ArrivalTime = arrivalTime,
                    DepartureTime = departureFromStop
                });

                currentTime = departureFromStop;
                currentMatrixIndex = nextMatrixIndex;
            }

            return timeline;
        }
    }
}

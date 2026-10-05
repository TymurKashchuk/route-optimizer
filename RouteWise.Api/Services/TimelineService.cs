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
            RouteMatrix matrix,
            AddressInput? destination = null,
            int? destinationMatrixIndex = null)
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

            if (destination != null)
            {
                var destIndex = destinationMatrixIndex ?? (orderedStops.Count + 1);
                var travelMinutes = matrix.TravelTimesMinutes[currentMatrixIndex][destIndex];
                currentTime = currentTime.AddMinutes(travelMinutes);

                timeline.Add(new TimelineItem
                {
                    Label = destination.Label,
                    ArrivalTime = currentTime,
                    DepartureTime = currentTime
                });
            }

            return timeline;
        }
    }
}

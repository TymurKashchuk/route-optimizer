namespace RouteWise.Api.Models
{
    public class RouteMatrix
    {
        public List<List<int>> TravelTimesSeconds { get; set; } = new();

        public List<List<int>> TravelTimesMinutes { get; set; } = new();

        public List<List<double>> DistancesKm { get; set; } = new();

        public int GetTravelTimeSeconds(int fromIndex, int toIndex)
        {
            if (TravelTimesSeconds.Count > fromIndex && TravelTimesSeconds[fromIndex].Count > toIndex)
            {
                return TravelTimesSeconds[fromIndex][toIndex];
            }

            if (TravelTimesMinutes.Count > fromIndex && TravelTimesMinutes[fromIndex].Count > toIndex)
            {
                return TravelTimesMinutes[fromIndex][toIndex] * 60;
            }

            return 0;
        }

        public int GetTravelTimeMinutes(int fromIndex, int toIndex)
        {
            if (TravelTimesMinutes.Count > fromIndex && TravelTimesMinutes[fromIndex].Count > toIndex)
            {
                return TravelTimesMinutes[fromIndex][toIndex];
            }

            if (TravelTimesSeconds.Count > fromIndex && TravelTimesSeconds[fromIndex].Count > toIndex)
            {
                return (int)Math.Round(TravelTimesSeconds[fromIndex][toIndex] / 60.0);
            }

            return 0;
        }
    }
}

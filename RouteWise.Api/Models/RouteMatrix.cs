namespace RouteWise.Api.Models
{
    public class RouteMatrix
    {
        public List<List<int>> TravelTimesMinutes { get; set; } = new();

        public List<List<double>> DistancesKm { get; set; } = new();
    }
}

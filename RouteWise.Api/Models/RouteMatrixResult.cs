namespace RouteWise.Api.Models
{
    public class RouteMatrixResult
    {
        public List<LocationPoint> Locations { get; set; } = new();

        public RouteMatrix Matrix { get; set; } = new();
    }
}

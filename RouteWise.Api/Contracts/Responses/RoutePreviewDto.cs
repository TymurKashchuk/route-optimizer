using RouteWise.Api.Models;

namespace RouteWise.Api.Contracts.Responses
{
    public class RoutePreviewDto
    {
        public RoutePointDto StartPoint { get; set; } = new();

        public RoutePointDto DestinationPoint { get; set; } = new();

        public List<RoutePointDto> OrderedStops { get; set; } = new();

        public List<LocationPoint> GeometryCoordinates { get; set; } = new();
    }
}

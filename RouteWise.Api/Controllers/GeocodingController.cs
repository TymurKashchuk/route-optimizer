using System.Net;
using Microsoft.AspNetCore.Mvc;
using RouteWise.Api.Contracts.Responses;
using RouteWise.Api.Exceptions;
using RouteWise.Api.Services;

namespace RouteWise.Api.Controllers
{
    [ApiController]
    [Route("api/geocoding")]
    public class GeocodingController : ControllerBase
    {
        private readonly GeocodingSearchService _geocodingSearchService;

        public GeocodingController(GeocodingSearchService geocodingSearchService)
        {
            _geocodingSearchService = geocodingSearchService;
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(IReadOnlyList<AddressSuggestionDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        [ProducesResponseType(StatusCodes.Status502BadGateway)]
        public async Task<ActionResult<IReadOnlyList<AddressSuggestionDto>>> Search(
            [FromQuery] string? query,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                return Ok(Array.Empty<AddressSuggestionDto>());
            }

            try
            {
                var results = await _geocodingSearchService.SearchAsync(query, cancellationToken);
                return Ok(results);
            }
            catch (OpenRouteServiceException ex)
            {
                var statusCode = ex.StatusCode switch
                {
                    HttpStatusCode.Unauthorized => StatusCodes.Status502BadGateway,
                    HttpStatusCode.Forbidden => StatusCodes.Status502BadGateway,
                    HttpStatusCode.TooManyRequests => StatusCodes.Status429TooManyRequests,
                    HttpStatusCode.InternalServerError => StatusCodes.Status502BadGateway,
                    HttpStatusCode.BadGateway => StatusCodes.Status502BadGateway,
                    HttpStatusCode.ServiceUnavailable => StatusCodes.Status503ServiceUnavailable,
                    HttpStatusCode.GatewayTimeout => StatusCodes.Status504GatewayTimeout,
                    _ => StatusCodes.Status502BadGateway
                };

                return StatusCode(statusCode, new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}

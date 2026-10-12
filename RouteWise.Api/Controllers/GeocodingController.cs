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
            [FromQuery] int limit = 5,
            [FromQuery] string? city = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                return Ok(Array.Empty<AddressSuggestionDto>());
            }

            try
            {
                var results = await _geocodingSearchService.SearchAsync(query, limit, city, cancellationToken);
                return Ok(results);
            }
            catch (OpenRouteServiceException ex)
            {
                return ApiExceptionMapper.ToActionResult(ex);
            }
            catch (InvalidOperationException ex)
            {
                return ApiExceptionMapper.ToActionResult(ex);
            }
        }

        [HttpGet("reverse")]
        [ProducesResponseType(typeof(AddressSuggestionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
        [ProducesResponseType(StatusCodes.Status502BadGateway)]
        public async Task<ActionResult<AddressSuggestionDto>> Reverse(
            [FromQuery] double latitude,
            [FromQuery] double longitude,
            CancellationToken cancellationToken = default)
        {
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
            {
                return BadRequest(new { error = "Invalid latitude or longitude coordinates." });
            }

            try
            {
                var result = await _geocodingSearchService.ReverseGeocodeAsync(latitude, longitude, cancellationToken);
                if (result == null)
                {
                    return NotFound(new { error = "No address found for the given coordinates." });
                }

                return Ok(result);
            }
            catch (OpenRouteServiceException ex)
            {
                return ApiExceptionMapper.ToActionResult(ex);
            }
            catch (InvalidOperationException ex)
            {
                return ApiExceptionMapper.ToActionResult(ex);
            }
        }
    }
}

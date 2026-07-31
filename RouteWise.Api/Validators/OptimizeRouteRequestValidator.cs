using FluentValidation;
using RouteWise.Api.Contracts.Requests;
using RouteWise.Api.Validators;

namespace RouteWise.Api.Validators
{
    public class OptimizeRouteRequestValidator : AbstractValidator<OptimizeRouteRequest>
    {
        public OptimizeRouteRequestValidator()
        {
            RuleFor(x => x.Algorithm)
                .NotEmpty()
                .WithMessage("Algorithm is required")
                .Must(a => a == "original" || a == "nearest-neighbor")
                .WithMessage("Algorithm must be either 'original' or 'nearest-neighbor'");

            RuleFor(x => x.Start)
                .NotNull()
                .WithMessage("Start is required")
                .SetValidator(new AddressInputValidator());

            RuleFor(x => x.Stops)
                .NotNull()
                .WithMessage("Stops are required")
                .Must(stops => stops.Count >= 1)
                .WithMessage("At least one stop is required");

            RuleFor(x => x.Stops)
                .Must(stops => stops.Count <= 10)
                .WithMessage("No more than 10 stops are allowed in MVP");

            RuleForEach(x => x.Stops)
                .SetValidator(new RouteStopValidator());
        }
    }
}

using FluentValidation;
using RouteWise.Api.Models;

namespace RouteWise.Api.Validators
{
    public class RouteStopValidator : AbstractValidator<RouteStop>
    {
        public RouteStopValidator() {
            RuleFor(x => x.Id)
                .NotEmpty()
                .WithMessage("Stop id is required");

            RuleFor(x => x.Label)
                .NotEmpty()
                .WithMessage("Stop label is required");

            RuleFor(x => x.Address)
                .NotEmpty()
                .WithMessage("Stop address is required")
                .NotEqual("string")
                .WithMessage("Stop address must be a real demo address, not 'string'");

            RuleFor(x => x.ServiceMinutes)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Service minutes must be 0 or greater");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .When(x => x.Latitude.HasValue)
                .WithMessage("Stop latitude must be between -90 and 90");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .When(x => x.Longitude.HasValue)
                .WithMessage("Stop longitude must be between -180 and 180");

            RuleFor(x => x.Latitude)
                .NotNull()
                .When(x => x.Longitude.HasValue)
                .WithMessage("Stop latitude is required when longitude is provided");

            RuleFor(x => x.Longitude)
                .NotNull()
                .When(x => x.Latitude.HasValue)
                .WithMessage("Stop longitude is required when latitude is provided");
        }
    }
}

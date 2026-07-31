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
        }
    }
}

using FluentValidation;
using RouteWise.Api.Models;

namespace RouteWise.Api.Validators
{
    public class AddressInputValidator : AbstractValidator<AddressInput>
    {
        public AddressInputValidator(string targetName = "Address") {
            RuleFor(x => x.Label)
                .NotEmpty()
                .WithMessage($"{targetName} label is required");
            RuleFor(x => x.Address)
                .NotEmpty()
                .WithMessage($"{targetName} address is required")
                .NotEqual("string")
                .WithMessage($"{targetName} address must be a real demo address, not 'string'");

            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .When(x => x.Latitude.HasValue)
                .WithMessage($"{targetName} latitude must be between -90 and 90");

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .When(x => x.Longitude.HasValue)
                .WithMessage($"{targetName} longitude must be between -180 and 180");

            RuleFor(x => x.Latitude)
                .NotNull()
                .When(x => x.Longitude.HasValue)
                .WithMessage($"{targetName} latitude is required when longitude is provided");

            RuleFor(x => x.Longitude)
                .NotNull()
                .When(x => x.Latitude.HasValue)
                .WithMessage($"{targetName} longitude is required when latitude is provided");
        }
    }
}

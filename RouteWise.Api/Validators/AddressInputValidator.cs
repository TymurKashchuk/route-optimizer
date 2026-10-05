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
        }
    }
}

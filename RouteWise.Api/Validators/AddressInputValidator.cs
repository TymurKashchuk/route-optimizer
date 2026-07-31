using FluentValidation;
using RouteWise.Api.Models;

namespace RouteWise.Api.Validators
{
    public class AddressInputValidator : AbstractValidator<AddressInput>
    {
        public AddressInputValidator() {
            RuleFor(x => x.Label)
                .NotEmpty()
                .WithMessage("Start label is required");
            RuleFor(x => x.Address)
                .NotEmpty()
                .WithMessage("Start adress is required")
                .NotEqual("string")
                .WithMessage("Start address must be a real demo address, not 'string'");
        }
    }
}

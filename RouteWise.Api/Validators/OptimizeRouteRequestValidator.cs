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
                .Must(a => string.Equals(a, "original", StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(a, "nearest-neighbor", StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(a, "two-opt", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Algorithm must be either 'original', 'nearest-neighbor' or 'two-opt'");

            RuleFor(x => x.PlanningMode)
                .Must(m => string.IsNullOrEmpty(m) ||
                           string.Equals(m, "depart-at", StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(m, "arrive-by", StringComparison.OrdinalIgnoreCase))
                .WithMessage("PlanningMode must be either 'depart-at' or 'arrive-by'");

            RuleFor(x => x.DepartureTime)
                .NotNull()
                .When(x => !string.Equals(x.PlanningMode, "arrive-by", StringComparison.OrdinalIgnoreCase))
                .WithMessage("DepartureTime is required when PlanningMode is 'depart-at'");

            RuleFor(x => x.ArrivalBy)
                .NotNull()
                .When(x => string.Equals(x.PlanningMode, "arrive-by", StringComparison.OrdinalIgnoreCase))
                .WithMessage("ArrivalBy is required when PlanningMode is 'arrive-by'");

            RuleFor(x => x.Start)
                .NotNull()
                .WithMessage("Start is required")
                .SetValidator(new AddressInputValidator("Start"));

            RuleFor(x => x.Destination)
                .NotNull()
                .WithMessage("Destination is required")
                .SetValidator(new AddressInputValidator("Destination"));

            RuleFor(x => x.Stops)
                .NotNull()
                .WithMessage("Stops are required");

            RuleFor(x => x.Stops)
                .Must(stops => stops.Count <= 10)
                .When(x => x.Stops != null)
                .WithMessage("No more than 10 stops are allowed in MVP");

            RuleForEach(x => x.Stops)
                .SetValidator(new RouteStopValidator());
        }
    }
}

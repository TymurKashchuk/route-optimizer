using FluentValidation.TestHelper;
using RouteWise.Api.Models;
using RouteWise.Api.Validators;
using Xunit;

namespace RouteWise.Tests.Validators
{
    public class RouteStopValidatorTests
    {
        private readonly RouteStopValidator _validator = new();

        private static RouteStop CreateValidStop()
        {
            return new RouteStop
            {
                Id = "stop-1",
                Label = "Stop 1",
                Address = "Zhytomyr, Sobornyi Square 1",
                ServiceMinutes = 30
            };
        }

        [Fact]
        public void Validate_ValidStop_PassesValidation()
        {
            var stop = CreateValidStop();

            var result = _validator.TestValidate(stop);

            result.ShouldNotHaveAnyValidationErrors();
        }

        [Fact]
        public void Validate_EmptyId_FailsValidation()
        {
            var stop = CreateValidStop();
            stop.Id = "";

            var result = _validator.TestValidate(stop);

            result.ShouldHaveValidationErrorFor(x => x.Id)
                .WithErrorMessage("Stop id is required");
        }

        [Fact]
        public void Validate_EmptyLabel_FailsValidation()
        {
            var stop = CreateValidStop();
            stop.Label = "";

            var result = _validator.TestValidate(stop);

            result.ShouldHaveValidationErrorFor(x => x.Label)
                .WithErrorMessage("Stop label is required");
        }

        [Fact]
        public void Validate_EmptyAddress_FailsValidation()
        {
            var stop = CreateValidStop();
            stop.Address = "";

            var result = _validator.TestValidate(stop);

            result.ShouldHaveValidationErrorFor(x => x.Address)
                .WithErrorMessage("Stop address is required");
        }

        [Fact]
        public void Validate_AddressIsPlaceholderString_FailsValidation()
        {
            var stop = CreateValidStop();
            stop.Address = "string";

            var result = _validator.TestValidate(stop);

            result.ShouldHaveValidationErrorFor(x => x.Address)
                .WithErrorMessage("Stop address must be a valid address, not placeholder 'string'");
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(481)]
        public void Validate_ServiceMinutesOutOfRange_FailsValidation(int invalidMinutes)
        {
            var stop = CreateValidStop();
            stop.ServiceMinutes = invalidMinutes;

            var result = _validator.TestValidate(stop);

            result.ShouldHaveValidationErrorFor(x => x.ServiceMinutes)
                .WithErrorMessage("Service minutes must be between 0 and 480 minutes (up to 8 hours)");
        }

        [Theory]
        [InlineData(0)]
        [InlineData(30)]
        [InlineData(480)]
        public void Validate_ServiceMinutesWithinRange_PassesValidation(int validMinutes)
        {
            var stop = CreateValidStop();
            stop.ServiceMinutes = validMinutes;

            var result = _validator.TestValidate(stop);

            result.ShouldNotHaveValidationErrorFor(x => x.ServiceMinutes);
        }

        [Fact]
        public void Validate_LatitudeWithoutLongitude_FailsValidation()
        {
            var stop = CreateValidStop();
            stop.Latitude = 50.25;
            stop.Longitude = null;

            var result = _validator.TestValidate(stop);

            result.ShouldHaveValidationErrorFor(x => x.Longitude)
                .WithErrorMessage("Stop longitude is required when latitude is provided");
        }

        [Fact]
        public void Validate_LongitudeWithoutLatitude_FailsValidation()
        {
            var stop = CreateValidStop();
            stop.Latitude = null;
            stop.Longitude = 28.66;

            var result = _validator.TestValidate(stop);

            result.ShouldHaveValidationErrorFor(x => x.Latitude)
                .WithErrorMessage("Stop latitude is required when longitude is provided");
        }
    }
}

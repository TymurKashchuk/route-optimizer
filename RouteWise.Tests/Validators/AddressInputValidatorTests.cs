using FluentValidation.TestHelper;
using RouteWise.Api.Models;
using RouteWise.Api.Validators;
using Xunit;

namespace RouteWise.Tests.Validators
{
    public class AddressInputValidatorTests
    {
        private readonly AddressInputValidator _validator = new("Start");

        [Fact]
        public void Validate_ValidAddress_PassesValidation()
        {
            var model = new AddressInput
            {
                Label = "Start point",
                Address = "Kyiv, Khreshchatyk 1"
            };

            var result = _validator.TestValidate(model);

            result.ShouldNotHaveAnyValidationErrors();
        }

        [Fact]
        public void Validate_EmptyLabel_FailsValidation()
        {
            var model = new AddressInput
            {
                Label = "",
                Address = "Kyiv, Khreshchatyk 1"
            };

            var result = _validator.TestValidate(model);

            result.ShouldHaveValidationErrorFor(x => x.Label)
                .WithErrorMessage("Start label is required");
        }

        [Fact]
        public void Validate_EmptyAddress_FailsValidation()
        {
            var model = new AddressInput
            {
                Label = "Start",
                Address = ""
            };

            var result = _validator.TestValidate(model);

            result.ShouldHaveValidationErrorFor(x => x.Address)
                .WithErrorMessage("Start address is required");
        }

        [Fact]
        public void Validate_AddressIsPlaceholderString_FailsValidation()
        {
            var model = new AddressInput
            {
                Label = "Start",
                Address = "string"
            };

            var result = _validator.TestValidate(model);

            result.ShouldHaveValidationErrorFor(x => x.Address)
                .WithErrorMessage("Start address must be a valid address, not placeholder 'string'");
        }

        [Theory]
        [InlineData(50.45, null)]
        public void Validate_LatitudeWithoutLongitude_FailsValidation(double lat, double? lon)
        {
            var model = new AddressInput
            {
                Label = "Start",
                Address = "Kyiv",
                Latitude = lat,
                Longitude = lon
            };

            var result = _validator.TestValidate(model);

            result.ShouldHaveValidationErrorFor(x => x.Longitude)
                .WithErrorMessage("Start longitude is required when latitude is provided");
        }

        [Theory]
        [InlineData(null, 30.52)]
        public void Validate_LongitudeWithoutLatitude_FailsValidation(double? lat, double lon)
        {
            var model = new AddressInput
            {
                Label = "Start",
                Address = "Kyiv",
                Latitude = lat,
                Longitude = lon
            };

            var result = _validator.TestValidate(model);

            result.ShouldHaveValidationErrorFor(x => x.Latitude)
                .WithErrorMessage("Start latitude is required when longitude is provided");
        }

        [Theory]
        [InlineData(-91)]
        [InlineData(91)]
        public void Validate_LatitudeOutOfRange_FailsValidation(double invalidLat)
        {
            var model = new AddressInput
            {
                Label = "Start",
                Address = "Kyiv",
                Latitude = invalidLat,
                Longitude = 30.52
            };

            var result = _validator.TestValidate(model);

            result.ShouldHaveValidationErrorFor(x => x.Latitude)
                .WithErrorMessage("Start latitude must be between -90 and 90");
        }

        [Theory]
        [InlineData(-181)]
        [InlineData(181)]
        public void Validate_LongitudeOutOfRange_FailsValidation(double invalidLon)
        {
            var model = new AddressInput
            {
                Label = "Start",
                Address = "Kyiv",
                Latitude = 50.45,
                Longitude = invalidLon
            };

            var result = _validator.TestValidate(model);

            result.ShouldHaveValidationErrorFor(x => x.Longitude)
                .WithErrorMessage("Start longitude must be between -180 and 180");
        }
    }
}

using FluentValidation.TestHelper;
using RouteWise.Api.Contracts.Requests;
using RouteWise.Api.Models;
using RouteWise.Api.Validators;
using Xunit;

namespace RouteWise.Tests.Validators
{
    public class OptimizeRouteRequestValidatorTests
    {
        private readonly OptimizeRouteRequestValidator _validator = new();

        private static OptimizeRouteRequest CreateValidBaseRequest()
        {
            return new OptimizeRouteRequest
            {
                Algorithm = "two-opt",
                PlanningMode = "depart-at",
                DepartureTime = DateTime.UtcNow,
                Start = new AddressInput { Label = "Start", Address = "Kyiv" },
                Destination = new AddressInput { Label = "End", Address = "Lviv" },
                Stops = new List<RouteStop>
                {
                    new RouteStop
                    {
                        Id = "1",
                        Label = "Stop 1",
                        Address = "Zhytomyr",
                        ServiceMinutes = 15
                    }
                }
            };
        }

        [Fact]
        public void Validate_DepartAtMode_WithDepartureTime_IsValid()
        {
            var request = CreateValidBaseRequest();
            request.PlanningMode = "depart-at";
            request.DepartureTime = DateTime.UtcNow;
            request.ArrivalBy = null;

            var result = _validator.TestValidate(request);

            result.ShouldNotHaveValidationErrorFor(x => x.DepartureTime);
            result.ShouldNotHaveValidationErrorFor(x => x.ArrivalBy);
            result.ShouldNotHaveValidationErrorFor(x => x.PlanningMode);
        }

        [Fact]
        public void Validate_DepartAtMode_WithoutDepartureTime_HasValidationError()
        {
            var request = CreateValidBaseRequest();
            request.PlanningMode = "depart-at";
            request.DepartureTime = null;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.DepartureTime)
                .WithErrorMessage("DepartureTime is required when PlanningMode is 'depart-at'");
        }

        [Fact]
        public void Validate_ArriveByMode_WithArrivalBy_IsValid()
        {
            var request = CreateValidBaseRequest();
            request.PlanningMode = "arrive-by";
            request.DepartureTime = null;
            request.ArrivalBy = DateTime.UtcNow.AddHours(2);

            var result = _validator.TestValidate(request);

            result.ShouldNotHaveValidationErrorFor(x => x.ArrivalBy);
            result.ShouldNotHaveValidationErrorFor(x => x.DepartureTime);
            result.ShouldNotHaveValidationErrorFor(x => x.PlanningMode);
        }

        [Fact]
        public void Validate_ArriveByMode_WithoutArrivalBy_HasValidationError()
        {
            var request = CreateValidBaseRequest();
            request.PlanningMode = "arrive-by";
            request.ArrivalBy = null;
            request.DepartureTime = DateTime.UtcNow;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.ArrivalBy)
                .WithErrorMessage("ArrivalBy is required when PlanningMode is 'arrive-by'");
        }

        [Fact]
        public void Validate_InvalidPlanningMode_HasValidationError()
        {
            var request = CreateValidBaseRequest();
            request.PlanningMode = "teleport-now";

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.PlanningMode)
                .WithErrorMessage("PlanningMode must be either 'depart-at' or 'arrive-by'");
        }

        [Fact]
        public void Validate_EmptyDestinationAddress_HasDestinationErrorMessage()
        {
            var request = CreateValidBaseRequest();
            request.Destination = new AddressInput { Label = "Hospital", Address = "" };

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Destination.Address)
                .WithErrorMessage("Destination address is required");
        }

        [Fact]
        public void Validate_EmptyStartAddress_HasStartErrorMessage()
        {
            var request = CreateValidBaseRequest();
            request.Start = new AddressInput { Label = "Home", Address = "" };

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Start.Address)
                .WithErrorMessage("Start address is required");
        }

        [Fact]
        public void Validate_ZeroStops_IsValid()
        {
            var request = CreateValidBaseRequest();
            request.Stops = new List<RouteStop>();

            var result = _validator.TestValidate(request);

            result.ShouldNotHaveValidationErrorFor(x => x.Stops);
        }

        [Fact]
        public void Validate_NullStops_HasValidationError()
        {
            var request = CreateValidBaseRequest();
            request.Stops = null!;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Stops)
                .WithErrorMessage("Stops are required");
        }

        [Fact]
        public void Validate_ValidCoordinates_IsValid()
        {
            var request = CreateValidBaseRequest();
            request.Start.Latitude = 50.45;
            request.Start.Longitude = 30.52;
            request.Destination.Latitude = 49.84;
            request.Destination.Longitude = 24.03;
            request.Stops[0].Latitude = 50.25;
            request.Stops[0].Longitude = 28.66;

            var result = _validator.TestValidate(request);

            result.ShouldNotHaveValidationErrorFor(x => x.Start.Latitude);
            result.ShouldNotHaveValidationErrorFor(x => x.Start.Longitude);
            result.ShouldNotHaveValidationErrorFor(x => x.Destination.Latitude);
            result.ShouldNotHaveValidationErrorFor(x => x.Destination.Longitude);
            result.ShouldNotHaveValidationErrorFor(x => x.Stops[0].Latitude);
            result.ShouldNotHaveValidationErrorFor(x => x.Stops[0].Longitude);
        }

        [Fact]
        public void Validate_InvalidLatitude_HasValidationError()
        {
            var request = CreateValidBaseRequest();
            request.Start.Latitude = 150.0;
            request.Start.Longitude = 30.0;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Start.Latitude)
                .WithErrorMessage("Start latitude must be between -90 and 90");
        }

        [Fact]
        public void Validate_InvalidLongitude_HasValidationError()
        {
            var request = CreateValidBaseRequest();
            request.Start.Latitude = 50.0;
            request.Start.Longitude = -200.0;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Start.Longitude)
                .WithErrorMessage("Start longitude must be between -180 and 180");
        }

        [Fact]
        public void Validate_LatitudeWithoutLongitude_HasValidationError()
        {
            var request = CreateValidBaseRequest();
            request.Start.Latitude = 50.0;
            request.Start.Longitude = null;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Start.Longitude)
                .WithErrorMessage("Start longitude is required when latitude is provided");
        }
    }
}

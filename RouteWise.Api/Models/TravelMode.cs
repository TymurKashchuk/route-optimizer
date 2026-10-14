namespace RouteWise.Api.Models
{
    public static class TravelMode
    {
        public const string Driving = "driving";
        public const string Walking = "walking";
        public const string Cycling = "cycling";
        public const string Default = Driving;

        public static readonly IReadOnlyCollection<string> All = new[]
        {
            Driving,
            Walking,
            Cycling
        };

        public static bool IsValid(string? mode)
        {
            if (string.IsNullOrWhiteSpace(mode))
            {
                return false;
            }

            return mode.Equals(Driving, StringComparison.OrdinalIgnoreCase)
                || mode.Equals(Walking, StringComparison.OrdinalIgnoreCase)
                || mode.Equals(Cycling, StringComparison.OrdinalIgnoreCase);
        }

        public static string Normalize(string? mode)
        {
            if (string.IsNullOrWhiteSpace(mode))
            {
                return Default;
            }

            var trimmed = mode.Trim().ToLowerInvariant();
            return IsValid(trimmed) ? trimmed : Default;
        }

        public static string ToOrsProfile(string? mode)
        {
            return Normalize(mode) switch
            {
                Walking => "foot-walking",
                Cycling => "cycling-regular",
                _ => "driving-car"
            };
        }
    }
}

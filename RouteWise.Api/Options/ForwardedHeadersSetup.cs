using System.Net;
using Microsoft.AspNetCore.HttpOverrides;

namespace RouteWise.Api.Options
{
    /// <summary>
    /// Decides WHO is allowed to tell us the real client IP via the X-Forwarded-For header.
    /// Only proxies listed in configuration (ForwardedHeaders:KnownProxies) are trusted,
    /// plus loopback (the framework default, handy for local development).
    /// </summary>
    public static class ForwardedHeadersSetup
    {
        public const string SectionName = "ForwardedHeaders";

        public static void Configure(ForwardedHeadersOptions options, IConfiguration configuration)
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            // One proxy hop (nginx). With a limit of 1 only the entry added by our own proxy is used,
            // so extra fake entries typed by a client are ignored.
            options.ForwardLimit = 1;

            var knownProxies = configuration.GetSection($"{SectionName}:KnownProxies").Get<string[]>() ?? Array.Empty<string>();
            foreach (var proxy in knownProxies)
            {
                if (!IPAddress.TryParse(proxy, out var address))
                {
                    // Fail fast at startup: a typo here would silently disable the rate-limit protection.
                    throw new InvalidOperationException($"{SectionName}:KnownProxies contains an invalid IP address: '{proxy}'.");
                }

                options.KnownProxies.Add(address);
            }
        }
    }
}
using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using RouteWise.Api.Options;

namespace RouteWise.Tests.Options
{
    public class ForwardedHeadersSetupTests
    {
        private static IConfiguration BuildConfig(params string[] proxies)
        {
            var values = new Dictionary<string, string?>();
            for (var i = 0; i < proxies.Length; i++)
            {
                values[$"ForwardedHeaders:KnownProxies:{i}"] = proxies[i];
            }

            return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        }

        [Fact]
        public void Configure_WithConfiguredProxy_TrustsOnlyThatProxy()
        {
            var options = new ForwardedHeadersOptions();

            ForwardedHeadersSetup.Configure(options, BuildConfig("172.28.0.10"));

            Assert.Contains(IPAddress.Parse("172.28.0.10"), options.KnownProxies);
            Assert.DoesNotContain(IPAddress.Parse("172.28.0.99"), options.KnownProxies);
        }

        [Fact]
        public void Configure_WithoutConfiguration_DoesNotTrustAnyExtraProxy()
        {
            var defaultCount = new ForwardedHeadersOptions().KnownProxies.Count;
            var options = new ForwardedHeadersOptions();

            ForwardedHeadersSetup.Configure(options, BuildConfig());

            Assert.Equal(defaultCount, options.KnownProxies.Count);
        }

        [Fact]
        public void Configure_AlwaysUsesSingleProxyHop()
        {
            var options = new ForwardedHeadersOptions();

            ForwardedHeadersSetup.Configure(options, BuildConfig());

            Assert.Equal(1, options.ForwardLimit);
        }

        [Fact]
        public void Configure_WithInvalidIp_FailsFastAtStartup()
        {
            var options = new ForwardedHeadersOptions();

            var ex = Assert.Throws<InvalidOperationException>(() =>
                ForwardedHeadersSetup.Configure(options, BuildConfig("not-an-ip")));

            Assert.Contains("not-an-ip", ex.Message);
        }
    }
}
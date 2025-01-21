const { withAxiom } = require("next-axiom");
const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs");

const withNextIntl = createNextIntlPlugin();

const isProduction = process.env.NODE_ENV === "production";

let nextConfig = {
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/blog",
          destination: "https://montee.feather.blog/blog",
        },
        {
          source: "/blog/:path*",
          destination: "https://montee.feather.blog/blog/:path*",
        },
        {
          source: "/_feather",
          destination: "https://montee.feather.blog/_feather",
        },
        {
          source: "/_feather/:path*",
          destination: "https://montee.feather.blog/_feather/:path*",
        },
      ],
    };
  },
  headers: async () => {
    return [
      {
        source: "/blog",
        headers: [
          {
            key: "X-Forwarded-Host",
            value: "www.montee.ai",
          },
        ],
      },
      {
        source: "/blog/:slug*",
        headers: [
          {
            key: "X-Forwarded-Host",
            value: "www.montee.ai",
          },
        ],
      },
      {
        source: "/_feather",
        headers: [
          {
            key: "X-Forwarded-Host",
            value: "www.montee.ai",
          },
        ],
      },

      {
        source: "/_feather/:slug*",
        headers: [
          {
            key: "X-Forwarded-Host",
            value: "www.montee.ai",
          },
        ],
      },
    ];
  },
};
nextConfig = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "yk-labs",
  project: "perfectinterview",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
nextConfig = withNextIntl(nextConfig);
module.exports = withAxiom(nextConfig);

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const config = withNextIntl(nextConfig);

// Only wrap with Sentry when DSN is configured
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(config, {
      // Upload source maps for better stack traces
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Silently skip source map upload if auth token is missing
      silent: !process.env.SENTRY_AUTH_TOKEN,

      // Tree-shake Sentry logger in production
      disableLogger: true,

      // Automatically instrument API routes & server components
      autoInstrumentServerFunctions: true,
      autoInstrumentMiddleware: true,
    })
  : config;

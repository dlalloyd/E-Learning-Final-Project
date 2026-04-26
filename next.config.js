/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'geomentor',
  project: 'geomentor',
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});

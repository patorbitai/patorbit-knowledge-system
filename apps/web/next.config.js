/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@patorbit/types", "@patorbit/ui", "@patorbit/config", "@patorbit/utils"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

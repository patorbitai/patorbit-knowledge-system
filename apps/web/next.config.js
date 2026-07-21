/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@patorbit/ui", "@patorbit/config", "@patorbit/utils"],
};

module.exports = nextConfig;

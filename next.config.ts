import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["pdfjs-dist", "pdf-parse", "@napi-rs/canvas"],
};

export default nextConfig;

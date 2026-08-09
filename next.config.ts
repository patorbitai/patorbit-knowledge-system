import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
};

export default nextConfig;

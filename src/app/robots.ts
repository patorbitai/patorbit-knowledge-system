import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Public marketing pages — always allowed
        // Authenticated pages protected by auth middleware, not robots.txt
      },
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/resume-builder/",
          "/resume-builder",
          "/settings",
          "/account/",
          "/overview/",
          "/ai",
          "/templates",
          "/network/",
          "/passport/",
          "/trust/",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/login",
          "/register",
          "/dashboard",
          "/coming-soon",
        ],
      },
    ],
    sitemap: "https://www.patorbit.com/sitemap.xml",
  };
}

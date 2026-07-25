import type { MetadataRoute } from "next";

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelPreviewUrl = process.env.VERCEL_URL;
  const url =
    configuredUrl ??
    vercelProductionUrl ??
    vercelPreviewUrl ??
    "https://bewegesund.de";
  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;

  return cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/en/api/",
        "/de/api/",
        "/en/profile",
        "/de/profile",
        "/en/settings",
        "/de/settings",
        "/en/calendar",
        "/de/calendar",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

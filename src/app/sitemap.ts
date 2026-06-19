import type { MetadataRoute } from "next";

const locales = ["en", "de"] as const;

const publicRoutes = [
  "",
  "/about",
  "/courses",
  "/meditation-entspannung",
  "/blogs",
  "/kontakt",
  "/impressum",
  "/datenschutz",
] as const;

const routePriority: Record<(typeof publicRoutes)[number], number> = {
  "": 1,
  "/about": 0.7,
  "/courses": 0.9,
  "/meditation-entspannung": 0.8,
  "/blogs": 0.8,
  "/kontakt": 0.7,
  "/impressum": 0.3,
  "/datenschutz": 0.3,
};

const routeChangeFrequency: Record<
  (typeof publicRoutes)[number],
  MetadataRoute.Sitemap[number]["changeFrequency"]
> = {
  "": "weekly",
  "/about": "monthly",
  "/courses": "weekly",
  "/meditation-entspannung": "monthly",
  "/blogs": "weekly",
  "/kontakt": "monthly",
  "/impressum": "yearly",
  "/datenschutz": "yearly",
};

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const vercelPreviewUrl = process.env.VERCEL_URL;
  const url = configuredUrl ?? vercelProductionUrl ?? vercelPreviewUrl ?? "https://sbewegesund.com";
  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;

  return cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  return publicRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified,
      changeFrequency: routeChangeFrequency[route],
      priority: routePriority[route],
      alternates: {
        languages: {
          "x-default": `${baseUrl}/en${route}`,
          ...Object.fromEntries(
            locales.map((alternateLocale) => [
              alternateLocale,
              `${baseUrl}/${alternateLocale}${route}`,
            ]),
          ),
        },
      },
    })),
  );
}

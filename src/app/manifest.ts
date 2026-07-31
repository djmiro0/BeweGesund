import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Bewegesund",
    short_name: "Bewegesund",
    description:
      "Training, health guidance, and personal progress in one place.",
    start_url: "/de",
    scope: "/",
    display: "standalone",
    background_color: "#f4fbff",
    theme_color: "#9b2b42",
    orientation: "portrait-primary",
    categories: ["fitness", "health", "lifestyle"],
    lang: "de",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("PWA manifest", () => {
  it("defines an installable standalone application", () => {
    expect(manifest()).toMatchObject({
      id: "/",
      name: "Bewegesund",
      short_name: "Bewegesund",
      start_url: "/de",
      scope: "/",
      display: "standalone",
      background_color: "#f5efe4",
      theme_color: "#9b2b42",
      icons: [
        expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icon-512.png", sizes: "512x512" }),
      ],
    });
  });
});

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    priority,
    sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string | { src: string };
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => {
    void fill;
    void priority;
    void sizes;

    return React.createElement("img", {
      ...props,
      src: typeof src === "string" ? src : src.src,
      alt,
    });
  },
}));

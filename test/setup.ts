import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
});

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

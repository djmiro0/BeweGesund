import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

describe("ServiceWorkerRegistration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("registers the root service worker in production", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { register },
    });
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
    });

    render(<ServiceWorkerRegistration />);

    await waitFor(() => expect(register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));
  });

  it("does not register a service worker during development", () => {
    const register = vi.fn();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { register },
    });

    render(<ServiceWorkerRegistration />);

    expect(register).not.toHaveBeenCalled();
  });
});

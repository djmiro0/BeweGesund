import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("Mux direct upload route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed when the admin upload token is missing", async () => {
    vi.stubEnv("MUX_TOKEN_ID", "token-id");
    vi.stubEnv("MUX_TOKEN_SECRET", "token-secret");
    vi.stubEnv("MUX_ADMIN_UPLOAD_TOKEN", "");

    const response = await POST(
      new Request("https://bewegesund.de/api/mux/direct-upload", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
  });

  it("rejects an invalid admin bearer token before contacting Mux", async () => {
    vi.stubEnv("MUX_TOKEN_ID", "token-id");
    vi.stubEnv("MUX_TOKEN_SECRET", "token-secret");
    vi.stubEnv("MUX_ADMIN_UPLOAD_TOKEN", "correct-token");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(
      new Request("https://bewegesund.de/api/mux/direct-upload", {
        method: "POST",
        headers: { Authorization: "Bearer incorrect-token" },
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

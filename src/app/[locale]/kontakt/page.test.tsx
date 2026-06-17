import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveBookingUrl } from "./page";

describe("KontaktPage booking URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the Cal.eu booking link by default", () => {
    vi.stubEnv("CONSULTATION_BOOKING_URL", "");

    expect(resolveBookingUrl()).toBe("https://cal.eu/bewegesund");
  });

  it("allows a secure booking URL override", () => {
    expect(resolveBookingUrl("https://cal.eu/bewegesund/team")).toBe("https://cal.eu/bewegesund/team");
  });

  it("rejects non-HTTPS booking URLs", () => {
    expect(resolveBookingUrl("http://cal.eu/bewegesund")).toBeNull();
  });
});

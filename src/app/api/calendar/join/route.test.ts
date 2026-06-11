import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCalendarDays: vi.fn(),
  getFirebaseUserAccess: vi.fn(),
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock("@/lib/contentful", () => ({
  getCalendarDays: mocks.getCalendarDays,
}));

vi.mock("@/lib/firebaseUserAccess", () => ({
  getFirebaseUserAccess: mocks.getFirebaseUserAccess,
}));

vi.mock("@/lib/firebaseToken", () => ({
  verifyFirebaseIdToken: mocks.verifyFirebaseIdToken,
}));

import { POST } from "./route";

function request(headers: Record<string, string> = {}) {
  return new Request("https://bewegesund.de/api/calendar/join", {
    method: "POST",
    headers: {
      Authorization: "Bearer firebase-token",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ eventId: "event-1", locale: "en" }),
  });
}

describe("calendar join route", () => {
  beforeEach(() => {
    mocks.verifyFirebaseIdToken.mockReset().mockResolvedValue({ uid: "user-1" });
    mocks.getFirebaseUserAccess.mockReset().mockResolvedValue({
      memberPackage: "plus",
      subscriptionStatus: "active",
    });
    mocks.getCalendarDays.mockReset().mockResolvedValue([
      {
        id: "2026-06-11",
        date: "2026-06-11",
        entries: [
          {
            id: "event-1",
            liveTrainingLink: "https://meet.example.com/session",
            packageRequired: "plus",
          },
        ],
      },
    ]);
  });

  it("forwards the App Check token when verifying membership", async () => {
    const response = await POST(request({ "X-Firebase-AppCheck": "app-check-token" }));

    expect(response.status).toBe(200);
    expect(mocks.getFirebaseUserAccess).toHaveBeenCalledWith(
      "user-1",
      "firebase-token",
      "app-check-token",
    );
  });

  it("identifies membership verification failures", async () => {
    mocks.getFirebaseUserAccess.mockRejectedValue(new Error("Firestore unavailable"));

    const response = await POST(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "USER_ACCESS_UNAVAILABLE",
    });
  });
});

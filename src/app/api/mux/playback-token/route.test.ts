import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMuxPlaybackToken: vi.fn(() => "signed-token"),
  getCourseDetail: vi.fn(),
  getFirebaseUserAccess: vi.fn(),
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock("@/lib/firebaseToken", () => ({
  verifyFirebaseIdToken: mocks.verifyFirebaseIdToken,
}));

vi.mock("@/lib/firebaseUserAccess", () => ({
  getFirebaseUserAccess: mocks.getFirebaseUserAccess,
}));

vi.mock("@/lib/muxSigning", () => ({
  createMuxPlaybackToken: mocks.createMuxPlaybackToken,
  hasMuxSigningConfig: () => true,
}));

vi.mock("@/lib/contentful", () => ({
  getCourseDetail: mocks.getCourseDetail,
}));

import { POST } from "./route";

function request(body: Record<string, unknown>, token = "firebase-token") {
  return new Request("https://bewegesund.de/api/mux/playback-token", {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Mux playback token route", () => {
  beforeEach(() => {
    mocks.verifyFirebaseIdToken.mockReset().mockResolvedValue({ uid: "user-1" });
    mocks.getFirebaseUserAccess.mockReset().mockResolvedValue({
      memberPackage: "basic",
      subscriptionStatus: "free",
    });
    mocks.getCourseDetail.mockReset().mockResolvedValue({
      slug: "course-1",
      muxPlaybackId: "playback-1",
      packageRequired: "basic",
    });
    mocks.createMuxPlaybackToken.mockClear();
  });

  it("requires Firebase authentication", async () => {
    const response = await POST(request({ playbackId: "playback-1", courseSlug: "course-1" }, ""));

    expect(response.status).toBe(401);
  });

  it("rejects users whose package does not include the course", async () => {
    mocks.getCourseDetail.mockResolvedValue({
      slug: "course-1",
      muxPlaybackId: "playback-1",
      packageRequired: "plus",
    });

    const response = await POST(request({ playbackId: "playback-1", courseSlug: "course-1" }));

    expect(response.status).toBe(403);
    expect(mocks.createMuxPlaybackToken).not.toHaveBeenCalled();
  });

  it("signs only a matching, entitled course playback ID", async () => {
    const response = await POST(request({
      playbackId: "playback-1",
      courseSlug: "course-1",
      locale: "en",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ playbackToken: "signed-token" });
    expect(mocks.createMuxPlaybackToken).toHaveBeenCalledWith("playback-1");
  });
});

import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedMuxPlayer from "./ProtectedMuxPlayer";

const authState = vi.hoisted(() => ({
  user: {
    uid: "user-1",
    getIdToken: vi.fn(async () => "firebase-token"),
  },
}));

vi.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    user: authState.user,
    loading: false,
    appPreferences: {
      videoAutoplay: false,
    },
  }),
}));

const messages = {
  videoPending: "Video pending",
  preparingVideo: "Preparing video",
  signInRequired: "Sign in required",
  tokenError: "Token error",
  signingMissing: "Signing missing",
  authError: "Auth error",
  subscriptionRequired: "Subscription required",
  packageRequired: "Package required",
  videoNotFound: "Video not found",
  accessCheckFailed: "Access failed",
  rateLimited: "Rate limited",
};

describe("ProtectedMuxPlayer", () => {
  const pauseSpy = vi.fn();
  const playSpy = vi.fn(async () => undefined);

  beforeEach(() => {
    authState.user.getIdToken.mockClear();
    pauseSpy.mockClear();
    playSpy.mockClear();
    (HTMLElement.prototype as HTMLElement & { pause?: () => void }).pause =
      pauseSpy;
    (
      HTMLElement.prototype as HTMLElement & { play?: () => Promise<void> }
    ).play = playSpy;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ playbackToken: "signed-token" }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (HTMLElement.prototype as HTMLElement & { pause?: () => void })
      .pause;
    delete (
      HTMLElement.prototype as HTMLElement & { play?: () => Promise<void> }
    ).play;
  });

  it("pauses the mux player when paused becomes true", async () => {
    const { container, rerender } = render(
      <ProtectedMuxPlayer
        playbackId="playback-1"
        courseSlug="relaxation-1"
        contentType="meditationRelaxation"
        locale="en"
        poster={null}
        title="Relaxation"
        paused={false}
        messages={messages}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("mux-player")).toBeTruthy();
    });

    rerender(
      <ProtectedMuxPlayer
        playbackId="playback-1"
        courseSlug="relaxation-1"
        contentType="meditationRelaxation"
        locale="en"
        poster={null}
        title="Relaxation"
        paused
        messages={messages}
      />,
    );

    expect(pauseSpy).toHaveBeenCalled();
  });

  it("provides stable analytics metadata to Mux", async () => {
    const { container } = render(
      <ProtectedMuxPlayer
        playbackId="playback-1"
        courseSlug="course-1"
        locale="en"
        poster={null}
        title="Morning workout"
        trainerId="coach-1"
        messages={messages}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("mux-player")).toBeTruthy();
    });

    const player = container.querySelector("mux-player");
    expect(player?.getAttribute("metadata-video-id")).toBe(
      "course_en_course-1",
    );
    expect(player?.getAttribute("metadata-video-title")).toBe(
      "Morning workout",
    );
    expect(player?.getAttribute("metadata-viewer-user-id")).toBe("user-1");
    expect(player?.getAttribute("metadata-custom-1")).toBe("coach-1");
  });
});

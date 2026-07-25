import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RelaxationMusicPlaylist from "./RelaxationMusicPlaylist";

const playerProps = vi.hoisted(() => ({
  latest: {} as Record<string, unknown>,
}));

vi.mock("../../courses/[slug]/ProtectedMuxPlayer", () => ({
  default: (props: Record<string, unknown>) => {
    playerProps.latest = props;

    return (
      <div data-testid="protected-player" data-paused={String(props.paused)} />
    );
  },
}));

const copy = {
  title: "Relaxation Music",
  play: "Play",
  pause: "Pause",
  playing: "Playing",
  playAll: "Play all",
  stopAll: "Stop all",
  previous: "Previous",
  next: "Next",
};

const playerMessages = {
  videoPending: "Video pending",
  preparingVideo: "Preparing",
  signInRequired: "Sign in",
  tokenError: "Token error",
  signingMissing: "Signing missing",
  authError: "Auth error",
  subscriptionRequired: "Subscription required",
  packageRequired: "Package required",
  videoNotFound: "Video not found",
  accessCheckFailed: "Access failed",
  rateLimited: "Rate limited",
};

const videos = [
  {
    id: "video-1",
    title: "First track",
    slug: "first-track",
    description: "",
    instructions: "",
    subcategoryKey: "relaxation-music",
    durationMinutes: 2,
    durationLabel: "2 min",
    level: "",
    coach: "",
    packageRequired: "basic" as const,
    packageLabel: "Basic",
    muxPlaybackId: "playback-1",
    posterImage: null,
    order: 1,
    publishedAt: "",
  },
  {
    id: "video-2",
    title: "Second track",
    slug: "second-track",
    description: "",
    instructions: "",
    subcategoryKey: "relaxation-music",
    durationMinutes: 4,
    durationLabel: "4 min",
    level: "",
    coach: "",
    packageRequired: "basic" as const,
    packageLabel: "Basic",
    muxPlaybackId: "playback-2",
    posterImage: null,
    order: 2,
    publishedAt: "",
  },
];

describe("RelaxationMusicPlaylist", () => {
  beforeEach(() => {
    playerProps.latest = {};
  });

  it("opens from the grid into autoplay mode and pauses the player on stop all", () => {
    render(
      <RelaxationMusicPlaylist
        videos={videos}
        locale="en"
        copy={copy}
        playerMessages={playerMessages}
      />,
    );

    expect(screen.queryByTestId("protected-player")).not.toBeInTheDocument();
    expect(screen.getByTestId("music-grid-0")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("music-play-all"));

    expect(screen.getByTestId("protected-player")).toHaveAttribute(
      "data-paused",
      "false",
    );
    expect(playerProps.latest).toMatchObject({
      autoPlay: true,
      paused: false,
      playbackId: "playback-1",
    });
    expect(screen.getByTestId("music-queue-0")).toHaveTextContent("Playing");

    fireEvent.click(screen.getByTestId("music-play-all"));

    expect(screen.getByTestId("protected-player")).toHaveAttribute(
      "data-paused",
      "true",
    );
    expect(playerProps.latest).toMatchObject({
      autoPlay: false,
      paused: true,
    });
    expect(screen.getByTestId("music-queue-0")).toHaveTextContent("Play");
  });

  it("keeps autoplay active when the user skips to another queue item", () => {
    render(
      <RelaxationMusicPlaylist
        videos={videos}
        locale="en"
        copy={copy}
        playerMessages={playerMessages}
      />,
    );

    fireEvent.click(screen.getByTestId("music-play-all"));
    fireEvent.click(screen.getByTestId("music-queue-1"));

    expect(playerProps.latest).toMatchObject({
      autoPlay: true,
      paused: false,
      playbackId: "playback-2",
    });
    expect(screen.getByTestId("music-queue-1")).toHaveTextContent("Playing");
  });
});

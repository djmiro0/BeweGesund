import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileAvatar from "./ProfileAvatar";

const mocks = vi.hoisted(() => ({
  getBlob: vi.fn(),
}));

vi.mock("../../../../firebase.config", () => ({
  storage: {},
}));

vi.mock("firebase/storage", () => ({
  getBlob: mocks.getBlob,
  ref: vi.fn((_storage, path: string) => path),
}));

describe("ProfileAvatar", () => {
  beforeEach(() => {
    mocks.getBlob.mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:private-avatar"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("loads the authenticated private avatar from Firebase Storage", async () => {
    mocks.getBlob.mockResolvedValue(new Blob(["avatar"], { type: "image/jpeg" }));
    render(
      <ProfileAvatar
        userId="user-1"
        photoUrl="https://fallback.example/avatar.jpg"
        initial="B"
        ariaLabel="Bakster profile photo"
      />,
    );

    await waitFor(() => expect(screen.getByRole("presentation"))
      .toHaveAttribute("src", "blob:private-avatar"));
  });

  it("falls back to the initial when both photo sources fail", async () => {
    mocks.getBlob.mockRejectedValue(new Error("missing"));
    render(
      <ProfileAvatar
        userId="user-1"
        photoUrl="https://fallback.example/avatar.jpg"
        initial="B"
        ariaLabel="Bakster profile photo"
      />,
    );

    fireEvent.error(screen.getByRole("presentation"));
    expect(await screen.findByText("B")).toBeInTheDocument();
  });
});

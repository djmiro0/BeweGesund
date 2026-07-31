import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProgressPhotoReminder from "./ProgressPhotoReminder";

const mocks = vi.hoisted(() => ({
  setDoc: vi.fn(),
  uploadBytes: vi.fn(),
  user: {
    uid: "user-1",
    metadata: {
      creationTime: new Date().toISOString(),
    },
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      title: "Add a before photo",
      later: "Remind me later",
      disable: "Do not remind me again",
      upload: "Add photo now",
    })[key] ?? key,
}));

vi.mock("../../../../firebase.config", () => ({
  db: {},
  storage: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((...segments: string[]) => segments.join("/")),
  onSnapshot: vi.fn(
    (
      _reference,
      onNext: (snapshot: {
        exists: () => boolean;
        data: () => Record<string, unknown>;
      }) => void,
    ) => {
      onNext({
        exists: () => true,
        data: () => ({
          progressPhotos: {
            reminderEnabled: true,
            beforeUploadedAt: "",
          },
        }),
      });
      return vi.fn();
    },
  ),
  setDoc: mocks.setDoc,
}));

vi.mock("firebase/storage", () => ({
  ref: vi.fn((_storage, path: string) => path),
  uploadBytes: mocks.uploadBytes,
}));

vi.mock("./AuthProvider", () => ({
  useAuth: () => ({ user: mocks.user }),
}));

describe("ProgressPhotoReminder", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.setDoc.mockReset().mockResolvedValue(undefined);
    mocks.uploadBytes.mockReset().mockResolvedValue(undefined);
  });

  it("shows the reminder for a new account without a before photo", async () => {
    render(<ProgressPhotoReminder />);

    expect(await screen.findByRole("dialog")).toHaveTextContent(
      "Add a before photo",
    );
  });

  it("stores the permanent opt-out choice", async () => {
    const user = userEvent.setup();
    render(<ProgressPhotoReminder />);

    await user.click(
      await screen.findByRole("button", { name: "Do not remind me again" }),
    );

    await waitFor(() =>
      expect(mocks.setDoc).toHaveBeenCalledWith(
        expect.stringContaining("settings/preferences"),
        { progressPhotos: { reminderEnabled: false } },
        { merge: true },
      ),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses only the current session when asked to remind later", async () => {
    const user = userEvent.setup();
    render(<ProgressPhotoReminder />);

    await user.click(
      await screen.findByRole("button", { name: "Remind me later" }),
    );

    expect(sessionStorage.getItem("progress-photo-reminder:user-1")).toBe(
      "dismissed",
    );
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";

const firebaseMocks = vi.hoisted(() => ({
  batchCommit: vi.fn(),
  batchSet: vi.fn(),
  batchUpdate: vi.fn(),
  getDownloadURL: vi.fn(),
  getBlob: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  updateProfile: vi.fn(),
  uploadBytes: vi.fn(),
  user: {
    uid: "user-1",
    email: "real@example.com",
    displayName: "Firebase Auth Name",
    photoURL: null,
  },
  profile: {
    email: "real@example.com",
    displayName: "Firebase Profile Name",
    photoURL: null,
    age: 36,
    gender: "female",
    heightCm: 180,
    weightKg: 82,
    occupationKey: "sedentary",
    regionKey: "berlin",
    averageStepsPerDay: 7000,
    primaryGoalKey: "stay-healthy",
    memberPackage: "basic",
    startedCourseIds: [],
    completedCourseIds: ["course-1"],
    recommendedCourseIds: [],
    anamnesisStatusKey: "pending",
    xp: 750,
    points: 100,
    currentStreak: 4,
    longestStreak: 7,
    weeklyScore: 20,
    monthlyScore: 50,
    weeklyLeaderboardRank: 12,
    monthlyLeaderboardRank: 30,
    claimedRewardIds: ["first-workout"],
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => ({
    "fields.fullName": "Full name",
    "fields.username": "Username",
    "fields.email": "Email",
    "sections.profile.changePhoto": "Change photo",
    "actions.backToProfile": "Back to profile",
    "actions.reset": "Cancel / Reset",
    "actions.save": "Save settings",
    "messages.saveSuccess": "Settings saved successfully.",
    "messages.photoSuccess": "Profile photo updated successfully.",
  })[key] ?? key,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/settings",
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("../../../../firebase.config", () => ({
  db: {},
  storage: {},
}));

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual<typeof import("firebase/auth")>("firebase/auth");
  return {
    ...actual,
    updateProfile: firebaseMocks.updateProfile,
  };
});

vi.mock("firebase/firestore", () => ({
  deleteDoc: vi.fn(),
  doc: vi.fn((...segments: string[]) => segments.join("/")),
  onSnapshot: vi.fn((_reference, onNext: (snapshot: {
    exists: () => boolean;
    data: () => Record<string, unknown>;
  }) => void) => {
    onNext({
      exists: () => true,
      data: () => ({
        profile: {
          username: "real_member",
          fitnessLevel: "intermediate",
        },
        notifications: {
          waterReminders: true,
        },
        progressPhotos: {
          reminderEnabled: true,
          beforeUploadedAt: "",
          afterUploadedAt: "",
        },
      }),
    });
    return vi.fn();
  }),
  serverTimestamp: vi.fn(() => "server-timestamp"),
  setDoc: firebaseMocks.setDoc,
  updateDoc: firebaseMocks.updateDoc,
  writeBatch: vi.fn(() => ({
    update: firebaseMocks.batchUpdate,
    set: firebaseMocks.batchSet,
    commit: firebaseMocks.batchCommit,
  })),
}));

vi.mock("firebase/storage", () => ({
  getBlob: firebaseMocks.getBlob,
  getDownloadURL: firebaseMocks.getDownloadURL,
  ref: vi.fn((_storage, path: string) => path),
  uploadBytes: firebaseMocks.uploadBytes,
}));

vi.mock("../components/AuthProvider", () => ({
  useAuth: () => ({
    user: firebaseMocks.user,
    profile: firebaseMocks.profile,
  }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    firebaseMocks.batchCommit.mockReset().mockResolvedValue(undefined);
    firebaseMocks.batchSet.mockReset();
    firebaseMocks.batchUpdate.mockReset();
    firebaseMocks.getDownloadURL.mockReset().mockResolvedValue("https://storage.example/avatar?token=test");
    firebaseMocks.getBlob.mockReset().mockResolvedValue(new Blob(["preview"], { type: "image/jpeg" }));
    firebaseMocks.setDoc.mockReset().mockResolvedValue(undefined);
    firebaseMocks.updateDoc.mockReset().mockResolvedValue(undefined);
    firebaseMocks.updateProfile.mockReset().mockResolvedValue(undefined);
    firebaseMocks.uploadBytes.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("renders profile and gamification values from Firebase", async () => {
    render(<SettingsPage />);

    expect(screen.getByRole("link", { name: "Back to profile" })).toHaveAttribute(
      "href",
      "/en/profile",
    );
    expect(await screen.findByDisplayValue("Firebase Profile Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("real@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("180")).toBeInTheDocument();
    expect(screen.getByTestId("settings-badges-placeholder")).toHaveTextContent("first-workout");
    expect(screen.getByTestId("settings-account-management")).toBeInTheDocument();
  });

  it("saves profile and preference changes to Firebase", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const fullName = await screen.findByLabelText("Full name");
    await user.clear(fullName);
    await user.type(fullName, "Alex Settings");
    await user.click(screen.getByTestId("settings-toggle-waterReminders"));
    await user.click(screen.getByTestId("settings-save-button"));

    await waitFor(() => expect(firebaseMocks.batchCommit).toHaveBeenCalledTimes(1));
    expect(firebaseMocks.batchUpdate).toHaveBeenCalledWith(
      expect.stringContaining("users/user-1"),
      expect.objectContaining({ displayName: "Alex Settings" }),
    );
    expect(firebaseMocks.batchSet).toHaveBeenCalledWith(
      expect.stringContaining("settings/preferences"),
      expect.objectContaining({
        notifications: expect.objectContaining({ waterReminders: false }),
      }),
      { merge: true },
    );
    expect(screen.getByTestId("settings-success-message")).toHaveTextContent("Settings saved successfully.");
  });

  it("resets unsaved changes back to Firebase values", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const username = await screen.findByLabelText("Username");
    await user.clear(username);
    await user.type(username, "temporary");
    await user.click(screen.getByRole("button", { name: "Cancel / Reset" }));

    expect(screen.getByLabelText("Username")).toHaveValue("real_member");
  });

  it("uploads and saves a valid profile photo", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const file = new File(["avatar"], "avatar.webp", { type: "image/webp" });
    await user.upload(await screen.findByLabelText("Change photo"), file);

    await waitFor(() => expect(firebaseMocks.uploadBytes).toHaveBeenCalledTimes(1));
    expect(firebaseMocks.updateDoc).toHaveBeenCalledWith(
      expect.stringContaining("users/user-1"),
      expect.objectContaining({
        photoURL: expect.stringContaining("https://storage.example/avatar?token=test&v="),
      }),
    );
    expect(firebaseMocks.updateProfile).toHaveBeenCalledWith(
      firebaseMocks.user,
      expect.objectContaining({
        photoURL: expect.stringContaining("https://storage.example/avatar?token=test&v="),
      }),
    );
    expect(screen.getByTestId("settings-success-message")).toHaveTextContent(
      "Profile photo updated successfully.",
    );
  });

  it("uploads a private before photo and saves its status", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const file = new File(["before"], "before.jpg", { type: "image/jpeg" });
    await user.upload(await screen.findByLabelText("sections.progressPhotos.beforeAction"), file);

    await waitFor(() => expect(firebaseMocks.uploadBytes).toHaveBeenCalledWith(
      "users/user-1/progress/before",
      file,
      expect.objectContaining({ contentType: "image/jpeg" }),
    ));
    expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
      expect.stringContaining("settings/preferences"),
      expect.objectContaining({
        progressPhotos: expect.objectContaining({
          beforeUploadedAt: expect.any(String),
          reminderEnabled: true,
        }),
      }),
      { merge: true },
    );
  });

  it("opens account deletion from the bottom of settings", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(await screen.findByRole("button", { name: "open" }));

    expect(screen.getByRole("dialog", { name: "confirmTitle" })).toBeInTheDocument();
    expect(screen.getByLabelText("passwordLabel")).toBeInTheDocument();
  });
});

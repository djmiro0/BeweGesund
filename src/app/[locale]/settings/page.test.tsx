import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";

const firebaseMocks = vi.hoisted(() => ({
  getDownloadURL: vi.fn(),
  getBlob: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
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
  useTranslations: (namespace?: string) => (key: string) => {
    const translations: Record<string, string> = {
    "fields.fullName": "Full name",
    "fields.username": "Username",
    "fields.email": "Email",
    "sections.profile.changePhoto": "Change photo",
    "sections.profile.title": "Profile",
    "sections.body.title": "Body & Progress",
    "sections.progressPhotos.title": "Before & After",
    "sections.workout.title": "Workout Preferences",
    "sections.nutrition.title": "Nutrition",
    "sections.gamification.title": "Progress",
    "sections.notifications.title": "Notifications",
    "sections.privacy.title": "Privacy & Account",
    "sections.app.title": "App Settings",
    "sections.account.title": "Account",
    "actions.backToProfile": "Back to profile",
    "actions.reset": "Cancel / Reset",
    "actions.save": "Save settings",
    "messages.unsavedChanges": "You have unsaved changes.",
    "messages.saveSuccess": "Settings saved successfully.",
    "messages.photoSuccess": "Profile photo updated successfully.",
    "profile.password.open": "Send reset email",
    "profile.password.success": "A password-change email was sent.",
    "profile.password.error": "The password email could not be sent.",
    "profile.delete.open": "Delete profile",
    "profile.delete.confirmTitle": "Delete profile",
    "profile.delete.passwordLabel": "Current password",
    };

    return translations[namespace ? `${namespace}.${key}` : key] ?? translations[key] ?? key;
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/settings",
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("../../../../firebase.config", () => ({
  auth: {},
  db: {},
  storage: {},
}));

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual<typeof import("firebase/auth")>("firebase/auth");
  return {
    ...actual,
    sendPasswordResetEmail: firebaseMocks.sendPasswordResetEmail,
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
    firebaseMocks.getDownloadURL.mockReset().mockResolvedValue("https://storage.example/avatar?token=test");
    firebaseMocks.getBlob.mockReset().mockResolvedValue(new Blob(["preview"], { type: "image/jpeg" }));
    firebaseMocks.sendPasswordResetEmail.mockReset().mockResolvedValue(undefined);
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
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("fields.gender")).toBeDisabled();
    expect(screen.getByDisplayValue("180")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Profile/ })).toHaveAttribute("aria-current", "page");
    await userEvent.click(screen.getByRole("button", { name: /^Progress\b/ }));
    expect(screen.getByTestId("settings-badges-placeholder")).toHaveTextContent("first-workout");
  });

  it("saves profile and preference changes to Firebase", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const fullName = await screen.findByLabelText("Full name");
    const saveButton = screen.getByTestId("settings-save-button");
    expect(saveButton).toBeDisabled();
    await user.clear(fullName);
    await user.type(fullName, "Alex Settings");
    expect(screen.getByTestId("settings-dirty-message")).toHaveTextContent("You have unsaved changes.");
    expect(saveButton).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /Notifications/ }));
    await user.click(screen.getByTestId("settings-toggle-waterReminders"));
    await user.click(saveButton);

    await waitFor(() => expect(firebaseMocks.updateDoc).toHaveBeenCalledWith(
      expect.stringContaining("users/user-1"),
      expect.objectContaining({ displayName: "Alex Settings" }),
    ));
    expect(firebaseMocks.updateDoc).toHaveBeenCalledWith(
      expect.stringContaining("users/user-1"),
      expect.not.objectContaining({ gender: expect.anything() }),
    );
    expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
      expect.stringContaining("settings/preferences"),
      expect.objectContaining({
        notifications: expect.objectContaining({ waterReminders: false }),
      }),
      { merge: true },
    );
    expect(screen.getByTestId("settings-success-message")).toHaveTextContent("Settings saved successfully.");
    await waitFor(() => expect(saveButton).toBeDisabled());
  });

  it("saves preference-only changes without touching the profile document", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(await screen.findByRole("button", { name: /Notifications/ }));
    await user.click(screen.getByTestId("settings-toggle-waterReminders"));
    await user.click(screen.getByTestId("settings-save-button"));

    await waitFor(() => expect(firebaseMocks.setDoc).toHaveBeenCalledTimes(1));
    expect(firebaseMocks.updateDoc).not.toHaveBeenCalled();
    expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
      expect.stringContaining("settings/preferences"),
      expect.objectContaining({
        notifications: expect.objectContaining({ waterReminders: false }),
      }),
      { merge: true },
    );
  });

  it("saves profile-only changes without touching the settings document", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const fullName = await screen.findByLabelText("Full name");
    await user.clear(fullName);
    await user.type(fullName, "Only Profile");
    await user.click(screen.getByTestId("settings-save-button"));

    await waitFor(() => expect(firebaseMocks.updateDoc).toHaveBeenCalledWith(
      expect.stringContaining("users/user-1"),
      expect.objectContaining({ displayName: "Only Profile" }),
    ));
    expect(firebaseMocks.setDoc).not.toHaveBeenCalled();
  });

  it("sends a password reset email from account settings", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(await screen.findByRole("button", { name: /^Account\b/ }));
    await user.click(await screen.findByRole("button", { name: "Send reset email" }));

    await waitFor(() => expect(firebaseMocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      {},
      "real@example.com",
    ));
    expect(screen.getByText("A password-change email was sent.")).toBeInTheDocument();
  });

  it("resets unsaved changes back to Firebase values", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const username = await screen.findByLabelText("Username");
    const resetButton = screen.getByRole("button", { name: "Cancel / Reset" });
    expect(resetButton).toBeDisabled();
    await user.clear(username);
    await user.type(username, "temporary");
    expect(resetButton).toBeEnabled();
    await user.click(resetButton);

    expect(screen.getByLabelText("Username")).toHaveValue("real_member");
    expect(resetButton).toBeDisabled();
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
    await user.click(await screen.findByRole("button", { name: /Before & After/ }));
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

    await user.click(await screen.findByRole("button", { name: /^Account\b/ }));
    await user.click(await screen.findByRole("button", { name: "Delete profile" }));

    expect(screen.getByRole("dialog", { name: "Delete profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
  });
});

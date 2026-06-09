import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "./page";

const firebaseMocks = vi.hoisted(() => ({
  batchCommit: vi.fn(),
  batchSet: vi.fn(),
  batchUpdate: vi.fn(),
  updateProfile: vi.fn(),
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
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("../../../../firebase.config", () => ({
  db: {},
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
      }),
    });
    return vi.fn();
  }),
  serverTimestamp: vi.fn(() => "server-timestamp"),
  writeBatch: vi.fn(() => ({
    update: firebaseMocks.batchUpdate,
    set: firebaseMocks.batchSet,
    commit: firebaseMocks.batchCommit,
  })),
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
    firebaseMocks.updateProfile.mockReset().mockResolvedValue(undefined);
  });

  it("renders profile and gamification values from Firebase", async () => {
    render(<SettingsPage />);

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

  it("opens account deletion from the bottom of settings", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(await screen.findByRole("button", { name: "open" }));

    expect(screen.getByRole("dialog", { name: "confirmTitle" })).toBeInTheDocument();
    expect(screen.getByLabelText("passwordLabel")).toBeInTheDocument();
  });
});

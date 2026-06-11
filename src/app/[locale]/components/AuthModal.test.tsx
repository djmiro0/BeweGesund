import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthModal from "./AuthModal";

const mocks = vi.hoisted(() => ({
    getDoc: vi.fn(),
    initializeRecaptchaConfig: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => {
    const translate = (key: string) =>
      ({
        signInTitle: "Member Sign In",
        supportText: "Member access",
        continueWithGoogle: "Continue with Google",
        orUseEmail: "or use email",
        email: "Email address",
        password: "Password",
        submitSignIn: "Sign In",
        forgotPassword: "Forgot your password?",
        switchToRegister: "Create an account",
        close: "Close",
        googleOnboardingTitle: "Complete your profile",
        googleOnboardingSupportText: "Add required profile details",
        completeProfile: "Complete profile",
        firstName: "First name",
        lastName: "Last name",
        age: "Age",
        gender: "Gender",
        selectGenderPlaceholder: "Select gender",
        genderFemale: "Female",
        genderMale: "Male",
        heightCm: "Height",
        weightKg: "Weight",
        occupation: "Occupation",
        selectPlaceholder: "Select",
        region: "Region",
        selectRegionPlaceholder: "Select region",
        regionCompetitionHint: "Region hint",
        recaptchaNotice: "This registration is protected by reCAPTCHA.",
        recaptchaError: "Security check failed",
        packageLabel: "Package",
        packageTemporaryHint: "Basic package",
        consentText: "Accept terms",
        healthConsentText: "Accept health consent",
        "terms.link": "View terms",
        "plans.basic.description": "Basic",
        "plans.plus.description": "Plus",
      })[key] ?? key;

    return Object.assign(translate, {
      raw: (key: string) => (key === "terms.items" ? [] : []),
    });
  },
}));

vi.mock("../../../../firebase.config", () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock("firebase/auth", () => ({
    GoogleAuthProvider: class {
        setCustomParameters() {}
    },
    createUserWithEmailAndPassword: vi.fn(),
    deleteUser: vi.fn(),
    initializeRecaptchaConfig: mocks.initializeRecaptchaConfig,
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
  updateProfile: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: mocks.getDoc,
  serverTimestamp: vi.fn(() => "timestamp"),
  setDoc: vi.fn(),
}));

describe("AuthModal Google sign-in", () => {
  beforeEach(() => {
    mocks.getDoc.mockReset();
    mocks.initializeRecaptchaConfig.mockReset();
    mocks.initializeRecaptchaConfig.mockResolvedValue(undefined);
    mocks.signInWithPopup.mockReset();
    mocks.signOut.mockReset();
  });

  it("offers Google sign-in beside email sign-in", () => {
    render(<AuthModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByText("or use email")).toBeInTheDocument();
  });

  it("preloads reCAPTCHA protection when registration opens", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.getByText("This registration is protected by reCAPTCHA.")).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.initializeRecaptchaConfig).toHaveBeenCalledTimes(1);
    });
  });

  it("closes immediately for a returning Google user with a profile", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mocks.signInWithPopup.mockResolvedValue({
      user: {
        uid: "google-user",
        email: "member@example.com",
        displayName: "Google Member",
        photoURL: null,
      },
    });
    mocks.getDoc.mockResolvedValue({ exists: () => true });

    render(<AuthModal isOpen onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(mocks.signInWithPopup).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens required profile completion for a first-time Google user", async () => {
    const user = userEvent.setup();
    mocks.signInWithPopup.mockResolvedValue({
      user: {
        uid: "new-google-user",
        email: "new@example.com",
        displayName: "New Member",
        photoURL: "https://example.com/avatar.png",
      },
    });
    mocks.getDoc.mockResolvedValue({ exists: () => false });

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(screen.getByRole("heading", { name: "Complete your profile" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("New")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Member")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete profile" })).toBeDisabled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthModal from "./AuthModal";

const mocks = vi.hoisted(() => ({
    callable: vi.fn(),
    getDoc: vi.fn(),
    httpsCallable: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
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
        showPassword: "Show password",
        hidePassword: "Hide password",
        submitSignIn: "Sign In",
        forgotPassword: "Forgot your password?",
        switchToRegister: "Create an account",
        close: "Close",
        errorPrefix: "Sign in failed:",
        invalidCredential: "The email or password is incorrect.",
        invalidEmail: "Please enter a valid email address.",
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
        packageLabel: "Package",
        packageTemporaryHint: "Basic package",
        consentText: "Accept terms",
        healthConsentText: "Accept health consent",
        "terms.link": "View terms",
        "plans.basic.description": "Basic",
        "plans.plus.description": "Plus",
        "validation.title": "Complete these items to continue:",
        "validation.firstName": "Enter your first name.",
        "validation.lastName": "Enter your last name.",
        "validation.email": "Enter your email address.",
        "validation.password": "Enter a password.",
        "validation.confirmPassword": "Confirm your password.",
        "validation.age": "Enter an age between 1 and 120.",
        "validation.gender": "Select your gender.",
        "validation.height": "Enter a height between 80 and 240 cm.",
        "validation.weight": "Enter a weight between 25 and 300 kg.",
        "validation.region": "Select your federal state.",
        "validation.consent": "Accept the terms of use.",
        "validation.healthConsent": "Accept health data processing.",
      })[key] ?? key;

    return Object.assign(translate, {
      raw: (key: string) => (key === "terms.items" ? [] : []),
    });
  },
}));

vi.mock("../../../../firebase.config", () => ({
  auth: { currentUser: null },
  db: {},
  functions: {},
}));

vi.mock("firebase/auth", () => ({
    GoogleAuthProvider: class {
        setCustomParameters() {}
    },
    createUserWithEmailAndPassword: vi.fn(),
    deleteUser: vi.fn(() => Promise.resolve()),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
  updateProfile: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({})),
  getDoc: mocks.getDoc,
  serverTimestamp: vi.fn(() => "timestamp"),
  setDoc: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: mocks.httpsCallable,
}));

describe("AuthModal Google sign-in", () => {
  beforeEach(() => {
    mocks.getDoc.mockReset();
    mocks.callable.mockReset();
    mocks.httpsCallable.mockReset();
    mocks.httpsCallable.mockReturnValue(mocks.callable);
    mocks.signInWithEmailAndPassword.mockReset();
    mocks.signInWithPopup.mockReset();
    mocks.signOut.mockReset();
  });

  it("offers Google sign-in beside email sign-in", () => {
    render(<AuthModal isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeInTheDocument();
    expect(screen.getByText("or use email")).toBeInTheDocument();
  });

  it("opens registration without reCAPTCHA copy", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.getByRole("heading", { name: "registerTitle" })).toBeInTheDocument();
    expect(screen.queryByText(/reCAPTCHA/i)).not.toBeInTheDocument();
  });

  it("shows a visible error when the sign-in email format is invalid", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("Email address"), 'djm"djm.com');
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Sign in failed: Please enter a valid email address.")).toBeInTheDocument();
    expect(mocks.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows the Firebase sign-in failure reason", async () => {
    const user = userEvent.setup();
    mocks.signInWithEmailAndPassword.mockRejectedValue({ code: "auth/invalid-credential" });

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("Email address"), "member@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Sign in failed: The email or password is incorrect.")).toBeInTheDocument();
  });

  it("toggles password visibility from the eye button", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    const passwordInput = screen.getByLabelText("Password");

    expect(passwordInput).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });

  it("explains missing registration fields only after submit is attempted", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.queryByText("Complete these items to continue:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submitRegister" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "submitRegister" }));

    expect(screen.getByText("Complete these items to continue:")).toBeInTheDocument();
    expect(screen.getByText("Enter your first name.")).toBeInTheDocument();
    expect(screen.getByText("Accept the terms of use.")).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Complete profile" })).toBeEnabled();
    expect(screen.queryByText("Complete these items to continue:")).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthModal from "./AuthModal";

const mocks = vi.hoisted(() => ({
    callable: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    getDoc: vi.fn(),
    httpsCallable: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendEmailVerification: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    setDoc: vi.fn(),
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
        confirmPassword: "Confirm password",
        showPassword: "Show password",
        hidePassword: "Hide password",
        submitSignIn: "Sign In",
        forgotPassword: "Forgot your password?",
        resetTitle: "Reset password",
        resetSupportText: "Enter the email address for your account. Password reset works for email-password accounts. If you created your account with Google, use Continue with Google instead.",
        sendResetLink: "Send reset link",
        backToSignIn: "Back to sign in",
        resetEmailRequired: "Enter your email address first.",
        resetEmailSent: "If this email uses password sign-in, reset instructions were sent. Check your spam folder too. If you created the account with Google, use Continue with Google instead.",
        verificationSent: "Account created. Check your inbox and spam folder, then verify the email address before signing in. If the link is not clickable, copy and paste it into your browser.",
        switchToRegister: "Create an account",
        close: "Close",
        errorPrefix: "Sign in failed:",
        invalidCredential: "We could not sign you in with these details. Check your email and password, create an account first, or use Continue with Google if you registered with Google.",
        invalidEmail: "Please enter a valid email address.",
        "validation.signInEmail": "Enter your email address.",
        "validation.signInPassword": "Enter your password.",
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
    createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
    deleteUser: vi.fn(() => Promise.resolve()),
  sendEmailVerification: mocks.sendEmailVerification,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
  updateProfile: mocks.updateProfile,
}));

vi.mock("firebase/firestore", () => ({
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({})),
  getDoc: mocks.getDoc,
  serverTimestamp: vi.fn(() => "timestamp"),
  setDoc: mocks.setDoc,
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: mocks.httpsCallable,
}));

describe("AuthModal Google sign-in", () => {
  beforeEach(() => {
    mocks.getDoc.mockReset();
    mocks.callable.mockReset();
    mocks.createUserWithEmailAndPassword.mockReset();
    mocks.httpsCallable.mockReset();
    mocks.httpsCallable.mockReturnValue(mocks.callable);
    mocks.sendPasswordResetEmail.mockReset();
    mocks.sendEmailVerification.mockReset();
    mocks.signInWithEmailAndPassword.mockReset();
    mocks.signInWithPopup.mockReset();
    mocks.signOut.mockReset();
    mocks.updateProfile.mockReset();
    mocks.setDoc.mockReset();
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

  it("shows sign-in requirements when submitted empty", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Complete these items to continue:")).toBeInTheDocument();
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(mocks.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows a visible requirement when the sign-in email format is invalid", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("Email address"), 'djm"djm.com');
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Complete these items to continue:")).toBeInTheDocument();
    expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    expect(mocks.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows the Firebase sign-in failure reason", async () => {
    const user = userEvent.setup();
    mocks.signInWithEmailAndPassword.mockRejectedValue({ code: "auth/invalid-credential" });

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("Email address"), "member@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Sign in failed: We could not sign you in with these details. Check your email and password, create an account first, or use Continue with Google if you registered with Google.")).toBeInTheDocument();
  });

  it("shows account help when Firebase reports invalid login credentials", async () => {
    const user = userEvent.setup();
    mocks.signInWithEmailAndPassword.mockRejectedValue({
      customData: {
        _tokenResponse: {
          error: {
            message: "INVALID_LOGIN_CREDENTIALS",
          },
        },
      },
    });

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("Email address"), "missing@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Sign in failed: We could not sign you in with these details. Check your email and password, create an account first, or use Continue with Google if you registered with Google.")).toBeInTheDocument();
  });

  it("explains Google accounts in password reset feedback", async () => {
    const user = userEvent.setup();
    mocks.sendPasswordResetEmail.mockResolvedValue(undefined);

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Forgot your password?" }));

    expect(screen.getByText("Enter the email address for your account. Password reset works for email-password accounts. If you created your account with Google, use Continue with Google instead.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email address"), "google-member@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(mocks.sendPasswordResetEmail).toHaveBeenCalled();
    expect(await screen.findByText("If this email uses password sign-in, reset instructions were sent. Check your spam folder too. If you created the account with Google, use Continue with Google instead.")).toBeInTheDocument();
  });

  it("shows reset email feedback when password reset is submitted empty", async () => {
    const user = userEvent.setup();

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Forgot your password?" }));
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(screen.getByText("Enter your email address first.")).toBeInTheDocument();
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled();
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

  it("signs out after email registration and asks for email verification before checkout", async () => {
    const user = userEvent.setup();
    mocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: "email-user",
        email: "new@example.com",
        photoURL: null,
        providerData: [{ providerId: "password" }],
      },
    });
    mocks.updateProfile.mockResolvedValue(undefined);
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.sendEmailVerification.mockResolvedValue(undefined);
    mocks.signOut.mockResolvedValue(undefined);

    render(<AuthModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Create an account" }));

    await user.type(screen.getByPlaceholderText("First name"), "New");
    await user.type(screen.getByPlaceholderText("Last name"), "Member");
    await user.type(screen.getByPlaceholderText("Email address"), "new@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.type(screen.getByPlaceholderText("Confirm password"), "secret123");

    const numberFields = screen.getAllByRole("spinbutton");
    await user.type(numberFields[0], "35");
    await user.type(numberFields[1], "170");
    await user.type(numberFields[2], "70");

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "female");
    await user.selectOptions(selects[2], "berlin");

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole("button", { name: "submitRegister" }));

    expect(mocks.sendEmailVerification).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "email-user" }),
      { url: "http://localhost:3000/en" },
    );
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.callable).not.toHaveBeenCalled();
    expect(await screen.findByText("Account created. Check your inbox and spam folder, then verify the email address before signing in. If the link is not clickable, copy and paste it into your browser.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Member Sign In" })).toBeInTheDocument();
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

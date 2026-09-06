"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { auth, db, functions } from "../../../../firebase.config";
import {
  type AuthError,
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  X,
} from "lucide-react";
import type { MemberPackage } from "@/data";
import { memberPackages } from "@/lib/memberPackages";
import { getAuthUserPhotoURL, type UserGender } from "@/lib/userProfile";
import authTheme from "./AuthTheme.module.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiresProfileSetup?: boolean;
  onCheckoutRedirectStart?: () => void;
  onCheckoutRedirectError?: () => void;
}

interface CreateUserProfilePayload {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL: string | null;
  age: number;
  gender: UserGender;
  heightCm: number;
  weightKg: number;
  occupationKey: string | null;
  regionKey: string;
  averageStepsPerDay: number | null;
  primaryGoalKey: string | null;
  memberPackage: MemberPackage;
  startedCourseIds: string[];
  completedCourseIds: string[];
  recommendedCourseIds: string[];
  anamnesis: AnamnesisPayload;
  anamnesisStatusKey: "completed" | "review-required";
  consentAcceptedAt: ReturnType<typeof serverTimestamp>;
  healthConsentAcceptedAt: ReturnType<typeof serverTimestamp>;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
  xp: 0;
  points: 0;
  premiumStatus: "free";
  subscriptionStatus: "free";
  currentStreak: 0;
  longestStreak: 0;
  weeklyScore: 0;
  monthlyScore: 0;
  weeklyLeaderboardRank: null;
  monthlyLeaderboardRank: null;
  claimedRewardIds: string[];
  roles: ["member"];
}

declare global {
  interface Window {
    __BEWEGESUND_E2E_AUTH_MOCK__?: {
      saveProfile?: (
        path: string,
        payload: CreateUserProfilePayload,
      ) => Promise<void> | void;
    };
  }
}

interface BillingSessionResult {
  url?: string;
}

const regionKeys = [
  "baden-wuerttemberg",
  "bavaria",
  "berlin",
  "brandenburg",
  "bremen",
  "hamburg",
  "hesse",
  "lower-saxony",
  "mecklenburg-western-pomerania",
  "north-rhine-westphalia",
  "rhineland-palatinate",
  "saarland",
  "saxony",
  "saxony-anhalt",
  "schleswig-holstein",
  "thuringia",
] as const;

interface FirebaseErrorLike {
  code?: string;
  message?: string;
  error?: {
    message?: string;
  };
  customData?: {
    _tokenResponse?: {
      error?: {
        message?: string;
      };
    };
  };
}

function getFirebaseErrorCode(error: unknown) {
  const firebaseError = error as FirebaseErrorLike | undefined;
  return (
    firebaseError?.code ??
    firebaseError?.error?.message ??
    firebaseError?.customData?._tokenResponse?.error?.message ??
    "unknown"
  );
}

function isEmailAlreadyInUseError(error: unknown) {
  const firebaseError = error as FirebaseErrorLike | undefined;
  const messages = [
    firebaseError?.message,
    firebaseError?.error?.message,
    firebaseError?.customData?._tokenResponse?.error?.message,
  ].filter(Boolean);

  return (
    firebaseError?.code === "auth/email-already-in-use" ||
    messages.some((message) => message?.includes("EMAIL_EXISTS"))
  );
}

function isInvalidCredentialError(error: unknown) {
  const firebaseError = error as FirebaseErrorLike | undefined;
  const invalidCredentialCodes = new Set([
    "auth/invalid-credential",
    "auth/invalid-login-credentials",
    "auth/user-not-found",
    "auth/wrong-password",
  ]);
  const messages = [
    firebaseError?.message,
    firebaseError?.error?.message,
    firebaseError?.customData?._tokenResponse?.error?.message,
  ].filter(Boolean);

  return (
    invalidCredentialCodes.has(firebaseError?.code ?? "") ||
    messages.some((message) => message?.includes("INVALID_LOGIN_CREDENTIALS"))
  );
}

type AuthView = "signIn" | "register" | "forgotPassword" | "googleOnboarding";
type ProfileSetupStep = "account" | "anamnesis";
type AuthErrorAction = "email-in-use" | null;

interface AnamnesisPayload {
  age: number;
  goals: string[];
  complaints: string[];
  fitnessLevel: string;
  movementRestrictions: string[];
  stressLevel: string;
  sleepDisturbance: string;
  contraindications: string[];
  legalConfirmed: boolean;
  completedAt: ReturnType<typeof serverTimestamp>;
}

const goalOptions = [
  "pain-rehab",
  "weight-loss",
  "muscle-fitness",
  "stress-balance",
] as const;

const complaintOptions = [
  "back",
  "knee",
  "rehasport-prescription",
  "whole-body",
  "pain-free",
] as const;

const fitnessLevelOptions = ["beginner", "intermediate", "advanced"] as const;

const movementRestrictionOptions = [
  "obesity",
  "pregnant-postpartum",
  "none",
] as const;

const stressLevelOptions = ["very-high", "moderate", "low"] as const;
const sleepDisturbanceOptions = ["often", "sometimes", "no"] as const;

const contraindicationOptions = [
  "acute-disc-herniation",
  "acute-neurological-symptoms",
  "recent-surgery-wounds",
  "fresh-injuries",
  "severe-heart-disease",
  "cardiovascular-medication",
  "unclear-dizziness-fainting",
  "severe-lung-disease",
  "inflammation-fever-infection",
  "advanced-osteoporosis-rheumatic-flare",
  "artificial-joint-load-ban",
  "risk-pregnancy-sport-ban",
  "none",
] as const;

function toggleMultiSelect(
  current: string[],
  value: string,
  exclusiveValue?: string,
) {
  if (value === exclusiveValue) {
    return current.includes(value) ? [] : [value];
  }

  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current.filter((item) => item !== exclusiveValue), value];
}

async function saveUserProfile(uid: string, payload: CreateUserProfilePayload) {
  const e2eAuthMock =
    typeof window !== "undefined" && process.env.NODE_ENV !== "production"
      ? window.__BEWEGESUND_E2E_AUTH_MOCK__
      : undefined;

  if (e2eAuthMock?.saveProfile) {
    await e2eAuthMock.saveProfile(`users/${uid}`, payload);
    return;
  }

  await setDoc(doc(db, "users", uid), payload);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function splitDisplayName(displayName: string | null) {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getSiteOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      return new URL(configuredSiteUrl).origin;
    } catch {
      // Fall back to the active browser origin when local env config is incomplete.
    }
  }

  return window.location.origin;
}

export default function AuthModal({
  isOpen,
  onClose,
  requiresProfileSetup = false,
  onCheckoutRedirectStart,
  onCheckoutRedirectError,
}: AuthModalProps) {
  const t = useTranslations("auth");
  const packageT = useTranslations("packages");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<UserGender | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [occupation, setOccupation] = useState("");
  const [region, setRegion] = useState("");
  const [selectedPackage, setSelectedPackage] =
    useState<MemberPackage>("basic");
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [hasAcceptedHealthConsent, setHasAcceptedHealthConsent] =
    useState(false);
  const [profileSetupStep, setProfileSetupStep] =
    useState<ProfileSetupStep>("account");
  const [anamnesisGoals, setAnamnesisGoals] = useState<string[]>([]);
  const [anamnesisComplaints, setAnamnesisComplaints] = useState<string[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [movementRestrictions, setMovementRestrictions] = useState<string[]>(
    [],
  );
  const [stressLevel, setStressLevel] = useState("");
  const [sleepDisturbance, setSleepDisturbance] = useState("");
  const [contraindications, setContraindications] = useState<string[]>([]);
  const [hasAcceptedAnamnesisLegal, setHasAcceptedAnamnesisLegal] =
    useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [view, setView] = useState<AuthView>("signIn");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [authErrorAction, setAuthErrorAction] = useState<AuthErrorAction>(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [hasAttemptedSignInSubmit, setHasAttemptedSignInSubmit] =
    useState(false);
  const [hasAttemptedProfileSubmit, setHasAttemptedProfileSubmit] =
    useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const isRegister = view === "register";
  const isForgotPassword = view === "forgotPassword";
  const isGoogleOnboarding = view === "googleOnboarding";
  const isProfileSetup = isRegister || isGoogleOnboarding;
  const isAnamnesisStep = isProfileSetup && profileSetupStep === "anamnesis";
  const trimmedEmail = email.trim();
  const hasValidEmail =
    trimmedEmail.length === 0 || isValidEmailAddress(trimmedEmail);
  const termsItems = t.raw("terms.items") as string[];
  const isPasswordMatching = !isRegister || password === confirmPassword;
  const hasReviewRequiredContraindication = contraindications.some(
    (item) => item !== "none",
  );
  const hasRequiredAccountFields =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    trimmedEmail.length > 0 &&
    hasValidEmail &&
    (!isRegister || (password.length > 0 && confirmPassword.length > 0)) &&
    gender.length > 0 &&
    Number(heightCm) >= 80 &&
    Number(heightCm) <= 240 &&
    Number(weightKg) >= 25 &&
    Number(weightKg) <= 300 &&
    region.length > 0 &&
    isPasswordMatching &&
    hasAcceptedConsent &&
    hasAcceptedHealthConsent;
  const hasRequiredAnamnesisFields =
    Number(age) >= 1 &&
    Number(age) <= 120 &&
    anamnesisGoals.length > 0 &&
    anamnesisComplaints.length > 0 &&
    fitnessLevel.length > 0 &&
    movementRestrictions.length > 0 &&
    stressLevel.length > 0 &&
    sleepDisturbance.length > 0 &&
    contraindications.length > 0 &&
    hasAcceptedAnamnesisLegal;
  const hasRequiredRegistrationFields =
    hasRequiredAccountFields && hasRequiredAnamnesisFields;
  const canSubmit = isProfileSetup ? !isSubmitting : !isSubmitting;
  const accountRequirements = [
    ...(firstName.trim().length === 0 ? [t("validation.firstName")] : []),
    ...(lastName.trim().length === 0 ? [t("validation.lastName")] : []),
    ...(trimmedEmail.length === 0 ? [t("validation.email")] : []),
    ...(trimmedEmail.length > 0 && !hasValidEmail ? [t("invalidEmail")] : []),
    ...(isRegister && password.length === 0 ? [t("validation.password")] : []),
    ...(isRegister && confirmPassword.length === 0
      ? [t("validation.confirmPassword")]
      : []),
    ...(isRegister &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    !isPasswordMatching
      ? [t("validation.passwordMismatch")]
      : []),
    ...(gender.length === 0 ? [t("validation.gender")] : []),
    ...(Number(heightCm) < 80 || Number(heightCm) > 240
      ? [t("validation.height")]
      : []),
    ...(Number(weightKg) < 25 || Number(weightKg) > 300
      ? [t("validation.weight")]
      : []),
    ...(region.length === 0 ? [t("validation.region")] : []),
    ...(!hasAcceptedConsent ? [t("validation.consent")] : []),
    ...(!hasAcceptedHealthConsent ? [t("validation.healthConsent")] : []),
  ];
  const anamnesisRequirements = [
    ...(Number(age) < 1 || Number(age) > 120 ? [t("validation.age")] : []),
    ...(anamnesisGoals.length === 0 ? [t("validation.anamnesisGoals")] : []),
    ...(anamnesisComplaints.length === 0
      ? [t("validation.anamnesisComplaints")]
      : []),
    ...(fitnessLevel.length === 0 ? [t("validation.fitnessLevel")] : []),
    ...(movementRestrictions.length === 0
      ? [t("validation.movementRestrictions")]
      : []),
    ...(stressLevel.length === 0 ? [t("validation.stressLevel")] : []),
    ...(sleepDisturbance.length === 0
      ? [t("validation.sleepDisturbance")]
      : []),
    ...(contraindications.length === 0
      ? [t("validation.contraindications")]
      : []),
    ...(!hasAcceptedAnamnesisLegal ? [t("validation.anamnesisLegal")] : []),
  ];
  const registrationRequirements = isAnamnesisStep
    ? anamnesisRequirements
    : accountRequirements;
  const signInRequirements = [
    ...(trimmedEmail.length === 0 ? [t("validation.signInEmail")] : []),
    ...(trimmedEmail.length > 0 && !hasValidEmail ? [t("invalidEmail")] : []),
    ...(password.length === 0 ? [t("validation.signInPassword")] : []),
  ];
  const formRequirements = isProfileSetup
    ? registrationRequirements
    : signInRequirements;
  const shouldShowFormRequirements =
    !isSubmitting &&
    formRequirements.length > 0 &&
    (isProfileSetup ? hasAttemptedProfileSubmit : hasAttemptedSignInSubmit);

  useEffect(() => {
    if (
      !isOpen ||
      !requiresProfileSetup ||
      !auth.currentUser ||
      !auth.currentUser.providerData.some(
        (provider) => provider.providerId === "google.com",
      )
    )
      return;

    const googleUser = auth.currentUser;
    const name = splitDisplayName(googleUser.displayName);
    setEmail(googleUser.email ?? "");
    setFirstName((current) => current || name.firstName);
    setLastName((current) => current || name.lastName);
    setView("googleOnboarding");
  }, [isOpen, requiresProfileSetup]);

  const getFriendlyErrorMessage = (error: unknown) => {
    const firebaseError = error as (AuthError & FirebaseErrorLike) | undefined;
    const code = firebaseError?.code;

    if (isEmailAlreadyInUseError(error)) {
      return t("emailInUse");
    }

    if (isInvalidCredentialError(error)) {
      return t("invalidCredential");
    }

    switch (code) {
      case "auth/operation-not-allowed":
        return t("providerDisabled");
      case "auth/weak-password":
        return t("weakPassword");
      case "auth/invalid-email":
        return t("invalidEmail");
      case "auth/too-many-requests":
        return t("tooManyRequests");
      case "auth/network-request-failed":
        return t("networkError");
      case "auth/app-not-authorized":
      case "auth/unauthorized-domain":
        return t("unauthorizedDomain");
      case "auth/captcha-check-failed":
      case "auth/missing-recaptcha-token":
      case "auth/invalid-recaptcha-token":
      case "auth/invalid-recaptcha-action":
      case "auth/missing-recaptcha-version":
      case "auth/invalid-recaptcha-version":
      case "auth/recaptcha-not-enabled":
        return t("recaptchaError");
      case "auth/popup-closed-by-user":
        return t("googlePopupClosed");
      case "auth/popup-blocked":
        return t("googlePopupBlocked");
      case "auth/account-exists-with-different-credential":
        return t("accountExistsWithDifferentCredential");
      case "permission-denied":
      case "firestore/permission-denied":
        return t("profileSavePermissionDenied");
      default:
        return t("genericErrorWithCode", { code: getFirebaseErrorCode(error) });
    }
  };

  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const createProfilePayload = (
    uid: string,
    userEmail: string,
    memberPackage: MemberPackage,
    user?: User,
  ): CreateUserProfilePayload => ({
    uid,
    email: userEmail,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    displayName: fullName,
    photoURL: getAuthUserPhotoURL(user),
    age: Number(age),
    gender: gender as UserGender,
    heightCm: Number(heightCm),
    weightKg: Number(weightKg),
    occupationKey: occupation || null,
    regionKey: region,
    averageStepsPerDay: null,
    primaryGoalKey: anamnesisGoals[0] ?? null,
    memberPackage,
    startedCourseIds: [],
    completedCourseIds: [],
    recommendedCourseIds: [],
    anamnesis: {
      age: Number(age),
      goals: anamnesisGoals,
      complaints: anamnesisComplaints,
      fitnessLevel,
      movementRestrictions,
      stressLevel,
      sleepDisturbance,
      contraindications,
      legalConfirmed: hasAcceptedAnamnesisLegal,
      completedAt: serverTimestamp(),
    },
    anamnesisStatusKey: hasReviewRequiredContraindication
      ? "review-required"
      : "completed",
    consentAcceptedAt: serverTimestamp(),
    healthConsentAcceptedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    xp: 0,
    points: 0,
    premiumStatus: "free",
    subscriptionStatus: "free",
    currentStreak: 0,
    longestStreak: 0,
    weeklyScore: 0,
    monthlyScore: 0,
    weeklyLeaderboardRank: null,
    monthlyLeaderboardRank: null,
    claimedRewardIds: [],
    roles: ["member"],
  });

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setAge("");
    setGender("");
    setHeightCm("");
    setWeightKg("");
    setOccupation("");
    setRegion("");
    setSelectedPackage("basic");
    setHasAcceptedConsent(false);
    setHasAcceptedHealthConsent(false);
    setProfileSetupStep("account");
    setAnamnesisGoals([]);
    setAnamnesisComplaints([]);
    setFitnessLevel("");
    setMovementRestrictions([]);
    setStressLevel("");
    setSleepDisturbance("");
    setContraindications([]);
    setHasAcceptedAnamnesisLegal(false);
    setIsTermsOpen(false);
    setErrorMessage("");
    setAuthErrorAction(null);
    setInfoMessage("");
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setHasAttemptedSignInSubmit(false);
    setHasAttemptedProfileSubmit(false);
  }, []);

  const getAuthActionSettings = () => ({
    url: `${getSiteOrigin()}/${locale}`,
  });

  const openCheckoutForSelectedPackage = async () => {
    const createSession = httpsCallable<
      { locale: string; memberPackage: MemberPackage },
      BillingSessionResult
    >(functions, "createStripeCheckoutSession");
    const result = await createSession({
      locale,
      memberPackage: selectedPackage,
    });

    if (!result.data.url) {
      throw new Error("Stripe session URL is missing.");
    }

    window.location.assign(result.data.url);
  };

  const deleteIncompleteAccount = async (user: User) => {
    await deleteDoc(doc(db, "users", user.uid)).catch(() => undefined);
    await deleteUser(user).catch(async () => {
      const deleteUserAccount = httpsCallable(functions, "deleteUserAccount");
      await deleteUserAccount().catch(() => undefined);
    });
    await signOut(auth).catch(() => undefined);
  };

  const openPasswordReset = () => {
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setAuthErrorAction(null);
    setInfoMessage("");
    setView("forgotPassword");
  };

  const handleClose = useCallback(async () => {
    if (isGoogleOnboarding) {
      await signOut(auth).catch(() => undefined);
      resetForm();
      setView("signIn");
    }
    onClose();
  }, [isGoogleOnboarding, onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      lastActiveElementRef.current?.focus();
      lastActiveElementRef.current = null;
      return undefined;
    }

    const panel = panelRef.current;
    if (!panel) return undefined;

    if (!panel.contains(document.activeElement)) {
      lastActiveElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    }
    const previousOverflow = document.body.style.overflow;
    const focusTarget = isTermsOpen
      ? panel.querySelector<HTMLElement>("[data-auth-terms-dialog]")
      : panel;
    focusTarget?.focus();
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isTermsOpen) {
          setIsTermsOpen(false);
        } else {
          void handleClose();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusScope = isTermsOpen
        ? panel.querySelector<HTMLElement>("[data-auth-terms-dialog]")
        : panel;
      const focusableElements = Array.from(
        focusScope?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      ).filter(
        (element) =>
          !element.hasAttribute("hidden") && element.offsetParent !== null,
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        focusScope?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          document.activeElement === focusScope)
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen, isTermsOpen]);

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setAuthErrorAction(null);
    setInfoMessage("");

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const profileSnapshot = await getDoc(
        doc(db, "users", credential.user.uid),
      );

      if (profileSnapshot.exists()) {
        resetForm();
        onClose();
        return;
      }

      const name = splitDisplayName(credential.user.displayName);
      setEmail(credential.user.email ?? "");
      setFirstName(name.firstName);
      setLastName(name.lastName);
      setPassword("");
      setConfirmPassword("");
      setView("googleOnboarding");
    } catch (error) {
      setErrorMessage(`${t("errorPrefix")} ${getFriendlyErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trimmedEmail || isSubmitting) {
      setErrorMessage(t("resetEmailRequired"));
      return;
    }

    if (!isValidEmailAddress(trimmedEmail)) {
      setErrorMessage(t("invalidEmail"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      await sendPasswordResetEmail(auth, trimmedEmail, getAuthActionSettings());
      setInfoMessage(t("resetEmailSent"));
    } catch (error) {
      setErrorMessage(getFriendlyErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let checkoutRedirectStarted = false;
    setIsSubmitting(true);
    setErrorMessage("");
    setAuthErrorAction(null);
    try {
      if (isProfileSetup) {
        setHasAttemptedProfileSubmit(true);

        if (profileSetupStep === "account") {
          if (!hasRequiredAccountFields) {
            return;
          }

          setProfileSetupStep("anamnesis");
          setHasAttemptedProfileSubmit(false);
          return;
        }

        if (!hasRequiredRegistrationFields) {
          return;
        }

        if (password !== confirmPassword) {
          setErrorMessage(`${t("errorPrefix")} ${t("passwordMismatch")}`);
          return;
        }

        if (!hasAcceptedConsent) {
          setErrorMessage(`${t("errorPrefix")} ${t("consentRequired")}`);
          return;
        }

        if (!hasAcceptedHealthConsent) {
          setErrorMessage(`${t("errorPrefix")} ${t("healthConsentRequired")}`);
          return;
        }

        onCheckoutRedirectStart?.();
        checkoutRedirectStarted = true;

        if (isGoogleOnboarding) {
          const googleUser = auth.currentUser;
          if (!googleUser) {
            throw new Error("Google user is no longer authenticated.");
          }

          try {
            await saveUserProfile(
              googleUser.uid,
              createProfilePayload(
                googleUser.uid,
                googleUser.email ?? trimmedEmail,
                selectedPackage,
                googleUser,
              ),
            );
          } catch (profileError) {
            await deleteIncompleteAccount(googleUser);
            throw profileError;
          }

          try {
            await openCheckoutForSelectedPackage();
          } catch (checkoutError) {
            await deleteIncompleteAccount(googleUser);
            throw checkoutError;
          }

          return;
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        );

        try {
          await updateProfile(credential.user, {
            displayName: fullName,
          });
          await saveUserProfile(
            credential.user.uid,
            createProfilePayload(
              credential.user.uid,
              credential.user.email ?? trimmedEmail,
              selectedPackage,
            ),
          );
        } catch (profileError) {
          await deleteUser(credential.user).catch(() => undefined);
          throw profileError;
        }

        try {
          await openCheckoutForSelectedPackage();
        } catch (checkoutError) {
          await deleteIncompleteAccount(credential.user);
          throw checkoutError;
        }

        return;
      } else {
        setHasAttemptedSignInSubmit(true);

        if (signInRequirements.length > 0) {
          return;
        }

        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
      resetForm();
      onClose();
    } catch (error: unknown) {
      if (checkoutRedirectStarted) onCheckoutRedirectError?.();
      const isEmailAlreadyInUse = isEmailAlreadyInUseError(error);
      const isInvalidCredential = isInvalidCredentialError(error);

      if (!isEmailAlreadyInUse && !isInvalidCredential) {
        console.error("Firebase authentication failed", {
          code: getFirebaseErrorCode(error),
          error,
        });
      }

      setAuthErrorAction(isEmailAlreadyInUse ? "email-in-use" : null);
      setErrorMessage(`${t("errorPrefix")} ${getFriendlyErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRegistrationEmail = () => {
    setErrorMessage("");
    setAuthErrorAction(null);
    setHasAttemptedProfileSubmit(false);
    setProfileSetupStep("account");
  };

  const handleUseExistingAccount = () => {
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setAuthErrorAction(null);
    setHasAttemptedSignInSubmit(false);
    setHasAttemptedProfileSubmit(false);
    setProfileSetupStep("account");
    setView("signIn");
  };

  const renderPasswordInput = ({
    value,
    onChange,
    placeholder,
    autoComplete,
    isVisible,
    onToggleVisibility,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    autoComplete: string;
    isVisible: boolean;
    onToggleVisibility: () => void;
  }) => (
    <div className="relative">
      <input
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 pr-12 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={isVisible ? t("hidePassword") : t("showPassword")}
        className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-[var(--text-dim)] transition hover:bg-[rgba(var(--foreground-rgb),0.08)] hover:text-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)]"
      >
        {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );

  const renderCheckboxGroup = (
    legendKey: string,
    values: readonly string[],
    selectedValues: string[],
    onChange: (values: string[]) => void,
    translationPrefix: string,
    exclusiveValue?: string,
  ) => (
    <fieldset className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.22)] p-4">
      <legend className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {t("requiredLabel", { label: t(legendKey) })}
      </legend>
      <div className="mt-3 grid gap-2">
        {values.map((value) => (
          <label
            key={value}
            className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.24)] p-3 text-sm leading-6 text-[var(--text-dim)]"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(value)}
              onChange={() =>
                onChange(
                  toggleMultiSelect(selectedValues, value, exclusiveValue),
                )
              }
              className="mt-1 h-4 w-4 accent-[var(--highlight)]"
            />
            <span>{t(`${translationPrefix}.${value}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  const renderRadioGroup = (
    legendKey: string,
    values: readonly string[],
    selectedValue: string,
    onChange: (value: string) => void,
    translationPrefix: string,
  ) => (
    <fieldset className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.22)] p-4">
      <legend className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {t("requiredLabel", { label: t(legendKey) })}
      </legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {values.map((value) => (
          <label
            key={value}
            className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.24)] p-3 text-sm leading-6 text-[var(--text-dim)]"
          >
            <input
              type="radio"
              checked={selectedValue === value}
              onChange={() => onChange(value)}
              className="mt-1 h-4 w-4 accent-[var(--highlight)]"
            />
            <span>{t(`${translationPrefix}.${value}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  if (!isOpen) return null;

  return (
    <div
      className={`${authTheme.scope} ${authTheme.overlay} fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4`}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        tabIndex={-1}
        className={`${authTheme.panel} relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[var(--border-soft)] p-6 sm:p-8`}
      >
        <button
          onClick={() => void handleClose()}
          aria-label={t("close")}
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-[var(--border-soft)] bg-[rgba(var(--foreground-rgb),0.05)] text-[var(--text-dim)] transition hover:bg-[rgba(var(--foreground-rgb),0.1)] hover:text-[var(--text-light)]"
        >
          <X size={18} />
        </button>
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-full border border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--highlight-soft)]">
            Bewegesund
          </div>
          <h2
            id="auth-modal-title"
            className="text-3xl font-black italic uppercase text-[var(--text-light)]"
          >
            {isForgotPassword
              ? t("resetTitle")
              : isAnamnesisStep
                ? t("anamnesis.title")
                : isGoogleOnboarding
                  ? t("googleOnboardingTitle")
                  : isRegister
                    ? t("registerTitle")
                    : t("signInTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
            {isForgotPassword
              ? t("resetSupportText")
              : isAnamnesisStep
                ? t("anamnesis.supportText")
                : isGoogleOnboarding
                  ? t("googleOnboardingSupportText")
                  : isRegister
                    ? t("registerSupportText")
                    : t("supportText")}
          </p>
          {isProfileSetup ? (
            <div
              className="mt-5"
              role="progressbar"
              aria-label={t("progress.label")}
              aria-valuemin={1}
              aria-valuemax={2}
              aria-valuenow={isAnamnesisStep ? 2 : 1}
            >
              <div className="mb-2 flex flex-col items-start gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-dim)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-xs sm:tracking-[0.12em]">
                <span>
                  {t("progress.step", {
                    current: isAnamnesisStep ? 2 : 1,
                    total: 2,
                  })}
                </span>
                <span className="text-[var(--highlight-soft)] sm:text-right">
                  {isAnamnesisStep
                    ? t("progress.anamnesis")
                    : t("progress.account")}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(var(--foreground-rgb),0.1)]">
                <span
                  className="block h-full rounded-full bg-[var(--secondary)] transition-[width] duration-300"
                  style={{ width: isAnamnesisStep ? "100%" : "50%" }}
                />
              </div>
              {isAnamnesisStep ? (
                <p className="mb-0 mt-2 text-xs leading-5 text-[var(--text-dim)]">
                  {t("progress.paymentNext")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        {isForgotPassword ? (
          <form onSubmit={handlePasswordReset} noValidate className="space-y-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.12)] text-[var(--highlight-soft)]">
              <Mail size={26} />
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {t("email")}
              </span>
              <input
                type="email"
                placeholder={t("email")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`${authTheme.input} w-full rounded-2xl border border-[var(--border-soft)] px-4 py-3 outline-none transition focus:border-[var(--border-strong)]`}
                autoComplete="email"
                autoFocus
                required
              />
            </label>
            {errorMessage ? (
              <div className="rounded-2xl border border-[rgba(var(--accent-strong-rgb),0.2)] bg-[var(--status-danger-soft)] px-4 py-3 text-sm text-[var(--highlight-soft)]">
                {errorMessage}
              </div>
            ) : null}
            {infoMessage ? (
              <div className="rounded-2xl border border-[rgba(var(--page-warm-rgb),0.28)] bg-[rgba(var(--page-warm-rgb),0.1)] px-4 py-3 text-sm leading-6 text-[var(--text-light)]">
                {infoMessage}
              </div>
            ) : null}
            <button
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--secondary)] py-4 font-black uppercase tracking-[0.18em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSubmitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : null}
              {t("sendResetLink")}
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setInfoMessage("");
                setView("signIn");
              }}
              className="flex w-full items-center justify-center gap-2 text-sm font-bold text-[var(--text-dim)] transition hover:text-[var(--text-light)]"
            >
              <ArrowLeft size={16} />
              {t("backToSignIn")}
            </button>
          </form>
        ) : (
          <>
            {!isProfileSetup ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleGoogleSignIn()}
                  disabled={isSubmitting}
                  className={`${authTheme.googleButton} mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-[var(--border-soft)] py-3.5 font-bold transition hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.39 13.93A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
                    />
                  </svg>
                  {t("continueWithGoogle")}
                </button>
                <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-dim)]">
                  <span className="h-px flex-1 bg-[var(--border-soft)]" />
                  {t("orUseEmail")}
                  <span className="h-px flex-1 bg-[var(--border-soft)]" />
                </div>
              </>
            ) : null}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {isProfileSetup && !isAnamnesisStep ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {t("requiredLabel", { label: t("firstName") })}
                    </span>
                    <input
                      type="text"
                      placeholder={t("firstName")}
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                      autoComplete="given-name"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {t("requiredLabel", { label: t("lastName") })}
                    </span>
                    <input
                      type="text"
                      placeholder={t("lastName")}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                      autoComplete="family-name"
                      required
                    />
                  </label>
                </div>
              ) : null}
              <label
                className={
                  isGoogleOnboarding || isAnamnesisStep ? "hidden" : "block"
                }
              >
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  {isRegister
                    ? t("requiredLabel", { label: t("email") })
                    : t("email")}
                </span>
                <input
                  type="email"
                  placeholder={t("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                  autoComplete="email"
                  required={!isGoogleOnboarding}
                  readOnly={isGoogleOnboarding}
                />
              </label>
              {!isGoogleOnboarding && !isAnamnesisStep ? (
                <div className={isRegister ? "grid gap-4 sm:grid-cols-2" : ""}>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {isRegister
                        ? t("requiredLabel", { label: t("password") })
                        : t("password")}
                    </span>
                    {renderPasswordInput({
                      value: password,
                      onChange: setPassword,
                      placeholder: t("password"),
                      autoComplete: isRegister
                        ? "new-password"
                        : "current-password",
                      isVisible: isPasswordVisible,
                      onToggleVisibility: () =>
                        setIsPasswordVisible((current) => !current),
                    })}
                  </label>
                  {isRegister ? (
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                        {t("requiredLabel", { label: t("confirmPassword") })}
                      </span>
                      {renderPasswordInput({
                        value: confirmPassword,
                        onChange: setConfirmPassword,
                        placeholder: t("confirmPassword"),
                        autoComplete: "new-password",
                        isVisible: isConfirmPasswordVisible,
                        onToggleVisibility: () =>
                          setIsConfirmPasswordVisible((current) => !current),
                      })}
                      {confirmPassword && !isPasswordMatching ? (
                        <span className="mt-2 block text-sm font-bold text-[var(--highlight-soft)]">
                          {t("passwordMismatch")}
                        </span>
                      ) : null}
                    </label>
                  ) : null}
                </div>
              ) : null}
              {isProfileSetup && !isAnamnesisStep ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                        {t("requiredLabel", { label: t("gender") })}
                      </span>
                      <select
                        value={gender}
                        onChange={(event) =>
                          setGender(event.target.value as UserGender | "")
                        }
                        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                        required
                      >
                        <option value="">{t("selectGenderPlaceholder")}</option>
                        <option value="female">{t("genderFemale")}</option>
                        <option value="male">{t("genderMale")}</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                        {t("requiredLabel", { label: t("heightCm") })}
                      </span>
                      <input
                        type="number"
                        min="80"
                        max="240"
                        value={heightCm}
                        onChange={(event) => setHeightCm(event.target.value)}
                        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                        {t("requiredLabel", { label: t("weightKg") })}
                      </span>
                      <input
                        type="number"
                        min="25"
                        max="300"
                        value={weightKg}
                        onChange={(event) => setWeightKg(event.target.value)}
                        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                        required
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {t("optionalLabel", { label: t("occupation") })}
                    </span>
                    <select
                      value={occupation}
                      onChange={(event) => setOccupation(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                    >
                      <option value="">{t("selectPlaceholder")}</option>
                      <option value="sedentary">
                        {t("occupations.sedentary")}
                      </option>
                      <option value="standing">
                        {t("occupations.standing")}
                      </option>
                      <option value="physical">
                        {t("occupations.physical")}
                      </option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {t("requiredLabel", { label: t("region") })}
                    </span>
                    <select
                      value={region}
                      onChange={(event) => setRegion(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                      required
                    >
                      <option value="">{t("selectRegionPlaceholder")}</option>
                      {regionKeys.map((regionKey) => (
                        <option key={regionKey} value={regionKey}>
                          {t(`regions.${regionKey}`)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-dim)]">
                      {t("regionCompetitionHint")}
                    </p>
                  </label>
                  <fieldset>
                    <legend className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {t("requiredLabel", { label: t("packageLabel") })}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {memberPackages.map((packageId) => {
                        const isSelected = packageId === selectedPackage;
                        const features = t.raw(
                          `plans.${packageId}.features`,
                        ) as string[];

                        return (
                          <button
                            type="button"
                            key={packageId}
                            onClick={() => setSelectedPackage(packageId)}
                            aria-pressed={isSelected}
                            className={`relative flex min-h-56 flex-col items-start rounded-2xl border px-5 py-5 text-left transition ${
                              isSelected
                                ? "border-[var(--highlight)] bg-[linear-gradient(145deg,rgba(var(--accent-rgb),0.22),rgba(var(--navy-rgb),0.46))] text-[var(--text-light)] shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
                                : "border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.32)] text-[var(--text-dim)] hover:border-[var(--border-strong)]"
                            }`}
                          >
                            <span className="flex w-full items-center justify-between gap-3">
                              <span className="text-lg font-black uppercase tracking-[0.08em]">
                                {packageT(packageId)}
                              </span>
                              <span
                                className={`grid h-7 w-7 place-items-center rounded-full border ${
                                  isSelected
                                    ? "border-[var(--highlight)] bg-[var(--highlight)] text-[var(--text-on-warm)]"
                                    : "border-[var(--border-soft)]"
                                }`}
                              >
                                {isSelected ? <Check size={16} /> : null}
                              </span>
                            </span>
                            <span className="mt-2 text-sm font-black text-[var(--highlight-soft)]">
                              {t(`plans.${packageId}.price`)}
                            </span>
                            <span className="mt-3 text-sm font-medium leading-6 text-[var(--text-dim)]">
                              {t(`plans.${packageId}.description`)}
                            </span>
                            <span className="mt-4 grid gap-2 text-sm font-bold leading-5">
                              {features.map((feature) => (
                                <span
                                  key={feature}
                                  className="flex items-start gap-2"
                                >
                                  <Check
                                    size={15}
                                    className="mt-0.5 shrink-0 text-[var(--highlight-soft)]"
                                  />
                                  <span>{feature}</span>
                                </span>
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-dim)]">
                      {t("packageTemporaryHint")}
                    </p>
                  </fieldset>
                  <label className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.32)] p-4 text-sm leading-6 text-[var(--text-dim)]">
                    <input
                      type="checkbox"
                      checked={hasAcceptedConsent}
                      onChange={(event) =>
                        setHasAcceptedConsent(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[var(--highlight)]"
                      required
                    />
                    <span>
                      {t("consentText")}{" "}
                      <button
                        type="button"
                        onClick={() => setIsTermsOpen(true)}
                        className="inline-flex min-h-11 items-center font-black text-[var(--highlight-soft)] underline underline-offset-4 hover:text-[var(--text-light)]"
                      >
                        {t("terms.link")}
                      </button>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.32)] p-4 text-sm leading-6 text-[var(--text-dim)]">
                    <input
                      type="checkbox"
                      checked={hasAcceptedHealthConsent}
                      onChange={(event) =>
                        setHasAcceptedHealthConsent(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[var(--highlight)]"
                      required
                    />
                    <span>{t("healthConsentText")}</span>
                  </label>
                </>
              ) : null}
              {isAnamnesisStep ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                      {t("requiredLabel", { label: t("age") })}
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                      required
                    />
                  </label>
                  {renderCheckboxGroup(
                    "anamnesis.goalsLabel",
                    goalOptions,
                    anamnesisGoals,
                    setAnamnesisGoals,
                    "anamnesis.goals",
                  )}
                  {renderCheckboxGroup(
                    "anamnesis.complaintsLabel",
                    complaintOptions,
                    anamnesisComplaints,
                    setAnamnesisComplaints,
                    "anamnesis.complaints",
                    "pain-free",
                  )}
                  {renderRadioGroup(
                    "anamnesis.fitnessLevelLabel",
                    fitnessLevelOptions,
                    fitnessLevel,
                    setFitnessLevel,
                    "anamnesis.fitnessLevels",
                  )}
                  {renderCheckboxGroup(
                    "anamnesis.movementRestrictionsLabel",
                    movementRestrictionOptions,
                    movementRestrictions,
                    setMovementRestrictions,
                    "anamnesis.movementRestrictions",
                    "none",
                  )}
                  {renderRadioGroup(
                    "anamnesis.stressLevelLabel",
                    stressLevelOptions,
                    stressLevel,
                    setStressLevel,
                    "anamnesis.stressLevels",
                  )}
                  {renderRadioGroup(
                    "anamnesis.sleepDisturbanceLabel",
                    sleepDisturbanceOptions,
                    sleepDisturbance,
                    setSleepDisturbance,
                    "anamnesis.sleepDisturbances",
                  )}
                  {renderCheckboxGroup(
                    "anamnesis.contraindicationsLabel",
                    contraindicationOptions,
                    contraindications,
                    setContraindications,
                    "anamnesis.contraindications",
                    "none",
                  )}
                  {hasReviewRequiredContraindication ? (
                    <div className="rounded-2xl border border-[rgba(var(--accent-strong-rgb),0.24)] bg-[var(--status-danger-soft)] p-4 text-sm leading-6 text-[var(--highlight-soft)]">
                      <p className="m-0 font-black uppercase tracking-[0.12em]">
                        {t("anamnesis.warningTitle")}
                      </p>
                      <p className="m-0 mt-2 text-[var(--text-light)]">
                        {t("anamnesis.warningIntro")}
                      </p>
                      <ol className="m-0 mt-3 grid gap-2 pl-5 text-[var(--text-dim)]">
                        <li>{t("anamnesis.warningDoctor")}</li>
                        <li>{t("anamnesis.warningConsultation")}</li>
                      </ol>
                      <p className="m-0 mt-3 font-bold text-[var(--text-light)]">
                        {t("anamnesis.warningQuote")}
                      </p>
                    </div>
                  ) : null}
                  <label className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.32)] p-4 text-sm leading-6 text-[var(--text-dim)]">
                    <input
                      type="checkbox"
                      checked={hasAcceptedAnamnesisLegal}
                      onChange={(event) =>
                        setHasAcceptedAnamnesisLegal(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[var(--highlight)]"
                      required
                    />
                    <span>{t("anamnesis.legalText")}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setInfoMessage("");
                      setHasAttemptedProfileSubmit(false);
                      setProfileSetupStep("account");
                    }}
                    className="flex w-full items-center justify-center gap-2 text-sm font-bold text-[var(--text-dim)] transition hover:text-[var(--text-light)]"
                  >
                    <ArrowLeft size={16} />
                    {t("anamnesis.backToAccount")}
                  </button>
                </>
              ) : null}
              {errorMessage ? (
                <div className="rounded-2xl border border-[rgba(var(--accent-strong-rgb),0.2)] bg-[var(--status-danger-soft)] px-4 py-3 text-sm text-[var(--highlight-soft)]">
                  {errorMessage}
                  {authErrorAction === "email-in-use" ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleChangeRegistrationEmail}
                        className="rounded-full border border-[rgba(var(--accent-strong-rgb),0.28)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--text-light)] transition hover:border-[var(--border-strong)] hover:bg-[rgba(var(--foreground-rgb),0.08)]"
                      >
                        {t("changeEmail")}
                      </button>
                      <button
                        type="button"
                        onClick={handleUseExistingAccount}
                        className="rounded-full bg-[var(--text-light)] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--text-on-warm)] transition hover:bg-[var(--secondary)]"
                      >
                        {t("signInWithThisEmail")}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {infoMessage ? (
                <div className="rounded-2xl border border-[rgba(var(--page-warm-rgb),0.28)] bg-[rgba(var(--page-warm-rgb),0.1)] px-4 py-3 text-sm text-[var(--text-light)]">
                  {infoMessage}
                </div>
              ) : null}
              {shouldShowFormRequirements ? (
                <div className="rounded-2xl border border-[rgba(var(--page-warm-rgb),0.24)] bg-[rgba(var(--page-warm-rgb),0.08)] px-4 py-3 text-sm leading-6 text-[var(--text-dim)]">
                  <p className="m-0 font-black text-[var(--text-light)]">
                    {t("validation.title")}
                  </p>
                  <ul className="m-0 mt-2 grid gap-1 pl-5">
                    {formRequirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <button
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--secondary)] py-4 font-black uppercase tracking-[0.18em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[var(--text-light)] disabled:hover:text-[var(--text-on-warm)]"
              >
                {isSubmitting ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : null}
                {isAnamnesisStep
                  ? t("anamnesis.submit")
                  : isProfileSetup
                    ? t("continueToAnamnesis")
                    : t("submitSignIn")}
              </button>
            </form>
            {!isProfileSetup ? (
              <button
                type="button"
                onClick={openPasswordReset}
                className="mt-3 flex min-h-11 w-full items-center justify-center text-sm font-bold text-[var(--highlight-soft)] transition hover:text-[var(--text-light)]"
              >
                {t("forgotPassword")}
              </button>
            ) : null}
            {!isGoogleOnboarding && !isAnamnesisStep ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView(isRegister ? "signIn" : "register");
                }}
                className="mt-1 flex min-h-11 w-full items-center justify-center text-sm text-[var(--text-dim)] transition hover:text-[var(--text-light)]"
              >
                {isRegister ? t("switchToSignIn") : t("switchToRegister")}
              </button>
            ) : null}
          </>
        )}
        {isTermsOpen ? (
          <div
            className={`${authTheme.overlay} fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm`}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-terms-title"
              tabIndex={-1}
              data-auth-terms-dialog
              className={`${authTheme.panel} relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-[var(--border-soft)] p-6`}
            >
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                aria-label={t("close")}
                className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-[var(--border-soft)] text-[var(--text-dim)] hover:text-[var(--text-light)]"
              >
                <X size={18} />
              </button>
              <h3
                id="auth-terms-title"
                className="pr-10 text-2xl font-black italic uppercase text-[var(--text-light)]"
              >
                {t("terms.title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
                {t("terms.intro")}
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-dim)]">
                {termsItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--foreground-rgb),0.04)] p-4"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="mt-5 w-full rounded-full bg-[var(--text-light)] py-3 font-black uppercase tracking-[0.16em] text-[var(--text-on-warm)]"
              >
                {t("terms.close")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

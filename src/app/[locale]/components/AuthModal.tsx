"use client";
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from "next-intl";
import { auth, db, functions } from "../../../../firebase.config";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    type User,
    type AuthError,
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, Mail, X } from 'lucide-react';
import type { MemberPackage } from "@/data";
import { memberPackages } from "@/lib/memberPackages";
import { getAuthUserPhotoURL, type UserGender } from "@/lib/userProfile";
import authTheme from "./AuthTheme.module.css";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    requiresProfileSetup?: boolean;
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
    anamnesisStatusKey: "pending";
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
    return firebaseError?.code
        ?? firebaseError?.error?.message
        ?? firebaseError?.customData?._tokenResponse?.error?.message
        ?? "unknown";
}

type AuthView = "signIn" | "register" | "forgotPassword" | "googleOnboarding";

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

export default function AuthModal({ isOpen, onClose, requiresProfileSetup = false }: AuthModalProps) {
    const t = useTranslations("auth");
    const packageT = useTranslations("packages");
    const locale = useLocale();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<UserGender | ''>('');
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [occupation, setOccupation] = useState('');
    const [region, setRegion] = useState('');
    const [selectedPackage, setSelectedPackage] = useState<MemberPackage>("basic");
    const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
    const [hasAcceptedHealthConsent, setHasAcceptedHealthConsent] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [view, setView] = useState<AuthView>("signIn");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [hasAttemptedSignInSubmit, setHasAttemptedSignInSubmit] = useState(false);
    const [hasAttemptedProfileSubmit, setHasAttemptedProfileSubmit] = useState(false);
    const isRegister = view === "register";
    const isForgotPassword = view === "forgotPassword";
    const isGoogleOnboarding = view === "googleOnboarding";
    const isProfileSetup = isRegister || isGoogleOnboarding;
    const trimmedEmail = email.trim();
    const hasValidEmail = trimmedEmail.length === 0 || isValidEmailAddress(trimmedEmail);
    const termsItems = t.raw("terms.items") as string[];
    const isPasswordMatching = !isRegister || password === confirmPassword;
    const hasRequiredRegistrationFields =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        trimmedEmail.length > 0 &&
        hasValidEmail &&
        (!isRegister || (password.length > 0 && confirmPassword.length > 0)) &&
        Number(age) >= 1 &&
        Number(age) <= 120 &&
        gender.length > 0 &&
        Number(heightCm) >= 80 &&
        Number(heightCm) <= 240 &&
        Number(weightKg) >= 25 &&
        Number(weightKg) <= 300 &&
        region.length > 0 &&
        isPasswordMatching &&
        hasAcceptedConsent &&
        hasAcceptedHealthConsent;
    const canSubmit = isProfileSetup
        ? !isSubmitting
        : !isSubmitting;
    const registrationRequirements = [
        ...(firstName.trim().length === 0 ? [t("validation.firstName")] : []),
        ...(lastName.trim().length === 0 ? [t("validation.lastName")] : []),
        ...(trimmedEmail.length === 0 ? [t("validation.email")] : []),
        ...(trimmedEmail.length > 0 && !hasValidEmail ? [t("invalidEmail")] : []),
        ...(isRegister && password.length === 0 ? [t("validation.password")] : []),
        ...(isRegister && confirmPassword.length === 0 ? [t("validation.confirmPassword")] : []),
        ...(isRegister && password.length > 0 && confirmPassword.length > 0 && !isPasswordMatching
            ? [t("validation.passwordMismatch")]
            : []),
        ...(Number(age) < 1 || Number(age) > 120 ? [t("validation.age")] : []),
        ...(gender.length === 0 ? [t("validation.gender")] : []),
        ...(Number(heightCm) < 80 || Number(heightCm) > 240 ? [t("validation.height")] : []),
        ...(Number(weightKg) < 25 || Number(weightKg) > 300 ? [t("validation.weight")] : []),
        ...(region.length === 0 ? [t("validation.region")] : []),
        ...(!hasAcceptedConsent ? [t("validation.consent")] : []),
        ...(!hasAcceptedHealthConsent ? [t("validation.healthConsent")] : []),
    ];
    const signInRequirements = [
        ...(trimmedEmail.length === 0 ? [t("validation.signInEmail")] : []),
        ...(trimmedEmail.length > 0 && !hasValidEmail ? [t("invalidEmail")] : []),
        ...(password.length === 0 ? [t("validation.signInPassword")] : []),
    ];
    const formRequirements = isProfileSetup ? registrationRequirements : signInRequirements;
    const shouldShowFormRequirements =
        !isSubmitting &&
        formRequirements.length > 0 &&
        (isProfileSetup ? hasAttemptedProfileSubmit : hasAttemptedSignInSubmit);

    useEffect(() => {
        if (
            !isOpen
            || !requiresProfileSetup
            || !auth.currentUser
            || !auth.currentUser.providerData.some((provider) => provider.providerId === "google.com")
        ) return;

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
        const messages = [
            firebaseError?.message,
            firebaseError?.error?.message,
            firebaseError?.customData?._tokenResponse?.error?.message,
        ].filter(Boolean);

        if (code === "auth/email-already-in-use" || messages.some((message) => message?.includes("EMAIL_EXISTS"))) {
            return t("emailInUse");
        }

        if (messages.some((message) => message?.includes("INVALID_LOGIN_CREDENTIALS"))) {
            return t("invalidCredential");
        }

        switch (code) {
            case "auth/operation-not-allowed":
                return t("providerDisabled");
            case "auth/invalid-credential":
            case "auth/invalid-login-credentials":
            case "auth/user-not-found":
            case "auth/wrong-password":
                return t("invalidCredential");
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
        primaryGoalKey: null,
        memberPackage,
        startedCourseIds: [],
        completedCourseIds: [],
        recommendedCourseIds: [],
        anamnesisStatusKey: "pending",
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

    const resetForm = () => {
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
        setIsTermsOpen(false);
        setErrorMessage("");
        setInfoMessage("");
        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);
        setHasAttemptedSignInSubmit(false);
        setHasAttemptedProfileSubmit(false);
    };

    const getAuthActionSettings = () => ({
        url: `${window.location.origin}/${locale}`,
    });

    const openCheckoutForSelectedPackage = async () => {
        const createSession = httpsCallable<
            { locale: string; memberPackage: MemberPackage },
            BillingSessionResult
        >(functions, "createStripeCheckoutSession");
        const result = await createSession({ locale, memberPackage: selectedPackage });

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
        setInfoMessage("");
        setView("forgotPassword");
    };

    const handleClose = async () => {
        if (isGoogleOnboarding) {
            await signOut(auth).catch(() => undefined);
            resetForm();
            setView("signIn");
        }
        onClose();
    };

    const handleGoogleSignIn = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage("");
        setInfoMessage("");

        try {
            const credential = await signInWithPopup(auth, googleProvider);
            const profileSnapshot = await getDoc(doc(db, "users", credential.user.uid));

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
        setIsSubmitting(true);
        setErrorMessage("");
        try {
            if (isProfileSetup) {
                setHasAttemptedProfileSubmit(true);

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

                if (isGoogleOnboarding) {
                    const googleUser = auth.currentUser;
                    if (!googleUser) {
                        throw new Error("Google user is no longer authenticated.");
                    }

                    try {
                        await setDoc(
                            doc(db, "users", googleUser.uid),
                            createProfilePayload(
                                googleUser.uid,
                                googleUser.email ?? trimmedEmail,
                                selectedPackage,
                                googleUser,
                            ),
                        );
                        await openCheckoutForSelectedPackage();
                    } catch (profileOrCheckoutError) {
                        await deleteIncompleteAccount(googleUser);
                        throw profileOrCheckoutError;
                    }
                    return;
                }

                const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

                try {
                    await updateProfile(credential.user, {
                        displayName: fullName,
                    });
                    await setDoc(
                        doc(db, "users", credential.user.uid),
                        createProfilePayload(credential.user.uid, credential.user.email ?? trimmedEmail, selectedPackage),
                    );
                } catch (profileError) {
                    await deleteUser(credential.user).catch(() => undefined);
                    throw profileError;
                }

                try {
                    await sendEmailVerification(credential.user, getAuthActionSettings());
                } catch (verificationError) {
                    console.error("Firebase verification email failed", {
                        code: getFirebaseErrorCode(verificationError),
                        error: verificationError,
                    });
                    await signOut(auth).catch(() => undefined);
                    setPassword("");
                    setConfirmPassword("");
                    setView("signIn");
                    setErrorMessage(t("verificationSendFailed"));
                    return;
                }

                try {
                    await openCheckoutForSelectedPackage();
                } catch (checkoutError) {
                    console.error("Stripe checkout could not be opened after registration", {
                        code: getFirebaseErrorCode(checkoutError),
                        error: checkoutError,
                    });
                    await deleteIncompleteAccount(credential.user);
                    setPassword("");
                    setConfirmPassword("");
                    setView("signIn");
                    setErrorMessage(`${t("errorPrefix")} ${getFriendlyErrorMessage(checkoutError)}`);
                }
                return;
            } else {
                setHasAttemptedSignInSubmit(true);

                if (signInRequirements.length > 0) {
                    return;
                }

                const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
                const usesPassword = credential.user.providerData.some(
                    (provider) => provider.providerId === "password",
                );

                if (usesPassword && !credential.user.emailVerified) {
                    await signOut(auth);
                    setErrorMessage(`${t("errorPrefix")} ${t("emailNotVerified")}`);
                    return;
                }
            }
            resetForm();
            onClose();
        } catch (error: unknown) {
            console.error("Firebase authentication failed", {
                code: getFirebaseErrorCode(error),
                error,
            });
            setErrorMessage(`${t("errorPrefix")} ${getFriendlyErrorMessage(error)}`);
        } finally {
            setIsSubmitting(false);
        }
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
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--text-dim)] transition hover:bg-[rgba(var(--foreground-rgb),0.08)] hover:text-[var(--text-light)] focus:outline-none focus:ring-2 focus:ring-[var(--border-strong)]"
            >
                {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className={`${authTheme.scope} ${authTheme.overlay} fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4`}>
            <div className={`${authTheme.panel} relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[var(--border-soft)] p-6 sm:p-8`}>
                <button onClick={() => void handleClose()} aria-label={t("close")} className="absolute right-4 top-4 rounded-full border border-[var(--border-soft)] bg-[rgba(var(--foreground-rgb),0.05)] p-2 text-[var(--text-dim)] transition hover:bg-[rgba(var(--foreground-rgb),0.1)] hover:text-[var(--text-light)]"><X size={18} /></button>
                <div className="mb-6">
                    <div className="mb-3 inline-flex rounded-full border border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--highlight-soft)]">
                        Bewegesund
                    </div>
                    <h2 className="text-3xl font-black italic uppercase text-[var(--text-light)]">
                        {isForgotPassword ? t("resetTitle") : isGoogleOnboarding ? t("googleOnboardingTitle") : isRegister ? t("registerTitle") : t("signInTitle")}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                        {isForgotPassword ? t("resetSupportText") : isGoogleOnboarding ? t("googleOnboardingSupportText") : isRegister ? t("registerSupportText") : t("supportText")}
                    </p>
                </div>
                {isForgotPassword ? (
                    <form onSubmit={handlePasswordReset} noValidate className="space-y-4">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.12)] text-[var(--highlight-soft)]">
                            <Mail size={26} />
                        </div>
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("email")}</span>
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
                            {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
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
                            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
                                <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
                                <path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z" />
                                <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
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
                    {isProfileSetup ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("firstName") })}</span>
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
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("lastName") })}</span>
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
                    <label className={isGoogleOnboarding ? "hidden" : "block"}>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{isRegister ? t("requiredLabel", { label: t("email") }) : t("email")}</span>
                        <input
                            type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                            autoComplete="email"
                            required={!isGoogleOnboarding}
                            readOnly={isGoogleOnboarding}
                        />
                    </label>
                    {!isGoogleOnboarding ? (
                    <div className={isRegister ? "grid gap-4 sm:grid-cols-2" : ""}>
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{isRegister ? t("requiredLabel", { label: t("password") }) : t("password")}</span>
                            {renderPasswordInput({
                                value: password,
                                onChange: setPassword,
                                placeholder: t("password"),
                                autoComplete: isRegister ? "new-password" : "current-password",
                                isVisible: isPasswordVisible,
                                onToggleVisibility: () => setIsPasswordVisible((current) => !current),
                            })}
                        </label>
                        {isRegister ? (
                            <label className="block">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("confirmPassword") })}</span>
                                {renderPasswordInput({
                                    value: confirmPassword,
                                    onChange: setConfirmPassword,
                                    placeholder: t("confirmPassword"),
                                    autoComplete: "new-password",
                                    isVisible: isConfirmPasswordVisible,
                                    onToggleVisibility: () => setIsConfirmPasswordVisible((current) => !current),
                                })}
                                {confirmPassword && !isPasswordMatching ? (
                                    <span className="mt-2 block text-sm font-bold text-[var(--highlight-soft)]">{t("passwordMismatch")}</span>
                                ) : null}
                            </label>
                        ) : null}
                    </div>
                    ) : null}
                    {isProfileSetup ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("age") })}</span>
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
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("gender") })}</span>
                                    <select
                                        value={gender}
                                        onChange={(event) => setGender(event.target.value as UserGender | '')}
                                        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                                        required
                                    >
                                        <option value="">{t("selectGenderPlaceholder")}</option>
                                        <option value="female">{t("genderFemale")}</option>
                                        <option value="male">{t("genderMale")}</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("heightCm") })}</span>
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
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("weightKg") })}</span>
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
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("optionalLabel", { label: t("occupation") })}</span>
                                <select
                                    value={occupation}
                                    onChange={(event) => setOccupation(event.target.value)}
                                    className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                                >
                                    <option value="">{t("selectPlaceholder")}</option>
                                    <option value="sedentary">{t("occupations.sedentary")}</option>
                                    <option value="standing">{t("occupations.standing")}</option>
                                    <option value="physical">{t("occupations.physical")}</option>
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
                                <p className="mt-2 text-xs leading-5 text-[var(--text-dim)]">{t("regionCompetitionHint")}</p>
                            </label>
                            <fieldset>
                                <legend className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                                    {t("requiredLabel", { label: t("packageLabel") })}
                                </legend>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {memberPackages.map((packageId) => {
                                        const isSelected = packageId === selectedPackage;
                                        const features = t.raw(`plans.${packageId}.features`) as string[];

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
                                                    <span className={`grid h-7 w-7 place-items-center rounded-full border ${
                                                        isSelected
                                                            ? "border-[var(--highlight)] bg-[var(--highlight)] text-[var(--text-on-warm)]"
                                                            : "border-[var(--border-soft)]"
                                                    }`}>
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
                                                        <span key={feature} className="flex items-start gap-2">
                                                            <Check size={15} className="mt-0.5 shrink-0 text-[var(--highlight-soft)]" />
                                                            <span>{feature}</span>
                                                        </span>
                                                    ))}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-2 text-xs leading-5 text-[var(--text-dim)]">{t("packageTemporaryHint")}</p>
                            </fieldset>
                            <label className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.32)] p-4 text-sm leading-6 text-[var(--text-dim)]">
                                <input
                                    type="checkbox"
                                    checked={hasAcceptedConsent}
                                    onChange={(event) => setHasAcceptedConsent(event.target.checked)}
                                    className="mt-1 h-4 w-4 accent-[var(--highlight)]"
                                    required
                                />
                                <span>
                                    {t("consentText")}{" "}
                                    <button
                                        type="button"
                                        onClick={() => setIsTermsOpen(true)}
                                        className="font-black text-[var(--highlight-soft)] underline underline-offset-4 hover:text-[var(--text-light)]"
                                    >
                                        {t("terms.link")}
                                    </button>
                                </span>
                            </label>
                            <label className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.32)] p-4 text-sm leading-6 text-[var(--text-dim)]">
                                <input
                                    type="checkbox"
                                    checked={hasAcceptedHealthConsent}
                                    onChange={(event) => setHasAcceptedHealthConsent(event.target.checked)}
                                    className="mt-1 h-4 w-4 accent-[var(--highlight)]"
                                    required
                                />
                                <span>{t("healthConsentText")}</span>
                            </label>
                        </>
                    ) : null}
                    {errorMessage ? (
                        <div className="rounded-2xl border border-[rgba(var(--accent-strong-rgb),0.2)] bg-[var(--status-danger-soft)] px-4 py-3 text-sm text-[var(--highlight-soft)]">
                            {errorMessage}
                        </div>
                    ) : null}
                    {infoMessage ? (
                        <div className="rounded-2xl border border-[rgba(var(--page-warm-rgb),0.28)] bg-[rgba(var(--page-warm-rgb),0.1)] px-4 py-3 text-sm text-[var(--text-light)]">
                            {infoMessage}
                        </div>
                    ) : null}
                    {shouldShowFormRequirements ? (
                        <div className="rounded-2xl border border-[rgba(var(--page-warm-rgb),0.24)] bg-[rgba(var(--page-warm-rgb),0.08)] px-4 py-3 text-sm leading-6 text-[var(--text-dim)]">
                            <p className="m-0 font-black text-[var(--text-light)]">{t("validation.title")}</p>
                            <ul className="m-0 mt-2 grid gap-1 pl-5">
                                {formRequirements.map((requirement) => (
                                    <li key={requirement}>{requirement}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                    <button disabled={!canSubmit} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--secondary)] py-4 font-black uppercase tracking-[0.18em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[var(--text-light)] disabled:hover:text-[var(--text-on-warm)]">
                        {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                        {isGoogleOnboarding ? t("completeProfile") : isRegister ? t("submitRegister") : t("submitSignIn")}
                    </button>
                </form>
                {!isProfileSetup ? (
                    <button
                        type="button"
                        onClick={openPasswordReset}
                        className="mt-4 w-full text-sm font-bold text-[var(--highlight-soft)] transition hover:text-[var(--text-light)]"
                    >
                        {t("forgotPassword")}
                    </button>
                ) : null}
                {!isGoogleOnboarding ? (
                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setView(isRegister ? "signIn" : "register");
                    }}
                    className="mt-3 w-full text-sm text-[var(--text-dim)] transition hover:text-[var(--text-light)]"
                >
                    {isRegister ? t("switchToSignIn") : t("switchToRegister")}
                </button>
                ) : null}
                </>
                )}
                {isTermsOpen ? (
                    <div className={`${authTheme.overlay} fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm`}>
                        <div className={`${authTheme.panel} relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-[var(--border-soft)] p-6`}>
                            <button
                                type="button"
                                onClick={() => setIsTermsOpen(false)}
                                aria-label={t("close")}
                                className="absolute right-4 top-4 rounded-full border border-[var(--border-soft)] p-2 text-[var(--text-dim)] hover:text-[var(--text-light)]"
                            >
                                <X size={18} />
                            </button>
                            <h3 className="pr-10 text-2xl font-black italic uppercase text-[var(--text-light)]">{t("terms.title")}</h3>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{t("terms.intro")}</p>
                            <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-dim)]">
                                {termsItems.map((item) => (
                                    <li key={item} className="rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--foreground-rgb),0.04)] p-4">
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

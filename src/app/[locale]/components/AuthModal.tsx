"use client";
import { useState } from 'react';
import { useTranslations } from "next-intl";
import { auth, db } from "../../../../firebase.config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, type AuthError } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { LoaderCircle, X } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CreateUserProfilePayload {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    dateOfBirth: string | null;
    heightCm: number | null;
    weightKg: number | null;
    occupationKey: string | null;
    averageStepsPerDay: number | null;
    primaryGoalKey: string | null;
    memberPackage: "starter";
    startedCourseIds: string[];
    completedCourseIds: string[];
    recommendedCourseIds: string[];
    anamnesisStatusKey: "pending";
    consentAcceptedAt: ReturnType<typeof serverTimestamp>;
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

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const t = useTranslations("auth");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [occupation, setOccupation] = useState('');
    const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const termsItems = t.raw("terms.items") as string[];
    const isPasswordMatching = !isRegister || password === confirmPassword;
    const hasRequiredRegistrationFields =
        fullName.trim().length > 0 &&
        email.trim().length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0 &&
        isPasswordMatching &&
        hasAcceptedConsent;
    const canSubmit = isRegister
        ? hasRequiredRegistrationFields && !isSubmitting
        : email.trim().length > 0 && password.length > 0 && !isSubmitting;

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

        switch (code) {
            case "auth/operation-not-allowed":
                return t("providerDisabled");
            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                return t("invalidCredential");
            case "auth/weak-password":
                return t("weakPassword");
            case "auth/invalid-email":
                return t("invalidEmail");
            case "auth/too-many-requests":
                return t("tooManyRequests");
            case "permission-denied":
            case "firestore/permission-denied":
                return t("profileSavePermissionDenied");
            default:
                return t("genericError");
        }
    };

    const createProfilePayload = (uid: string, userEmail: string): CreateUserProfilePayload => ({
        uid,
        email: userEmail,
        displayName: fullName.trim(),
        photoURL: null,
        dateOfBirth: dateOfBirth || null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        occupationKey: occupation || null,
        averageStepsPerDay: null,
        primaryGoalKey: null,
        memberPackage: "starter",
        startedCourseIds: [],
        completedCourseIds: [],
        recommendedCourseIds: [],
        anamnesisStatusKey: "pending",
        consentAcceptedAt: serverTimestamp(),
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
        setFullName("");
        setDateOfBirth("");
        setHeightCm("");
        setWeightKg("");
        setOccupation("");
        setHasAcceptedConsent(false);
        setIsTermsOpen(false);
        setErrorMessage("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");
        try {
            if (isRegister) {
                if (password !== confirmPassword) {
                    setErrorMessage(`${t("errorPrefix")} ${t("passwordMismatch")}`);
                    return;
                }

                if (!hasAcceptedConsent) {
                    setErrorMessage(`${t("errorPrefix")} ${t("consentRequired")}`);
                    return;
                }

                const credential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(
                    doc(db, "users", credential.user.uid),
                    createProfilePayload(credential.user.uid, credential.user.email ?? email.trim()),
                );

                await updateProfile(credential.user, {
                    displayName: fullName.trim(),
                });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            resetForm();
            onClose();
        } catch (error: unknown) {
            setErrorMessage(`${t("errorPrefix")} ${getFriendlyErrorMessage(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(var(--navy-rgb),0.92)] backdrop-blur-md p-4">
            <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-[var(--border-soft)] bg-[radial-gradient(circle_at_top,_rgba(var(--accent-rgb),0.2),_transparent_32%),linear-gradient(180deg,_rgba(var(--navy-rgb),0.98),_rgba(2,35,53,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
                <button onClick={onClose} aria-label={t("close")} className="absolute right-4 top-4 rounded-full border border-[var(--border-soft)] bg-[rgba(var(--foreground-rgb),0.05)] p-2 text-[var(--text-dim)] transition hover:bg-[rgba(var(--foreground-rgb),0.1)] hover:text-[var(--text-light)]"><X size={18} /></button>
                <div className="mb-6">
                    <div className="mb-3 inline-flex rounded-full border border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--highlight-soft)]">
                        Bewegesund
                    </div>
                    <h2 className="text-3xl font-black italic uppercase text-[var(--text-light)]">
                        {isRegister ? t("registerTitle") : t("signInTitle")}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                        {isRegister ? t("registerSupportText") : t("supportText")}
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister ? (
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("fullName") })}</span>
                            <input
                                type="text"
                                placeholder={t("fullName")}
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                                autoComplete="name"
                                required
                            />
                        </label>
                    ) : null}
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{isRegister ? t("requiredLabel", { label: t("email") }) : t("email")}</span>
                        <input
                            type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                            autoComplete="email"
                            required
                        />
                    </label>
                    <div className={isRegister ? "grid gap-4 sm:grid-cols-2" : ""}>
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{isRegister ? t("requiredLabel", { label: t("password") }) : t("password")}</span>
                            <input
                                type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                                autoComplete={isRegister ? "new-password" : "current-password"}
                                required
                            />
                        </label>
                        {isRegister ? (
                            <label className="block">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("requiredLabel", { label: t("confirmPassword") })}</span>
                                <input
                                    type="password"
                                    placeholder={t("confirmPassword")}
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                                    autoComplete="new-password"
                                    required
                                />
                                {confirmPassword && !isPasswordMatching ? (
                                    <span className="mt-2 block text-sm font-bold text-[var(--highlight-soft)]">{t("passwordMismatch")}</span>
                                ) : null}
                            </label>
                        ) : null}
                    </div>
                    {isRegister ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("optionalLabel", { label: t("dateOfBirth") })}</span>
                                    <input
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(event) => setDateOfBirth(event.target.value)}
                                        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("optionalLabel", { label: t("heightCm") })}</span>
                                    <input
                                        type="number"
                                        min="80"
                                        max="240"
                                        value={heightCm}
                                        onChange={(event) => setHeightCm(event.target.value)}
                                        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("optionalLabel", { label: t("weightKg") })}</span>
                                    <input
                                        type="number"
                                        min="25"
                                        max="300"
                                        value={weightKg}
                                        onChange={(event) => setWeightKg(event.target.value)}
                                        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
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
                        </>
                    ) : null}
                    {errorMessage ? (
                        <div className="rounded-2xl border border-[rgba(var(--accent-strong-rgb),0.2)] bg-[var(--status-danger-soft)] px-4 py-3 text-sm text-[var(--highlight-soft)]">
                            {errorMessage}
                        </div>
                    ) : null}
                    <button disabled={!canSubmit} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--secondary)] py-4 font-black uppercase tracking-[0.18em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[var(--text-light)] disabled:hover:text-[var(--text-on-warm)]">
                        {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                        {isRegister ? t("submitRegister") : t("submitSignIn")}
                    </button>
                </form>
                <button
                    onClick={() => {
                        resetForm();
                        setIsRegister(!isRegister);
                    }}
                    className="mt-5 w-full text-sm text-[var(--text-dim)] transition hover:text-[var(--text-light)]"
                >
                    {isRegister ? t("switchToSignIn") : t("switchToRegister")}
                </button>
                {isTermsOpen ? (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(var(--navy-rgb),0.72)] p-4 backdrop-blur-sm">
                        <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-[var(--border-soft)] bg-[linear-gradient(180deg,_rgba(var(--navy-rgb),0.98),_rgba(2,35,53,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
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

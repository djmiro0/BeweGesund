"use client";
import { useState } from 'react';
import { useTranslations } from "next-intl";
import { auth, db } from "../../../../firebase.config";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type AuthError,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Check, LoaderCircle, X } from 'lucide-react';
import type { MemberPackage } from "@/data";
import { memberPackages } from "@/lib/memberPackages";
import type { UserGender } from "@/lib/userProfile";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
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

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const t = useTranslations("auth");
    const packageT = useTranslations("packages");
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
    const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
    const [hasAcceptedHealthConsent, setHasAcceptedHealthConsent] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isRegister, setIsRegister] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const termsItems = t.raw("terms.items") as string[];
    const isPasswordMatching = !isRegister || password === confirmPassword;
    const hasRequiredRegistrationFields =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        email.trim().length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0 &&
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

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const createProfilePayload = (uid: string, userEmail: string): CreateUserProfilePayload => ({
        uid,
        email: userEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: fullName,
        photoURL: null,
        age: Number(age),
        gender: gender as UserGender,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        occupationKey: occupation || null,
        regionKey: region,
        averageStepsPerDay: null,
        primaryGoalKey: null,
        memberPackage: "basic",
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
        setHasAcceptedConsent(false);
        setHasAcceptedHealthConsent(false);
        setIsTermsOpen(false);
        setErrorMessage("");
        setInfoMessage("");
    };

    const handlePasswordReset = async () => {
        if (!email.trim() || isSubmitting) {
            setErrorMessage(`${t("errorPrefix")} ${t("resetEmailRequired")}`);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setInfoMessage("");

        try {
            await sendPasswordResetEmail(auth, email.trim());
            setInfoMessage(t("resetEmailSent"));
        } catch (error) {
            setErrorMessage(`${t("errorPrefix")} ${getFriendlyErrorMessage(error)}`);
        } finally {
            setIsSubmitting(false);
        }
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

                if (!hasAcceptedHealthConsent) {
                    setErrorMessage(`${t("errorPrefix")} ${t("healthConsentRequired")}`);
                    return;
                }

                const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);

                try {
                    await updateProfile(credential.user, {
                        displayName: fullName,
                    });
                    await setDoc(
                        doc(db, "users", credential.user.uid),
                        createProfilePayload(credential.user.uid, credential.user.email ?? email.trim()),
                    );
                    await sendEmailVerification(credential.user);
                    await signOut(auth);
                    setPassword("");
                    setConfirmPassword("");
                    setIsRegister(false);
                    setInfoMessage(t("verificationSent"));
                    return;
                } catch (profileError) {
                    await deleteUser(credential.user).catch(() => undefined);
                    throw profileError;
                }
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
                                        const isSelected = packageId === "basic";
                                        const features = t.raw(`plans.${packageId}.features`) as string[];

                                        return (
                                            <div
                                                key={packageId}
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
                                            </div>
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
                    <button disabled={!canSubmit} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--secondary)] py-4 font-black uppercase tracking-[0.18em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[var(--text-light)] disabled:hover:text-[var(--text-on-warm)]">
                        {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                        {isRegister ? t("submitRegister") : t("submitSignIn")}
                    </button>
                </form>
                {!isRegister ? (
                    <button
                        type="button"
                        onClick={() => void handlePasswordReset()}
                        className="mt-4 w-full text-sm font-bold text-[var(--highlight-soft)] transition hover:text-[var(--text-light)]"
                    >
                        {t("forgotPassword")}
                    </button>
                ) : null}
                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setIsRegister((current) => !current);
                    }}
                    className="mt-3 w-full text-sm text-[var(--text-dim)] transition hover:text-[var(--text-light)]"
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

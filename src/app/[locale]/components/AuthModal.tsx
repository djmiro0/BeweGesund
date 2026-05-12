"use client";
import { useState } from 'react';
import { useTranslations } from "next-intl";
import { auth} from "../../../../firebase.config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { LoaderCircle, X } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const t = useTranslations("auth");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const getFriendlyErrorMessage = (error: unknown) => {
        const code = (error as AuthError | undefined)?.code;

        switch (code) {
            case "auth/operation-not-allowed":
                return t("providerDisabled");
            case "auth/invalid-credential":
            case "auth/user-not-found":
            case "auth/wrong-password":
                return t("invalidCredential");
            case "auth/email-already-in-use":
                return t("emailInUse");
            case "auth/weak-password":
                return t("weakPassword");
            case "auth/invalid-email":
                return t("invalidEmail");
            case "auth/too-many-requests":
                return t("tooManyRequests");
            default:
                return t("genericError");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            setEmail("");
            setPassword("");
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
            <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[var(--border-soft)] bg-[radial-gradient(circle_at_top,_rgba(var(--accent-rgb),0.2),_transparent_32%),linear-gradient(180deg,_rgba(var(--navy-rgb),0.98),_rgba(2,35,53,0.98))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                <button onClick={onClose} aria-label={t("close")} className="absolute right-4 top-4 rounded-full border border-[var(--border-soft)] bg-[rgba(var(--foreground-rgb),0.05)] p-2 text-[var(--text-dim)] transition hover:bg-[rgba(var(--foreground-rgb),0.1)] hover:text-[var(--text-light)]"><X size={18} /></button>
                <div className="mb-6">
                    <div className="mb-3 inline-flex rounded-full border border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--highlight-soft)]">
                        S.BeweGesund
                    </div>
                    <h2 className="text-3xl font-black italic uppercase text-[var(--text-light)]">
                        {isRegister ? t("registerTitle") : t("signInTitle")}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{t("supportText")}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("email")}</span>
                        <input
                            type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                            autoComplete="email"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">{t("password")}</span>
                        <input
                            type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-2xl border border-[var(--border-soft)] bg-[rgba(var(--navy-rgb),0.4)] px-4 py-3 text-[var(--text-light)] outline-none transition focus:border-[var(--border-strong)] focus:bg-[rgba(var(--navy-rgb),0.7)]"
                            autoComplete={isRegister ? "new-password" : "current-password"}
                        />
                    </label>
                    {errorMessage ? (
                        <div className="rounded-2xl border border-[rgba(var(--accent-strong-rgb),0.2)] bg-[var(--status-danger-soft)] px-4 py-3 text-sm text-[var(--highlight-soft)]">
                            {errorMessage}
                        </div>
                    ) : null}
                    <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--text-light)] py-4 font-black uppercase tracking-[0.18em] text-[var(--text-on-warm)] transition hover:bg-[var(--button-primary-bg)] hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-70">
                        {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                        {isRegister ? t("submitRegister") : t("submitSignIn")}
                    </button>
                </form>
                <button
                    onClick={() => setIsRegister(!isRegister)}
                    className="mt-5 w-full text-sm text-[var(--text-dim)] transition hover:text-[var(--text-light)]"
                >
                    {isRegister ? t("switchToSignIn") : t("switchToRegister")}
                </button>
            </div>
        </div>
    );
}

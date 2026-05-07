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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-md p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_32%),linear-gradient(180deg,_rgba(24,24,27,0.98),_rgba(9,9,11,0.98))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                <button onClick={onClose} aria-label={t("close")} className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
                <div className="mb-6">
                    <div className="mb-3 inline-flex rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-200">
                        S.BeweGesund
                    </div>
                    <h2 className="text-3xl font-black italic uppercase text-white">
                        {isRegister ? t("registerTitle") : t("signInTitle")}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{t("supportText")}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{t("email")}</span>
                        <input
                            type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-black"
                            autoComplete="email"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{t("password")}</span>
                        <input
                            type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:bg-black"
                            autoComplete={isRegister ? "new-password" : "current-password"}
                        />
                    </label>
                    {errorMessage ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {errorMessage}
                        </div>
                    ) : null}
                    <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 font-black uppercase tracking-[0.18em] text-black transition hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-70">
                        {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
                        {isRegister ? t("submitRegister") : t("submitSignIn")}
                    </button>
                </form>
                <button
                    onClick={() => setIsRegister(!isRegister)}
                    className="mt-5 w-full text-sm text-zinc-400 transition hover:text-white"
                >
                    {isRegister ? t("switchToSignIn") : t("switchToRegister")}
                </button>
            </div>
        </div>
    );
}

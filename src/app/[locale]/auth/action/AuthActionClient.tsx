"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { auth } from "../../../../../firebase.config";
import authTheme from "../../components/AuthTheme.module.css";

type ActionStatus = "loading" | "ready" | "success" | "error";

export default function AuthActionClient() {
  const t = useTranslations("authAction");
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const [status, setStatus] = useState<ActionStatus>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function prepareAction() {
      if (!oobCode) {
        setErrorMessage(t("invalidLink"));
        setStatus("error");
        return;
      }

      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          if (isActive) setStatus("success");
          return;
        }

        if (mode === "resetPassword") {
          const actionEmail = await verifyPasswordResetCode(auth, oobCode);
          if (isActive) {
            setEmail(actionEmail);
            setStatus("ready");
          }
          return;
        }

        setErrorMessage(t("unsupportedAction"));
        setStatus("error");
      } catch {
        if (isActive) {
          setErrorMessage(t("expiredLink"));
          setStatus("error");
        }
      }
    }

    void prepareAction();
    return () => {
      isActive = false;
    };
  }, [mode, oobCode, t]);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!oobCode) return;
    if (password.length < 6) {
      setErrorMessage(t("weakPassword"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t("passwordMismatch"));
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
    } catch {
      setErrorMessage(t("expiredLink"));
      setStatus("error");
    }
  };

  const isReset = mode === "resetPassword";

  return (
    <main
      className={`${authTheme.scope} grid min-h-[calc(100svh-5rem)] place-items-center bg-[var(--auth-panel-alt)] px-4 py-12`}
    >
      <section
        className={`${authTheme.panel} w-full max-w-xl rounded-[2rem] border border-[var(--border-soft)] p-6 backdrop-blur-xl sm:p-9`}
      >
        <div className="mb-6 inline-flex rounded-full border border-[rgba(var(--accent-rgb),0.25)] bg-[rgba(var(--accent-rgb),0.1)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--highlight-soft)]">
          Bewegesund
        </div>

        {status === "loading" ? (
          <div className="grid min-h-56 place-items-center text-center">
            <div>
              <LoaderCircle
                className="mx-auto animate-spin text-[var(--highlight-soft)]"
                size={36}
              />
              <p className="mt-4 text-sm text-[var(--text-dim)]">
                {t("checkingLink")}
              </p>
            </div>
          </div>
        ) : null}

        {status === "ready" && isReset ? (
          <>
            <ShieldCheck size={38} className="text-[var(--highlight-soft)]" />
            <h1 className="mt-5 text-3xl font-black italic uppercase">
              {t("resetTitle")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
              {t("resetFor", { email })}
            </p>
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  {t("newPassword")}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className={`${authTheme.input} w-full rounded-2xl border border-[var(--border-soft)] px-4 py-3 outline-none focus:border-[var(--border-strong)]`}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  {t("confirmPassword")}
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className={`${authTheme.input} w-full rounded-2xl border border-[var(--border-soft)] px-4 py-3 outline-none focus:border-[var(--border-strong)]`}
                  required
                />
              </label>
              {errorMessage ? (
                <p className="text-sm font-bold text-[var(--highlight-soft)]">
                  {errorMessage}
                </p>
              ) : null}
              <button className="w-full rounded-full bg-[var(--secondary)] py-4 font-black uppercase tracking-[0.16em] text-[var(--text-on-warm)]">
                {t("savePassword")}
              </button>
            </form>
          </>
        ) : null}

        {status === "success" ? (
          <div className="py-4">
            <CheckCircle2 size={42} className="text-[var(--highlight-soft)]" />
            <h1 className="mt-5 text-3xl font-black italic uppercase">
              {isReset ? t("resetSuccessTitle") : t("verificationSuccessTitle")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
              {isReset ? t("resetSuccessText") : t("verificationSuccessText")}
            </p>
            <Link
              href={`/${params.locale}`}
              className="mt-7 block rounded-full bg-[var(--secondary)] py-4 text-center font-black uppercase tracking-[0.16em] text-[var(--text-on-warm)]"
            >
              {t("continueToApp")}
            </Link>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="py-4">
            <ShieldCheck size={42} className="text-[var(--highlight-soft)]" />
            <h1 className="mt-5 text-3xl font-black italic uppercase">
              {t("linkErrorTitle")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
              {errorMessage}
            </p>
            <Link
              href={`/${params.locale}`}
              className="mt-7 block rounded-full border border-[var(--border-soft)] py-4 text-center font-black uppercase tracking-[0.16em]"
            >
              {t("backToApp")}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

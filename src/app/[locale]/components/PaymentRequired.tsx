"use client";

import { httpsCallable } from "firebase/functions";
import { CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { functions } from "../../../../firebase.config";
import type { MemberPackage } from "@/data";
import styles from "./AppShell.module.css";

interface PaymentRequiredProps {
  locale: string;
}

interface BillingSessionResult {
  url?: string;
}

const plans: MemberPackage[] = ["basic", "plus"];

export default function PaymentRequired({ locale }: PaymentRequiredProps) {
  const t = useTranslations("paymentRequired");
  const packages = useTranslations("packages");
  const [pendingPackage, setPendingPackage] = useState<MemberPackage | null>(null);
  const [error, setError] = useState("");

  const openCheckout = async (memberPackage: MemberPackage) => {
    if (pendingPackage) return;

    setPendingPackage(memberPackage);
    setError("");

    try {
      const createSession = httpsCallable<
        { locale: string; memberPackage: MemberPackage },
        BillingSessionResult
      >(functions, "createStripeCheckoutSession");
      const result = await createSession({ locale, memberPackage });

      if (!result.data.url) {
        throw new Error("Stripe session URL is missing.");
      }

      window.location.assign(result.data.url);
    } catch (checkoutError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Stripe checkout could not be opened from payment gate.", checkoutError);
      }

      setError(t("error"));
      setPendingPackage(null);
    }
  };

  return (
    <section className={styles.paymentGate} data-testid="payment-required">
      <div className={styles.paymentGateIntro}>
        <span className={styles.paymentGateIcon} aria-hidden="true">
          <ShieldCheck size={28} />
        </span>
        <p className={styles.paymentGateEyebrow}>{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </div>

      <div className={styles.paymentPlanGrid}>
        {plans.map((plan) => {
          const isPending = pendingPackage === plan;

          return (
            <article key={plan} className={styles.paymentPlanCard}>
              <div>
                <h2>{packages(plan)}</h2>
                <p>{t(`${plan}.description`)}</p>
              </div>
              <strong>{t(`${plan}.price`)}</strong>
              <button
                type="button"
                disabled={Boolean(pendingPackage)}
                onClick={() => void openCheckout(plan)}
              >
                {isPending ? <LoaderCircle className={styles.paymentSpinner} size={17} /> : <CreditCard size={17} />}
                {isPending ? t("processing") : t(`${plan}.action`)}
              </button>
            </article>
          );
        })}
      </div>

      {error ? <p className={styles.paymentError} role="alert">{error}</p> : null}
      <p className={styles.paymentGateNote}>{t("note")}</p>
    </section>
  );
}

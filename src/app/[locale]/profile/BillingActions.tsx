"use client";

import { CreditCard, LoaderCircle } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { functions } from "../../../../firebase.config";
import type { MemberPackage } from "@/data";
import type { SubscriptionStatus } from "@/lib/userProfile";
import styles from "./Profile.module.css";

const MANAGED_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  "active",
  "trialing",
  "past_due",
]);

interface BillingActionsProps {
  locale: string;
  subscriptionStatus: SubscriptionStatus;
  basicCheckoutLabel: string;
  plusCheckoutLabel: string;
  manageLabel: string;
  processingLabel: string;
  errorLabel: string;
  statusLabel: string;
}

interface BillingSessionResult {
  url?: string;
}

interface BillingPlan {
  id: MemberPackage;
  label: string;
}

export default function BillingActions({
  locale,
  subscriptionStatus,
  basicCheckoutLabel,
  plusCheckoutLabel,
  manageLabel,
  processingLabel,
  errorLabel,
  statusLabel,
}: BillingActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const hasManagedSubscription = MANAGED_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
  const plans: BillingPlan[] = [
    { id: "basic", label: basicCheckoutLabel },
    { id: "plus", label: plusCheckoutLabel },
  ];

  const openBillingSession = async (
    action: "checkout" | "portal",
    selectedPackage?: MemberPackage,
  ) => {
    if (isPending) return;

    setIsPending(true);
    setError("");

    try {
      const functionName = action === "checkout"
        ? "createStripeCheckoutSession"
        : "createStripeCustomerPortalSession";
      const createSession = httpsCallable<
        { locale: string; memberPackage?: MemberPackage },
        BillingSessionResult
      >(
        functions,
        functionName,
      );
      const payload = selectedPackage ? { locale, memberPackage: selectedPackage } : { locale };
      const result = await createSession(payload);

      if (!result.data.url) {
        throw new Error("Stripe session URL is missing.");
      }

      window.location.assign(result.data.url);
    } catch {
      setError(errorLabel);
      setIsPending(false);
    }
  };

  const buttonContent = (label: string) => (
    <>
      {isPending
        ? <LoaderCircle className={styles.billingSpinner} size={17} />
        : <CreditCard size={17} />}
      {isPending ? processingLabel : label}
    </>
  );

  return (
    <div className={styles.billingActions}>
      <p className={styles.billingStatus}>
        {statusLabel}: <strong>{subscriptionStatus}</strong>
      </p>
      {hasManagedSubscription ? (
        <button
          type="button"
          className={styles.billingButton}
          disabled={isPending}
          onClick={() => void openBillingSession("portal")}
        >
          {buttonContent(manageLabel)}
        </button>
      ) : (
        <div className={styles.billingPlanButtons}>
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className={styles.billingButton}
              disabled={isPending}
              onClick={() => void openBillingSession("checkout", plan.id)}
            >
              {buttonContent(plan.label)}
            </button>
          ))}
        </div>
      )}
      {error ? <p className={styles.billingError} role="alert">{error}</p> : null}
    </div>
  );
}

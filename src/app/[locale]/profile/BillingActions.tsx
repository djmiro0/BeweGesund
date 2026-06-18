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
  memberPackage: MemberPackage;
  subscriptionStatus: SubscriptionStatus;
  basicName: string;
  plusName: string;
  basicPrice: string;
  plusPrice: string;
  basicCheckoutLabel: string;
  plusCheckoutLabel: string;
  upgradeLabel: string;
  downgradeLabel: string;
  manageLabel: string;
  processingLabel: string;
  errorLabel: string;
  currentLabel: string;
  activeLabel: string;
  selectedLabel: string;
  statusLabel: string;
}

interface BillingSessionResult {
  url?: string;
}

interface BillingPlan {
  id: MemberPackage;
  name: string;
  price: string;
  checkoutLabel: string;
}

function getBillingErrorDetails(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as { code?: unknown; message?: unknown; details?: unknown };

    return {
      code: typeof maybeError.code === "string" ? maybeError.code : undefined,
      message: typeof maybeError.message === "string" ? maybeError.message : undefined,
      details: maybeError.details,
    };
  }

  return {
    message: error instanceof Error ? error.message : String(error),
  };
}

export default function BillingActions({
  locale,
  memberPackage,
  subscriptionStatus,
  basicName,
  plusName,
  basicPrice,
  plusPrice,
  basicCheckoutLabel,
  plusCheckoutLabel,
  upgradeLabel,
  downgradeLabel,
  manageLabel,
  processingLabel,
  errorLabel,
  currentLabel,
  activeLabel,
  selectedLabel,
  statusLabel,
}: BillingActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const hasManagedSubscription = MANAGED_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
  const plans: BillingPlan[] = [
    { id: "basic", name: basicName, price: basicPrice, checkoutLabel: basicCheckoutLabel },
    { id: "plus", name: plusName, price: plusPrice, checkoutLabel: plusCheckoutLabel },
  ];
  const currentPlan = plans.find((plan) => plan.id === memberPackage) ?? plans[0];

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
    } catch (billingError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Stripe billing session could not be opened.", getBillingErrorDetails(billingError));
      }

      setError(errorLabel);
      setIsPending(false);
    }
  };

  const buttonContent = (label: string, isLoading = isPending) => (
    <>
      {isLoading
        ? <LoaderCircle className={styles.billingSpinner} size={17} />
        : <CreditCard size={17} />}
      {isLoading ? processingLabel : label}
    </>
  );

  return (
    <div className={styles.billingActions}>
      <div className={styles.billingOverview}>
        <span>{currentLabel}: <strong>{currentPlan.name}</strong></span>
        <span>{statusLabel}: <strong>{subscriptionStatus}</strong></span>
      </div>
      <div className={styles.billingPlanGrid}>
        {plans.map((plan) => {
          const isCurrent = plan.id === memberPackage;
          const isAvailableChange = hasManagedSubscription && !isCurrent;
          const actionLabel = hasManagedSubscription
            ? plan.id === "plus" ? upgradeLabel : downgradeLabel
            : plan.checkoutLabel;
          const actionMode = hasManagedSubscription ? "portal" : "checkout";

          return (
            <article
              key={plan.id}
              className={`${styles.billingPlanCard} ${isCurrent ? styles.billingPlanCardCurrent : ""}`}
            >
              <div className={styles.billingPlanHeader}>
                <div>
                  <h3>{plan.name}</h3>
                  <p>{plan.price}</p>
                </div>
                {isCurrent ? (
                  <span className={styles.billingPlanBadge}>
                    {hasManagedSubscription ? activeLabel : selectedLabel}
                  </span>
                ) : null}
              </div>

              {isCurrent && hasManagedSubscription ? (
                <p className={styles.billingPlanNote}>{activeLabel}</p>
              ) : (
                <button
                  type="button"
                  className={`${styles.billingButton} ${isAvailableChange ? styles.billingButtonSecondary : ""}`}
                  disabled={isPending}
                  onClick={() => void openBillingSession(actionMode, actionMode === "checkout" ? plan.id : undefined)}
                >
                  {buttonContent(actionLabel)}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {hasManagedSubscription ? (
        <button
          type="button"
          className={`${styles.billingButton} ${styles.billingButtonSecondary}`}
          disabled={isPending}
          onClick={() => void openBillingSession("portal")}
        >
          {buttonContent(manageLabel, false)}
        </button>
      ) : null}
      {error ? <p className={styles.billingError} role="alert">{error}</p> : null}
    </div>
  );
}

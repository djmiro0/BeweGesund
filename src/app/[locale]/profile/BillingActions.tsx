"use client";

import { CreditCard, LoaderCircle, Repeat2 } from "lucide-react";
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
  inactiveLabel: string;
  activeLabel: string;
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

type PendingBillingAction =
  | { action: "checkout"; memberPackage: MemberPackage }
  | { action: "portal"; memberPackage?: MemberPackage }
  | null;

function getBillingErrorDetails(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
    };

    return {
      code: typeof maybeError.code === "string" ? maybeError.code : undefined,
      message:
        typeof maybeError.message === "string" ? maybeError.message : undefined,
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
  inactiveLabel,
  activeLabel,
}: BillingActionsProps) {
  const [pendingAction, setPendingAction] =
    useState<PendingBillingAction>(null);
  const [error, setError] = useState("");
  const hasManagedSubscription =
    MANAGED_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
  const plans: BillingPlan[] = [
    {
      id: "basic",
      name: basicName,
      price: basicPrice,
      checkoutLabel: basicCheckoutLabel,
    },
    {
      id: "plus",
      name: plusName,
      price: plusPrice,
      checkoutLabel: plusCheckoutLabel,
    },
  ];
  const currentPlan = hasManagedSubscription
    ? (plans.find((plan) => plan.id === memberPackage) ?? plans[0])
    : null;
  const availablePlans = hasManagedSubscription
    ? plans.filter((plan) => plan.id !== memberPackage)
    : plans;

  const openBillingSession = async (
    action: "checkout" | "portal",
    selectedPackage?: MemberPackage,
  ) => {
    if (pendingAction) return;

    setPendingAction(
      action === "checkout"
        ? { action, memberPackage: selectedPackage ?? "basic" }
        : { action, memberPackage: selectedPackage },
    );
    setError("");

    try {
      const functionName =
        action === "checkout"
          ? "createStripeCheckoutSession"
          : "createStripeCustomerPortalSession";
      const createSession = httpsCallable<
        { locale: string; memberPackage?: MemberPackage },
        BillingSessionResult
      >(functions, functionName);
      const payload =
        action === "checkout" && selectedPackage
          ? { locale, memberPackage: selectedPackage }
          : { locale };
      const result = await createSession(payload);

      if (!result.data.url) {
        throw new Error("Stripe session URL is missing.");
      }

      window.location.assign(result.data.url);
    } catch (billingError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Stripe billing session could not be opened.",
          getBillingErrorDetails(billingError),
        );
      }

      setError(errorLabel);
      setPendingAction(null);
    }
  };

  const buttonContent = (label: string, isLoading: boolean) => (
    <>
      {isLoading ? (
        <LoaderCircle className={styles.billingSpinner} size={17} />
      ) : (
        <CreditCard size={17} />
      )}
      {isLoading ? processingLabel : label}
    </>
  );

  return (
    <div className={styles.billingActions}>
      <div className={styles.billingStatusBand}>
        <div>
          <p>{currentLabel}</p>
          <strong>{currentPlan?.name ?? inactiveLabel}</strong>
          {currentPlan ? <small>{currentPlan.price}</small> : null}
        </div>
        {currentPlan ? <span>{activeLabel}</span> : null}
      </div>

      <div className={styles.billingPlanGrid}>
        {availablePlans.map((plan) => {
          const isButtonPending = pendingAction?.memberPackage === plan.id;
          const isDisabled = Boolean(pendingAction);
          const actionLabel = hasManagedSubscription
            ? plan.id === "plus"
              ? upgradeLabel
              : downgradeLabel
            : plan.checkoutLabel;
          const actionMode = hasManagedSubscription ? "portal" : "checkout";

          return (
            <article key={plan.id} className={styles.billingPlanCard}>
              <div className={styles.billingPlanHeader}>
                <div>
                  <h3>{plan.name}</h3>
                  <p>{plan.price}</p>
                </div>
              </div>

              <button
                type="button"
                className={`${styles.billingButton} ${hasManagedSubscription ? styles.billingButtonChange : ""}`}
                disabled={isDisabled}
                onClick={() => void openBillingSession(actionMode, plan.id)}
              >
                {buttonContent(actionLabel, isButtonPending)}
              </button>
            </article>
          );
        })}
      </div>
      {hasManagedSubscription ? (
        <button
          type="button"
          className={`${styles.billingButton} ${styles.billingButtonSecondary}`}
          disabled={Boolean(pendingAction)}
          onClick={() => void openBillingSession("portal")}
        >
          {pendingAction?.action === "portal" &&
          !pendingAction.memberPackage ? (
            <LoaderCircle className={styles.billingSpinner} size={17} />
          ) : (
            <Repeat2 size={17} />
          )}
          {pendingAction?.action === "portal" && !pendingAction.memberPackage
            ? processingLabel
            : manageLabel}
        </button>
      ) : null}
      {error ? (
        <p className={styles.billingError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

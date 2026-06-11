import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BillingActions from "./BillingActions";

const mocks = vi.hoisted(() => ({
  callable: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("../../../../firebase.config", () => ({
  functions: {},
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: mocks.httpsCallable,
}));

const labels = {
  locale: "en",
  basicCheckoutLabel: "Choose Basic · €9.99/month",
  plusCheckoutLabel: "Choose Plus · €12.99/month",
  manageLabel: "Manage billing",
  processingLabel: "Opening Stripe",
  errorLabel: "Billing failed",
  statusLabel: "Subscription status",
};

describe("BillingActions", () => {
  beforeEach(() => {
    mocks.callable.mockReset();
    mocks.httpsCallable.mockReset();
    mocks.httpsCallable.mockReturnValue(mocks.callable);
  });

  it.each([
    ["Choose Basic · €9.99/month", "basic"],
    ["Choose Plus · €12.99/month", "plus"],
  ] as const)("starts checkout for the %s plan", async (buttonLabel, memberPackage) => {
    const user = userEvent.setup();
    mocks.callable.mockResolvedValue({ data: {} });

    render(
      <BillingActions
        {...labels}
        subscriptionStatus="free"
      />,
    );
    await user.click(screen.getByRole("button", { name: buttonLabel }));

    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "createStripeCheckoutSession");
    expect(mocks.callable).toHaveBeenCalledWith({ locale: "en", memberPackage });
    expect(screen.getByRole("alert")).toHaveTextContent("Billing failed");
  });

  it("opens billing management for an active member", async () => {
    const user = userEvent.setup();
    mocks.callable.mockResolvedValue({ data: {} });

    render(
      <BillingActions
        {...labels}
        subscriptionStatus="active"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Manage billing" }));

    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "createStripeCustomerPortalSession");
    expect(mocks.callable).toHaveBeenCalledWith({ locale: "en" });
  });
});

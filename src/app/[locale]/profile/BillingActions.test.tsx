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
  memberPackage: "basic" as const,
  basicName: "Basic",
  plusName: "Plus",
  basicPrice: "€9.99/month",
  plusPrice: "€12.99/month",
  basicCheckoutLabel: "Choose Basic",
  plusCheckoutLabel: "Choose Plus",
  upgradeLabel: "Upgrade to Plus",
  downgradeLabel: "Switch to Basic",
  manageLabel: "Manage billing",
  processingLabel: "Opening Stripe",
  errorLabel: "Billing failed",
  currentLabel: "Current package",
  activeLabel: "Active",
  selectedLabel: "Selected",
  statusLabel: "Subscription status",
};

describe("BillingActions", () => {
  beforeEach(() => {
    mocks.callable.mockReset();
    mocks.httpsCallable.mockReset();
    mocks.httpsCallable.mockReturnValue(mocks.callable);
  });

  it.each([
    ["Choose Basic", "basic"],
    ["Choose Plus", "plus"],
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

  it("offers a Plus upgrade and billing management for active Basic members", async () => {
    const user = userEvent.setup();
    mocks.callable.mockResolvedValue({ data: {} });

    render(
      <BillingActions
        {...labels}
        memberPackage="basic"
        subscriptionStatus="active"
      />,
    );

    expect(screen.getByRole("button", { name: "Manage billing" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upgrade to Plus" }));

    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "createStripeCustomerPortalSession");
    expect(mocks.callable).toHaveBeenCalledWith({ locale: "en" });
  });

  it("offers a Basic downgrade and billing management for active Plus members", async () => {
    const user = userEvent.setup();
    mocks.callable.mockResolvedValue({ data: {} });

    render(
      <BillingActions
        {...labels}
        memberPackage="plus"
        subscriptionStatus="active"
      />,
    );

    expect(screen.getByRole("button", { name: "Manage billing" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Switch to Basic" }));

    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "createStripeCustomerPortalSession");
    expect(mocks.callable).toHaveBeenCalledWith({ locale: "en" });
  });

  it("shows the billing error when the callable fails", async () => {
    const user = userEvent.setup();
    mocks.callable.mockRejectedValue(new Error("App Check rejected"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <BillingActions
        {...labels}
        subscriptionStatus="free"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Choose Basic" }));

    expect(mocks.httpsCallable).toHaveBeenCalledWith({}, "createStripeCheckoutSession");
    expect(screen.getByRole("alert")).toHaveTextContent("Billing failed");
    expect(console.warn).toHaveBeenCalledWith(
      "Stripe billing session could not be opened.",
      expect.objectContaining({ message: "App Check rejected" }),
    );
  });
});

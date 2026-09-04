"use client";

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../../../firebase.config";
import AuthModal from "./AuthModal";
import { AuthProvider, useAuth } from "./AuthProvider";
import ComingSoon from "./ComingSoon";
import CookieConsentBanner from "./CookieConsentBanner";
import LoadingScreen from "./LoadingScreen";
import MobileTabBar from "./MobileTabBar";
import NavigationFeedback from "./NavigationFeedback";
import PageMediaGate from "./PageMediaGate";
import PaymentRequired from "./PaymentRequired";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./ThemeProvider";
import { getAuthUserPhotoURL, getProfileFirstName } from "@/lib/userProfile";
import { isComingSoonEnabled } from "@/lib/launchFlags";
import styles from "./AppShell.module.css";

const paidAccessRoutes = ["courses", "calendar", "consultation"];
const APPLIED_THEME_KEY = "sbewegesund-applied-profile-theme";

function isPaidAccessRoute(pathname: string, locale: string) {
  const localizedPath = `/${locale}`;

  return paidAccessRoutes.some(
    (route) =>
      pathname === `${localizedPath}/${route}` ||
      pathname.startsWith(`${localizedPath}/${route}/`),
  );
}

export function AppPreferenceEffects() {
  const { user, appPreferences } = useAuth();
  const { setThemePreference } = useTheme();

  useEffect(() => {
    if (!user) {
      window.sessionStorage.removeItem(APPLIED_THEME_KEY);
      return;
    }

    const themeKey = `${user.uid}:${appPreferences.theme}`;
    if (window.sessionStorage.getItem(APPLIED_THEME_KEY) !== themeKey) {
      window.sessionStorage.setItem(APPLIED_THEME_KEY, themeKey);
      setThemePreference(appPreferences.theme);
    }
  }, [appPreferences.theme, setThemePreference, user]);

  return null;
}

export function CheckoutReturnSync() {
  const { user } = useAuth();
  const processedSessionRef = useRef<string | null>(null);
  const processedCancellationRef = useRef(false);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const checkoutStatus = url.searchParams.get("checkout");
    const sessionId = url.searchParams.get("session_id");

    if (checkoutStatus === "canceled") {
      if (processedCancellationRef.current) return;
      processedCancellationRef.current = true;

      const deleteAccount = httpsCallable<
        Record<string, never>,
        { ok: boolean }
      >(functions, "deleteUserAccount");

      void deleteAccount({})
        .catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "Canceled Stripe checkout account cleanup failed.",
              error,
            );
          }
        })
        .finally(() => {
          void signOut(auth).finally(() => {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("checkout");
            cleanUrl.searchParams.delete("session_id");
            window.history.replaceState(
              null,
              "",
              `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
            );
          });
        });
      return;
    }

    if (checkoutStatus !== "success" || !sessionId) return;
    if (processedSessionRef.current === sessionId) return;

    processedSessionRef.current = sessionId;

    const confirmSession = httpsCallable<
      { sessionId: string },
      { ok: boolean }
    >(functions, "confirmStripeCheckoutSession");

    void confirmSession({ sessionId })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "Stripe checkout session could not be confirmed.",
            error,
          );
        }
      })
      .finally(() => {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("checkout");
        cleanUrl.searchParams.delete("session_id");
        window.history.replaceState(
          null,
          "",
          `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
        );
      });
  }, [user]);

  return null;
}

export function ShellFrame({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const {
    user,
    profile,
    loading,
    isAuthOpen,
    isCheckoutRedirecting,
    openAuth,
    closeAuth,
    beginCheckoutRedirect,
    cancelCheckoutRedirect,
  } = useAuth();
  const paymentT = useTranslations("paymentRequired");
  const pathname = usePathname();
  const isAuthActionRoute = pathname.startsWith(`/${locale}/auth/action`);
  const isGoogleUser =
    user?.providerData.some(
      (provider) => provider.providerId === "google.com",
    ) ?? false;
  const requiresProfileSetup = Boolean(
    user &&
    isGoogleUser &&
    profile &&
    (!profile.email ||
      !profile.firstName ||
      !profile.lastName ||
      !profile.age ||
      !profile.gender ||
      !profile.heightCm ||
      !profile.weightKg ||
      !profile.regionKey),
  );
  const hasActiveSubscription =
    profile?.subscriptionStatus === "active" ||
    profile?.subscriptionStatus === "trialing";
  const requiresPayment = Boolean(
    user &&
    profile &&
    !requiresProfileSetup &&
    !hasActiveSubscription &&
    isPaidAccessRoute(pathname, locale),
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (isCheckoutRedirecting) {
    return <LoadingScreen text={paymentT("processing")} />;
  }

  const showComingSoon = isComingSoonEnabled();

  if (!user && !isAuthActionRoute && showComingSoon) {
    return (
      <PageMediaGate contentKey="coming-soon">
        <PwaInstallPrompt />
        <Header
          locale={locale}
          user={null}
          openAuth={openAuth}
          launchMode={showComingSoon}
        />
        <ComingSoon openAuth={openAuth} />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={closeAuth}
          onCheckoutRedirectStart={beginCheckoutRedirect}
          onCheckoutRedirectError={cancelCheckoutRedirect}
        />
        <NavigationFeedback />
        <CookieConsentBanner locale={locale} />
      </PageMediaGate>
    );
  }

  if (requiresProfileSetup) {
    return (
      <PageMediaGate contentKey="profile-setup">
        <PwaInstallPrompt />
        <Header
          locale={locale}
          user={user}
          profileName={
            profile ? getProfileFirstName(profile, user?.displayName) : null
          }
          profilePhoto={getAuthUserPhotoURL(user) ?? profile?.photoURL}
          openAuth={openAuth}
        />
        <AuthModal
          isOpen
          onClose={closeAuth}
          requiresProfileSetup
          onCheckoutRedirectStart={beginCheckoutRedirect}
          onCheckoutRedirectError={cancelCheckoutRedirect}
        />
        <NavigationFeedback />
        <CookieConsentBanner locale={locale} />
      </PageMediaGate>
    );
  }

  if (requiresPayment) {
    return (
      <PageMediaGate contentKey="payment-required">
        <PwaInstallPrompt />
        <Header
          locale={locale}
          user={user}
          profileName={
            profile ? getProfileFirstName(profile, user?.displayName) : null
          }
          profilePhoto={getAuthUserPhotoURL(user) ?? profile?.photoURL}
          openAuth={openAuth}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={closeAuth}
          onCheckoutRedirectStart={beginCheckoutRedirect}
          onCheckoutRedirectError={cancelCheckoutRedirect}
        />
        <NavigationFeedback />
        <main className={styles.main}>
          <PaymentRequired locale={locale} />
        </main>
        <Footer />
        <CookieConsentBanner locale={locale} />
      </PageMediaGate>
    );
  }

  return (
    <PageMediaGate contentKey={user?.uid ?? "public"}>
      <PwaInstallPrompt />
      <Header
        locale={locale}
        user={user}
        profileName={
          profile ? getProfileFirstName(profile, user?.displayName) : null
        }
        profilePhoto={getAuthUserPhotoURL(user) ?? profile?.photoURL}
        openAuth={openAuth}
      />
      <AuthModal
        isOpen={isAuthOpen || requiresProfileSetup}
        onClose={closeAuth}
        requiresProfileSetup={requiresProfileSetup}
        onCheckoutRedirectStart={beginCheckoutRedirect}
        onCheckoutRedirectError={cancelCheckoutRedirect}
      />
      <NavigationFeedback />
      <main className={styles.main}>{children}</main>
      <MobileTabBar locale={locale} />
      <Footer />
      <CookieConsentBanner locale={locale} />
    </PageMediaGate>
  );
}

export default function AppShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppPreferenceEffects />
        <CheckoutReturnSync />
        <ShellFrame locale={locale}>{children}</ShellFrame>
      </ThemeProvider>
    </AuthProvider>
  );
}

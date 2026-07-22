"use client";

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { usePathname } from "next/navigation";
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
import PaymentRequired from "./PaymentRequired";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./ThemeProvider";
import { getAuthUserPhotoURL, getProfileFirstName } from "@/lib/userProfile";
import { isComingSoonEnabled } from "@/lib/launchFlags";
import styles from "./AppShell.module.css";

const paidAccessRoutes = ["courses", "calendar", "consultation"];

function isPaidAccessRoute(pathname: string, locale: string) {
  const localizedPath = `/${locale}`;

  return paidAccessRoutes.some((route) => (
    pathname === `${localizedPath}/${route}` || pathname.startsWith(`${localizedPath}/${route}/`)
  ));
}

export function AppPreferenceEffects() {
  const { user, appPreferences } = useAuth();
  const { setThemePreference } = useTheme();
  const lastAppliedThemeKey = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      lastAppliedThemeKey.current = null;
      return;
    }

    const themeKey = `${user.uid}:${appPreferences.theme}`;
    if (lastAppliedThemeKey.current !== themeKey) {
      lastAppliedThemeKey.current = themeKey;
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

      const deleteAccount = httpsCallable<Record<string, never>, { ok: boolean }>(
        functions,
        "deleteUserAccount",
      );

      void deleteAccount({})
        .catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Canceled Stripe checkout account cleanup failed.", error);
          }
        })
        .finally(() => {
          void signOut(auth).finally(() => {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("checkout");
            cleanUrl.searchParams.delete("session_id");
            window.history.replaceState(null, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
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
          console.warn("Stripe checkout session could not be confirmed.", error);
        }
      })
      .finally(() => {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("checkout");
        cleanUrl.searchParams.delete("session_id");
        window.history.replaceState(null, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
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
  const { user, profile, loading, isAuthOpen, openAuth, closeAuth } = useAuth();
  const pathname = usePathname();
  const isAuthActionRoute = pathname.startsWith(`/${locale}/auth/action`);
  const isGoogleUser = user?.providerData.some((provider) => provider.providerId === "google.com") ?? false;
  const requiresProfileSetup = Boolean(
    user
      && isGoogleUser
      && profile
      && (
        !profile.email
        || !profile.firstName
        || !profile.lastName
        || !profile.age
        || !profile.gender
        || !profile.heightCm
        || !profile.weightKg
        || !profile.regionKey
      ),
  );
  const hasActiveSubscription =
    profile?.subscriptionStatus === "active" || profile?.subscriptionStatus === "trialing";
  const requiresPayment = Boolean(
    user
      && profile
      && !requiresProfileSetup
      && !hasActiveSubscription
      && isPaidAccessRoute(pathname, locale),
  );

  if (loading) {
    return <LoadingScreen />;
  }

  const showComingSoon = isComingSoonEnabled();

  if (!user && !isAuthActionRoute && showComingSoon) {
    return (
      <>
        <PwaInstallPrompt />
        <Header
          locale={locale}
          user={null}
          openAuth={openAuth}
          launchMode={showComingSoon}
        />
        <ComingSoon openAuth={openAuth} />
        <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
        <NavigationFeedback />
        <CookieConsentBanner locale={locale} />
      </>
    );
  }

  if (requiresProfileSetup) {
    return (
      <>
        <PwaInstallPrompt />
        <Header
          locale={locale}
          user={user}
          profileName={profile ? getProfileFirstName(profile, user?.displayName) : null}
          profilePhoto={getAuthUserPhotoURL(user) ?? profile?.photoURL}
          openAuth={openAuth}
        />
        <AuthModal
          isOpen
          onClose={closeAuth}
          requiresProfileSetup
        />
        <NavigationFeedback />
        <CookieConsentBanner locale={locale} />
      </>
    );
  }

  if (requiresPayment) {
    return (
      <>
        <PwaInstallPrompt />
        <Header
          locale={locale}
          user={user}
          profileName={profile ? getProfileFirstName(profile, user?.displayName) : null}
          profilePhoto={getAuthUserPhotoURL(user) ?? profile?.photoURL}
          openAuth={openAuth}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={closeAuth}
        />
        <NavigationFeedback />
        <main className={styles.main}>
          <PaymentRequired locale={locale} />
        </main>
        <Footer />
        <CookieConsentBanner locale={locale} />
      </>
    );
  }

  return (
    <>
      <PwaInstallPrompt />
      <Header
        locale={locale}
        user={user}
        profileName={profile ? getProfileFirstName(profile, user?.displayName) : null}
        profilePhoto={getAuthUserPhotoURL(user) ?? profile?.photoURL}
        openAuth={openAuth}
      />
      <AuthModal
        isOpen={isAuthOpen || requiresProfileSetup}
        onClose={closeAuth}
        requiresProfileSetup={requiresProfileSetup}
      />
      <NavigationFeedback />
      <main className={styles.main}>{children}</main>
      <MobileTabBar locale={locale} />
      <Footer />
      <CookieConsentBanner locale={locale} />
    </>
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

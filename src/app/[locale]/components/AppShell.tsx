"use client";

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import AuthModal from "./AuthModal";
import { AuthProvider, useAuth } from "./AuthProvider";
import ComingSoon from "./ComingSoon";
import MobileTabBar from "./MobileTabBar";
import ProgressPhotoReminder from "./ProgressPhotoReminder";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./ThemeProvider";
import { getAuthUserPhotoURL, getProfileFirstName } from "@/lib/userProfile";
import styles from "./AppShell.module.css";

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

export function ShellFrame({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const t = useTranslations("home");
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

  if (loading) {
    return (
      <main className={styles.loadingScreen}>
        <div className={styles.loadingMark} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className={styles.loadingKicker}>BeweGesund</p>
        <p className={styles.loadingText}>{t("loading")}</p>
      </main>
    );
  }

  if (!user && !isAuthActionRoute) {
    return (
      <>
        <PwaInstallPrompt />
        <Header
          locale={locale}
          user={null}
          openAuth={openAuth}
          launchMode
        />
        <ComingSoon openAuth={openAuth} />
        <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
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
      <ProgressPhotoReminder />
      <main className={styles.main}>{children}</main>
      <MobileTabBar locale={locale} user={user} openAuth={openAuth} />
      <Footer />
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
        <ShellFrame locale={locale}>{children}</ShellFrame>
      </ThemeProvider>
    </AuthProvider>
  );
}

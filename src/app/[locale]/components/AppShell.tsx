"use client";

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import { AuthProvider, useAuth } from "./AuthProvider";
import ComingSoon from "./ComingSoon";
import MobileTabBar from "./MobileTabBar";
import { ThemeProvider } from "./ThemeProvider";
import { getProfileFirstName } from "@/lib/userProfile";
import styles from "./AppShell.module.css";

function ShellFrame({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const { user, profile, loading, isAuthOpen, openAuth, closeAuth } = useAuth();
  const pathname = usePathname();
  const isPublicHomeRoute = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isPublicBlogRoute = pathname.startsWith(`/${locale}/blogs`);
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
        <p className={styles.loadingText}>...</p>
      </main>
    );
  }

  if (!user && !isPublicHomeRoute && !isPublicBlogRoute && !isAuthActionRoute) {
    return (
      <>
        <ComingSoon openAuth={openAuth} />
        <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
      </>
    );
  }

  return (
    <>
      <Header
        locale={locale}
        user={user}
        profileName={profile ? getProfileFirstName(profile, user?.displayName) : null}
        profilePhoto={profile?.photoURL ?? user?.photoURL}
        openAuth={openAuth}
      />
      <AuthModal
        isOpen={isAuthOpen || requiresProfileSetup}
        onClose={closeAuth}
        requiresProfileSetup={requiresProfileSetup}
      />
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
    <ThemeProvider>
      <AuthProvider>
        <ShellFrame locale={locale}>{children}</ShellFrame>
      </AuthProvider>
    </ThemeProvider>
  );
}

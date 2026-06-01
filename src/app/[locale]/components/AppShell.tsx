"use client";

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import AuthModal from "./AuthModal";
import { AuthProvider, useAuth } from "./AuthProvider";
import ComingSoon from "./ComingSoon";
import MobileTabBar from "./MobileTabBar";
import { ThemeProvider } from "./ThemeProvider";
import styles from "./AppShell.module.css";

function ShellFrame({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const { user, loading, isAuthOpen, openAuth, closeAuth } = useAuth();

  if (loading) {
    return <main className={styles.loadingScreen}>Loading</main>;
  }

  if (!user) {
    return (
      <>
        <ComingSoon openAuth={openAuth} />
        <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
      </>
    );
  }

  return (
    <>
      <Header locale={locale} user={user} openAuth={openAuth} />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
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

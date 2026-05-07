"use client";

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import AuthModal from "./AuthModal";
import { AuthProvider, useAuth } from "./AuthProvider";

function ShellFrame({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const { user, isAuthOpen, openAuth, closeAuth } = useAuth();

  return (
    <>
      <Header locale={locale} user={user} openAuth={openAuth} />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
      <main>{children}</main>
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
      <ShellFrame locale={locale}>{children}</ShellFrame>
    </AuthProvider>
  );
}

"use client";
import { useTranslations } from "next-intl";

export default function Header() {
  const t = useTranslations("header");

  const handleSignIn = () => {
    // Add your auth logic here (Firebase Auth, etc.)
    alert("Sign in clicked");
  };

  return (
    <header className="header">
      <div className="logo">{t("logo")}</div>
      <nav className="nav">
        <a href="#kurse">{t("nav.kurse")}</a>
        <a href="#community">{t("nav.community")}</a>
        <a href="#ernaehrung">{t("nav.ernaehrung")}</a>
      </nav>
      <button className="sign-in-btn" onClick={handleSignIn}>
        {t("signIn")}
      </button>
    </header>
  );
}

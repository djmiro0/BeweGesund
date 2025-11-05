"use client";
import { useTranslations } from "next-intl";
import style from "./Header.module.css"

export default function Header() {
  const t = useTranslations("header");

  const handleSignIn = () => {
    // Add your auth logic here (Firebase Auth, etc.)
    alert("Sign in clicked");
  };

  return (
    <header className={style.header}>
      <div className={style.logo}>{t("logo")}</div>
      <nav className={style.nav}>
        <a href="#kurse">{t("nav.kurse")}</a>
        <a href="#community">{t("nav.community")}</a>
        <a href="#ernaehrung">{t("nav.ernaehrung")}</a>
      </nav>
      <button className={style.signInBtn} onClick={handleSignIn}>
        {t("signIn")}
      </button>
    </header>
  );
}

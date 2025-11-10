"use client";

import { useTranslations } from "next-intl";
import style from "./Header.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  toggleLanguage: () => void;
  locale: "en" | "de";
}

const Header: React.FC<HeaderProps> = ({ toggleLanguage, locale }) => {
  const t = useTranslations("header");
  const handleSignIn = () => {
    alert("Sign in clicked");
  };

  const router = useRouter()

const handleLanguageChange = () => {
  router.push(`/${locale}`)
  toggleLanguage()
}

  return (
    <header className={style.header}>
      <div className={style.logo}>{t("logo")}</div>
     
<nav className={style.nav}>
  <a href="#courses">{t("nav.courses")}</a>
  <a href="#community">{t("nav.community")}</a>
  <a href="#nutrition">{t("nav.nutrition")}</a>
  <Link href={`${locale}/about`} className={style.link}>
    {t("nav.about")}
  </Link>
</nav>

      <div className={style.actions}>
        <button className={style.signInBtn} onClick={handleSignIn}>
          {t("signIn")}
        </button>

        <button className={style.langBtn} onClick={handleLanguageChange}>
          {locale === "de" ? "DE" : "EN"}
        </button>
      </div>
    </header>
  );
};

export default Header;

"use client";

import { useTranslations } from "next-intl";
import style from "./Header.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  locale: string;
}

const Header: React.FC<HeaderProps> = ({  locale }) => {
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();

  const otherLocale = locale === "en" ? "de" : "en";

  const handleSignIn = () => {
    alert("Sign in clicked");
  };

  const handleLanguageChange = () => {
    // Switch locale while preserving current path
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
    router.push(newPath);
  };

  return (
    <header className={style.header}>
             <Link href={`/${locale}`} className={style.link}>
 <div className={style.logo}>{t("logo")}</div>
        </Link>

      <nav className={style.nav}>
        {/* Use Link for SPA-like navigation and include locale */}
        <Link href={`/${locale}/courses`} className={style.link}>
          {t("nav.courses")}
        </Link>
        <Link href={`/${locale}#community`} className={style.link}>
          {t("nav.community")}
        </Link>
        <Link href={`/${locale}#nutrition`} className={style.link}>
          {t("nav.nutrition")}
        </Link>
        <Link href={`/${locale}/about`} className={style.link}>
          {t("nav.about")}
        </Link>
      </nav>

      <div className={style.actions}>
        <button className={style.signInBtn} onClick={handleSignIn}>
          {t("signIn")}
        </button>

        <button className={style.langBtn} onClick={handleLanguageChange}>
          {otherLocale.toUpperCase()}
        </button>
      </div>
    </header>
  );
};

export default Header;

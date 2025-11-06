"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Home, Info, Dumbbell } from "lucide-react"; // ✅ added Lucide icons
import style from "./Footer.module.css";

const Footer: React.FC = () => {
  const t = useTranslations("footer");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <footer className={style.footerTab}>
        <a href="#home" className={style.tab}>
          <Home size={22} className={style.icon} />
          <span className={style.label}>{t("home")}</span>
        </a>
        <a href="#about" className={style.tab}>
          <Info size={22} className={style.icon} />
          <span className={style.label}>{t("about")}</span>
        </a>
        <a href="#join" className={style.tab}>
          <Dumbbell size={22} className={style.icon} />
          <span className={style.label}>{t("join")}</span>
        </a>
      </footer>
    );
  }

  return <footer className={style.footer}>{t("copyright")}</footer>;
};

export default Footer;

"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
      <footer className="footer-tab">
        <a href="#home" className="tab">
          <span className="icon">🏠</span>
          <span className="label">{t("home")}</span>
        </a>
        <a href="#about" className="tab">
          <span className="icon">ℹ️</span>
          <span className="label">{t("about")}</span>
        </a>
        <a href="#join" className="tab">
          <span className="icon">💪</span>
          <span className="label">{t("join")}</span>
        </a>
      </footer>
    );
  }

  return <footer className="footer">{t("copyright")}</footer>;
};

export default Footer;

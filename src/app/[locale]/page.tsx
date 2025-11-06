"use client";

import { useState } from "react";
import { I18nProvider } from "./i18n";
import Header from "../components/Header/Header";
import Section from "../components/Section/Section";
import Footer from "../components/Footer/Footer";
import BannerSection from "../components/BannerSection/BannerSection";

import enMessages from "../../../locales/en.json";
import deMessages from "../../../locales/de.json";

export default function Home() {
  const [locale, setLocale] = useState<"en" | "de">("en");

  const messages = locale === "en" ? enMessages : deMessages;

  const toggleLanguage = () => setLocale((prev) => (prev === "en" ? "de" : "en"));

  return (
    <I18nProvider locale={locale} messages={messages}>
      <Header toggleLanguage={toggleLanguage} locale={locale} />
      <main>
        <BannerSection />
        <Section id="kurse" />
        <Section id="community" reverse />
        <Section id="ernaehrung" />
      </main>
      <Footer />
    </I18nProvider>
  );
}

import { I18nProvider } from "./i18n";
import Header from "./components/Header/Header";
import Section from "./components/Section/Section";
import Footer from "./components/Footer/Footer";

import enMessages from "../../locales/en.json"
import deMessages from "../../locales/de.json"

export default function Home() {
  const locale = "en"; // or "de"
  const messages = locale === "en" ? enMessages : deMessages;

  return (
    <I18nProvider locale={locale} messages={messages}>
      <Header />
      <main>
        <Section id="kurse" />
        <Section id="community" reverse />
        <Section id="ernaehrung" />
      </main>
      <Footer />
    </I18nProvider>
  );
}

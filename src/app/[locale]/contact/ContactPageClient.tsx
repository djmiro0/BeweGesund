"use client";

import { FormEvent, useState } from "react";
import { CalendarCheck2, Mail, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "../components/AuthProvider";
import styles from "./ContactPage.module.css";

interface ContactPageClientProps {
  bookingUrl: string | null;
}

export default function ContactPageClient({ bookingUrl }: ContactPageClientProps) {
  const t = useTranslations("contactPage");
  const locale = useLocale();
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? profile?.email ?? "");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("consultation");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, topic, message, locale, website }),
      });
      const payload = (await response.json()) as { code?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.code === "CONTACT_NOT_CONFIGURED" ? "not-configured" : "delivery");
      }

      setMessage("");
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error && error.message === "not-configured"
        ? t("form.notConfigured")
        : t("form.error"));
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p>{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <span>{t("intro")}</span>
        </header>

        <div className={styles.grid}>
          <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
            <div className={styles.formHeader}>
              <Mail size={22} />
              <div>
                <h2>{t("form.title")}</h2>
                <p>{t("form.description")}</p>
              </div>
            </div>

            <div className={styles.fieldGrid}>
              <label>
                <span>{t("form.name")}</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} />
              </label>
              <label>
                <span>{t("form.email")}</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
              </label>
              <label>
                <span>{t("form.phone")}</span>
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={60} />
              </label>
              <label>
                <span>{t("form.topic")}</span>
                <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                  <option value="consultation">{t("form.topics.consultation")}</option>
                  <option value="courses">{t("form.topics.courses")}</option>
                  <option value="business">{t("form.topics.business")}</option>
                  <option value="other">{t("form.topics.other")}</option>
                </select>
              </label>
            </div>

            <label className={styles.messageField}>
              <span>{t("form.message")}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                minLength={10}
                maxLength={5000}
                rows={7}
              />
            </label>

            <label className={styles.honeypot} aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>

            {status === "success" ? <p className={styles.success} role="status">{t("form.success")}</p> : null}
            {status === "error" ? <p className={styles.error} role="alert">{errorMessage}</p> : null}

            <button type="submit" disabled={status === "sending"}>
              <Send size={17} />
              {status === "sending" ? t("form.sending") : t("form.submit")}
            </button>
          </form>

          <aside className={styles.side}>
            <div className={styles.bookingCard}>
              <CalendarCheck2 size={28} />
              <p>{t("booking.eyebrow")}</p>
              <h2>{t("booking.title")}</h2>
              <span>{t("booking.description")}</span>
              {bookingUrl ? (
                <a href={bookingUrl} target="_blank" rel="noreferrer">
                  {t("booking.action")}
                </a>
              ) : (
                <small>{t("booking.unavailable")}</small>
              )}
            </div>

            <div className={styles.infoList}>
              {(t.raw("cards") as Array<{ title: string; body: string }>).map((card) => (
                <article key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

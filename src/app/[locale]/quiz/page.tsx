import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizClient from "./QuizClient";
import styles from "./Quiz.module.css";

const copy = {
  de: {
    backLabel: "Zurück zur Übersicht",
  },
  en: {
    backLabel: "Back to overview",
  },
} as const;

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ mode?: string; autostart?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const labels = locale === "de" ? copy.de : copy.en;
  const isGameMode = query?.mode === "game";
  const shouldAutoStart = isGameMode && query?.autostart === "1";

  return (
    <main
      className={`${styles.quizPage} ${isGameMode ? styles.quizGamePage : ""}`}
    >
      <Link href={`/${locale}`} className={styles.backToOverview}>
        <ArrowLeft size={18} />
        {labels.backLabel}
      </Link>

      <QuizClient
        locale={locale}
        gameMode={isGameMode}
        autoStart={shouldAutoStart}
      />
    </main>
  );
}

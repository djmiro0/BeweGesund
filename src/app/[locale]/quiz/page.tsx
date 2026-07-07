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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const labels = locale === "de" ? copy.de : copy.en;

  return (
    <main className={styles.quizPage}>
      <Link href={`/${locale}`} className={styles.backToOverview}>
        <ArrowLeft size={18} />
        {labels.backLabel}
      </Link>

      <QuizClient locale={locale} />
    </main>
  );
}

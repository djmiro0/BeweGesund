import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Crown, Timer, Trophy } from "lucide-react";
import QuizClient from "./QuizClient";
import styles from "./Quiz.module.css";

const copy = {
  de: {
    backLabel: "Zu den Artikeln",
    eyebrow: "BeWeGesund Challenges",
    title: "Fitness-Quiz, Punkte und Monats-Champions.",
    intro:
      "Hier entsteht der spielerische Wissensbereich: Punkte kommen nicht nur aus Videos, sondern auch aus gelesenen Artikeln, Gesundheitswissen und zeitlich begrenzten Quiz-Runden.",
    primaryCta: "Artikel lesen",
    liveTitle: "Monatlicher 24h Quiz",
    liveText:
      "Einmal im Monat öffnet eine Challenge für 24 Stunden. Die Rangliste bewertet richtige Antworten und Antwortgeschwindigkeit.",
    blogTitle: "Blog-Wissen wird spielbar",
    blogText:
      "Nach Artikeln führen kurze Fragen zurück in die Challenge. So wird Lesen zu echtem Fortschritt.",
    championsTitle: "Monats-Champion",
    championsText:
      "Die besten drei Profile erhalten monatlich eine sichtbare Krone neben dem Namen.",
    leaderboardTitle: "Monatsrangliste Preview",
    rank: "Rang",
    player: "Profil",
    score: "Punkte",
    champion: "Monats-Champion",
    stats: ["24h verfügbar", "Speed + Accuracy", "Top 3 mit Krone"],
  },
  en: {
    backLabel: "Read articles",
    eyebrow: "BeWeGesund Challenges",
    title: "Fitness quiz, points, and monthly champions.",
    intro:
      "This is the playful knowledge area: points will come from videos, read articles, wellness knowledge, and time-boxed quiz rounds.",
    primaryCta: "Read articles",
    liveTitle: "Monthly 24h quiz",
    liveText:
      "Once a month a challenge opens for 24 hours. The leaderboard rewards correct answers and response speed.",
    blogTitle: "Blog knowledge becomes playable",
    blogText:
      "Short questions after articles lead back into the challenge, turning reading into real progress.",
    championsTitle: "Champion of the month",
    championsText:
      "The best three profiles receive a visible crown next to their name each month.",
    leaderboardTitle: "Monthly leaderboard preview",
    rank: "Rank",
    player: "Profile",
    score: "Points",
    champion: "Champion of the month",
    stats: ["24h window", "Speed + accuracy", "Top 3 crowned"],
  },
} as const;

const leaderboard = [
  { name: "Mira", region: "Berlin", points: 1280 },
  { name: "Djo", region: "Hamburg", points: 1175 },
  { name: "Lea", region: "Köln", points: 1090 },
  { name: "Samir", region: "München", points: 980 },
];

export default async function QuizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const labels = locale === "de" ? copy.de : copy.en;
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  return (
    <main className={styles.quizPage}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{labels.eyebrow}</p>
          <h1>{labels.title}</h1>
          <p>{labels.intro}</p>
          <div className={styles.heroActions}>
            <Link href={`/${locale}/blogs`} className={styles.primaryLink}>
              {labels.primaryCta}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className={styles.heroCard} aria-label={labels.leaderboardTitle}>
          <div className={styles.heroCardIcon}>
            <Brain size={30} />
          </div>
          {labels.stats.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className={styles.featureGrid} aria-label="Quiz formats">
        <article className={styles.featureCard}>
          <Timer size={26} />
          <h2>{labels.liveTitle}</h2>
          <p>{labels.liveText}</p>
        </article>
        <article className={styles.featureCard}>
          <BookOpen size={26} />
          <h2>{labels.blogTitle}</h2>
          <p>{labels.blogText}</p>
        </article>
        <article className={styles.featureCard}>
          <Crown size={26} />
          <h2>{labels.championsTitle}</h2>
          <p>{labels.championsText}</p>
        </article>
      </section>

      <QuizClient locale={locale} />

      <section className={styles.challengeGrid}>
        <article className={styles.leaderboardPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>{labels.champion}</p>
              <h2>{labels.leaderboardTitle}</h2>
            </div>
            <Trophy size={28} />
          </div>
          <div className={styles.leaderboardLabels} aria-hidden="true">
            <span>{labels.rank}</span>
            <span>{labels.player}</span>
            <span>{labels.score}</span>
          </div>
          {leaderboard.map((entry, index) => (
            <div key={entry.name} className={styles.leaderboardRow}>
              <span className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ""}`}>
                {index + 1}
              </span>
              <span className={styles.player}>
                <strong>
                  {entry.name}
                  {index < 3 ? <Crown size={14} aria-label={labels.champion} /> : null}
                </strong>
                <small>{entry.region}</small>
              </span>
              <strong className={styles.points}>{numberFormatter.format(entry.points)}</strong>
            </div>
          ))}
        </article>

      </section>
    </main>
  );
}

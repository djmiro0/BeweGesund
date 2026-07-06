"use client";

import { collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Loader2, Lock, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { db, functions } from "../../../../firebase.config";
import { useAuth } from "../components/AuthProvider";
import styles from "./Quiz.module.css";

interface PublicQuizOption {
  id: string;
  label: string;
}

interface PublicQuizQuestion {
  id: string;
  prompt: string;
  options: PublicQuizOption[];
}

interface PublicQuiz {
  id: string;
  title: string;
  description?: string;
  locale?: string;
  status?: string;
  availableFrom?: { toDate?: () => Date } | string;
  availableUntil?: { toDate?: () => Date } | string;
  timeLimitSeconds?: number;
  questions: PublicQuizQuestion[];
}

interface QuizResult {
  ok?: boolean;
  alreadySubmitted?: boolean;
  score?: number;
  correctCount?: number;
  totalQuestions?: number;
  speedBonus?: number;
  pointsGain?: number;
}

const copy = {
  de: {
    title: "Aktiver Quiz",
    loading: "Quiz wird geladen...",
    empty: "Noch kein veröffentlichter Firestore-Quiz verfügbar. Lege ein Dokument in quizzes an, dann erscheint er hier automatisch.",
    signIn: "Einloggen zum Absenden",
    submit: "Antworten absenden",
    submitted: "Ergebnis gespeichert",
    alreadySubmitted: "Du hast diesen Quiz bereits abgeschlossen.",
    score: "{score} Punkte",
    correct: "{correct}/{total} richtig",
    speedBonus: "+{bonus} Speed-Bonus",
    error: "Der Quiz konnte nicht gespeichert werden.",
  },
  en: {
    title: "Active quiz",
    loading: "Loading quiz...",
    empty: "No published Firestore quiz is available yet. Add a document in quizzes and it will appear here automatically.",
    signIn: "Sign in to submit",
    submit: "Submit answers",
    submitted: "Result saved",
    alreadySubmitted: "You have already completed this quiz.",
    score: "{score} points",
    correct: "{correct}/{total} correct",
    speedBonus: "+{bonus} speed bonus",
    error: "The quiz could not be saved.",
  },
} as const;

function dateFrom(value: PublicQuiz["availableFrom"]) {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return value.toDate?.() ?? null;
}

function isActiveQuiz(quiz: PublicQuiz, locale: string, now: Date) {
  const availableFrom = dateFrom(quiz.availableFrom);
  const availableUntil = dateFrom(quiz.availableUntil);

  return quiz.status === "published"
    && (!quiz.locale || quiz.locale === locale)
    && (!availableFrom || availableFrom.getTime() <= now.getTime())
    && (!availableUntil || availableUntil.getTime() >= now.getTime())
    && quiz.questions.length > 0;
}

function normalizeQuiz(id: string, data: Record<string, unknown>): PublicQuiz | null {
  const questions = Array.isArray(data.questions)
    ? data.questions.map((question) => {
        if (!question || typeof question !== "object") return null;
        const questionData = question as Record<string, unknown>;
        const options = Array.isArray(questionData.options)
          ? questionData.options.map((option) => {
              if (!option || typeof option !== "object") return null;
              const optionData = option as Record<string, unknown>;

              return typeof optionData.id === "string" && typeof optionData.label === "string"
                ? { id: optionData.id, label: optionData.label }
                : null;
            }).filter((option): option is PublicQuizOption => Boolean(option))
          : [];

        return typeof questionData.id === "string" && typeof questionData.prompt === "string" && options.length > 0
          ? { id: questionData.id, prompt: questionData.prompt, options }
          : null;
      }).filter((question): question is PublicQuizQuestion => Boolean(question))
    : [];

  if (typeof data.title !== "string" || questions.length === 0) return null;

  return {
    id,
    title: data.title,
    description: typeof data.description === "string" ? data.description : undefined,
    locale: typeof data.locale === "string" ? data.locale : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    availableFrom: data.availableFrom as PublicQuiz["availableFrom"],
    availableUntil: data.availableUntil as PublicQuiz["availableUntil"],
    timeLimitSeconds: typeof data.timeLimitSeconds === "number" ? data.timeLimitSeconds : undefined,
    questions,
  };
}

function formatTemplate(template: string, values: Record<string, number>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(`{${key}}`, String(value)),
    template,
  );
}

export default function QuizClient({ locale }: { locale: string }) {
  const labels = locale === "de" ? copy.de : copy.en;
  const { user, openAuth } = useAuth();
  const startedAtRef = useRef<number>(Date.now());
  const [quizzes, setQuizzes] = useState<PublicQuiz[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answeredAtMs, setAnsweredAtMs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getDocs(collection(db, "quizzes"))
      .then((snapshot) => {
        if (cancelled) return;

        const now = new Date();
        const activeQuizzes = snapshot.docs
          .map((document) => normalizeQuiz(document.id, document.data()))
          .filter((quiz): quiz is PublicQuiz => quiz !== null)
          .filter((quiz) => isActiveQuiz(quiz, locale, now));

        setQuizzes(activeQuizzes);
        startedAtRef.current = Date.now();
      })
      .catch(() => {
        if (!cancelled) setError(labels.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [labels.error, locale]);

  const activeQuiz = quizzes[0] ?? null;
  const allAnswered = useMemo(() => (
    Boolean(activeQuiz) && activeQuiz.questions.every((question) => selectedAnswers[question.id])
  ), [activeQuiz, selectedAnswers]);

  const handleSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((current) => ({ ...current, [questionId]: optionId }));
    setAnsweredAtMs((current) => (
      current[questionId] ? current : { ...current, [questionId]: Date.now() - startedAtRef.current }
    ));
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    if (!user) {
      openAuth();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const submitQuizAttempt = httpsCallable<
        {
          quizId: string;
          durationMs: number;
          completedAt: string;
          answers: Array<{ questionId: string; optionId: string; answeredAtMs?: number }>;
        },
        QuizResult
      >(functions, "submitQuizAttempt");
      const response = await submitQuizAttempt({
        quizId: activeQuiz.id,
        durationMs: Date.now() - startedAtRef.current,
        completedAt: new Date().toISOString(),
        answers: activeQuiz.questions.map((question) => ({
          questionId: question.id,
          optionId: selectedAnswers[question.id],
          answeredAtMs: answeredAtMs[question.id],
        })),
      });

      setResult(response.data);
    } catch {
      setError(labels.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.liveQuizPanel} aria-live="polite">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Firestore</p>
          <h2>{labels.title}</h2>
        </div>
        {loading ? <Loader2 className={styles.spinIcon} size={24} /> : <Lock size={24} />}
      </div>

      {loading ? <p className={styles.quizState}>{labels.loading}</p> : null}
      {!loading && !activeQuiz ? <p className={styles.quizState}>{error ?? labels.empty}</p> : null}

      {activeQuiz ? (
        <div className={styles.liveQuizBody}>
          <div>
            <h3>{activeQuiz.title}</h3>
            {activeQuiz.description ? <p>{activeQuiz.description}</p> : null}
          </div>

          <div className={styles.liveQuestionList}>
            {activeQuiz.questions.map((question) => (
              <fieldset key={question.id} className={styles.liveQuestion}>
                <legend>{question.prompt}</legend>
                <div className={styles.liveOptions}>
                  {question.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={selectedAnswers[question.id] === option.id ? styles.liveOptionActive : styles.liveOption}
                      onClick={() => handleSelect(question.id, option.id)}
                      disabled={Boolean(result)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {result ? (
            <div className={styles.quizResult}>
              <CheckCircle2 size={18} />
              <strong>{result.alreadySubmitted ? labels.alreadySubmitted : labels.submitted}</strong>
              <span>{formatTemplate(labels.score, { score: result.score ?? 0 })}</span>
              <span>
                {formatTemplate(labels.correct, {
                  correct: result.correctCount ?? 0,
                  total: result.totalQuestions ?? activeQuiz.questions.length,
                })}
              </span>
              <span>{formatTemplate(labels.speedBonus, { bonus: result.speedBonus ?? 0 })}</span>
            </div>
          ) : (
            <button
              type="button"
              className={styles.submitQuizButton}
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className={styles.spinIcon} size={16} /> : <Send size={16} />}
              {user ? labels.submit : labels.signIn}
            </button>
          )}

          {error ? <p className={styles.quizError}>{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

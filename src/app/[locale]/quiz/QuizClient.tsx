"use client";

import { collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Info, Loader2, Lock, Send, X } from "lucide-react";
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
  answers?: Array<{
    questionId: string;
    optionId: string | null;
    correctOptionId: string;
    correct: boolean;
  }>;
}

const copy = {
  de: {
    title: "Aktiver Quiz",
    infoLabel: "Beispiel anzeigen",
    close: "Schließen",
    sampleTitle: "Beispiel-Frage",
    sampleQuestion: "Welche Kombination zählt künftig am stärksten für die Quiz-Rangliste?",
    sampleOptions: ["Nur die Anzahl gelesener Artikel", "Richtige Antworten plus Geschwindigkeit", "Nur Trainingsminuten"],
    sampleNote: "Die echte Quiz-Logik mit Timer, Auswertung und Anti-Cheat läuft über die geschützte Cloud Function.",
    loading: "Quiz wird geladen...",
    empty: "Noch kein veröffentlichter Firestore-Quiz verfügbar. Lege ein Dokument in quizzes an, dann erscheint er hier automatisch.",
    loadError: "Der Quiz konnte nicht geladen werden.",
    signIn: "Einloggen zum Absenden",
    submit: "Antworten absenden",
    submitted: "Ergebnis gespeichert",
    alreadySubmitted: "Du hast diesen Quiz bereits abgeschlossen.",
    score: "{score} Punkte",
    correct: "{correct}/{total} richtig",
    speedBonus: "+{bonus} Speed-Bonus",
    yourAnswer: "Deine Antwort",
    correctAnswer: "Richtige Antwort",
    correctBadge: "Richtig",
    wrongBadge: "Falsch",
    submitError: "Der Quiz konnte nicht gespeichert werden.",
  },
  en: {
    title: "Active quiz",
    infoLabel: "Show example",
    close: "Close",
    sampleTitle: "Example question",
    sampleQuestion: "Which combination will matter most for the quiz leaderboard?",
    sampleOptions: ["Only the number of read articles", "Correct answers plus speed", "Only training minutes"],
    sampleNote: "The real quiz logic with timer, scoring, and anti-cheat runs through the protected Cloud Function.",
    loading: "Loading quiz...",
    empty: "No published Firestore quiz is available yet. Add a document in quizzes and it will appear here automatically.",
    loadError: "The quiz could not be loaded.",
    signIn: "Sign in to submit",
    submit: "Submit answers",
    submitted: "Result saved",
    alreadySubmitted: "You have already completed this quiz.",
    score: "{score} points",
    correct: "{correct}/{total} correct",
    speedBonus: "+{bonus} speed bonus",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    correctBadge: "Correct",
    wrongBadge: "Wrong",
    submitError: "The quiz could not be saved.",
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
  const [isExampleOpen, setIsExampleOpen] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        if (!cancelled) setLoadError(labels.loadError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [labels.loadError, locale]);

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
    setSubmitError(null);

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
      setSubmitError(labels.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionLabel = (question: PublicQuizQuestion, optionId: string | null | undefined) => (
    question.options.find((option) => option.id === optionId)?.label ?? "-"
  );

  return (
    <section className={styles.liveQuizPanel} aria-live="polite">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Firestore</p>
          <h2>{labels.title}</h2>
        </div>
        <div className={styles.quizHeaderActions}>
          <button
            type="button"
            className={styles.quizInfoButton}
            onClick={() => setIsExampleOpen(true)}
            aria-label={labels.infoLabel}
          >
            <Info size={18} />
          </button>
          {loading ? <Loader2 className={styles.spinIcon} size={24} /> : <Lock size={24} />}
        </div>
      </div>

      {loading ? <p className={styles.quizState}>{labels.loading}</p> : null}
      {!loading && !activeQuiz ? <p className={styles.quizState}>{loadError ?? labels.empty}</p> : null}

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
            <>
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
              <div className={styles.answerReviewList}>
                {activeQuiz.questions.map((question) => {
                  const answer = result.answers?.find((item) => item.questionId === question.id);

                  return (
                    <article key={question.id} className={styles.answerReviewCard}>
                      <div className={styles.answerReviewHeader}>
                        <h4>{question.prompt}</h4>
                        <span className={answer?.correct ? styles.answerCorrectBadge : styles.answerWrongBadge}>
                          {answer?.correct ? labels.correctBadge : labels.wrongBadge}
                        </span>
                      </div>
                      <p>
                        <strong>{labels.yourAnswer}:</strong> {getOptionLabel(question, answer?.optionId)}
                      </p>
                      <p>
                        <strong>{labels.correctAnswer}:</strong> {getOptionLabel(question, answer?.correctOptionId)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </>
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

          {submitError ? <p className={styles.quizError}>{submitError}</p> : null}
        </div>
      ) : null}

      {isExampleOpen ? (
        <div className={styles.exampleOverlay} role="presentation" onClick={() => setIsExampleOpen(false)}>
          <section
            className={styles.exampleDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-example-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.exampleDialogHeader}>
              <div>
                <p className={styles.eyebrow}>{labels.sampleTitle}</p>
                <h2 id="quiz-example-title">{labels.sampleQuestion}</h2>
              </div>
              <button
                type="button"
                className={styles.exampleCloseButton}
                onClick={() => setIsExampleOpen(false)}
                aria-label={labels.close}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.optionList}>
              {labels.sampleOptions.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  className={index === 1 ? styles.optionActive : styles.option}
                  disabled
                >
                  {option}
                </button>
              ))}
            </div>
            <p className={styles.previewNote}>{labels.sampleNote}</p>
          </section>
        </div>
      ) : null}
    </section>
  );
}

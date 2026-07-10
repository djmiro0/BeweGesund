"use client";

import { collection, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  Dumbbell,
  Info,
  Leaf,
  Loader2,
  Lock,
  Medal,
  Send,
  Shield,
  Target,
  Trophy,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface QuizAnswerFeedback {
  optionId: string;
  correctOptionId?: string;
  correct?: boolean;
  loading: boolean;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  regionKey: string;
  score: number;
}

interface LeaderboardState {
  regionKey: string | null;
  entries: LeaderboardEntry[];
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
    start: "Quiz starten",
    startTitle: "Bist du bereit?",
    startDescription: "Der Timer startet erst, wenn du auf Start klickst. Du bekommst heute 5 Fragen und hast pro Frage 30 Sekunden Zeit.",
    back: "Zurück",
    next: "Weiter",
    done: "Fertig",
    submit: "Antworten absenden",
    timeUp: "Zeit abgelaufen",
    progress: "Frage {current}/{total}",
    secondsLeft: "{seconds}s",
    submitted: "Ergebnis gespeichert",
    alreadySubmitted: "Du hast diesen Quiz bereits abgeschlossen.",
    score: "{score} Punkte",
    correct: "{correct}/{total} richtig",
    speedBonus: "+{bonus} Speed-Bonus",
    completedTitle: "Glückwunsch, du hast den Test abgeschlossen!",
    completedText: "Deine Antworten wurden gespeichert. Schau dir jetzt in Ruhe an, was du ausgewählt hast und welche Antwort richtig war.",
    reviewTitle: "Deine Antworten im Überblick",
    homeCta: "Zur Startseite",
    yourAnswer: "Deine Antwort",
    correctAnswer: "Richtige Antwort",
    correctBadge: "Richtig",
    wrongBadge: "Falsch",
    submitError: "Der Quiz konnte nicht gespeichert werden.",
    answerCheckError: "Die Antwort konnte nicht geprüft werden.",
    heroEyebrow: "Bewegesund Challenges",
    heroTitleFirst: "Teste dein Wissen.",
    heroTitleSecond: "Werde Champion.",
    heroLead: "Tägliche Quizzes, Punkte sammeln und jeden Monat die Chance auf die Champion-Krone.",
    duration: "Dauert nur 2 Minuten",
    challengeTitle: "24h Challenge",
    challengeText: "Täglich neue Fragen",
    pointsTitle: "Punkte & Rang",
    pointsText: "Sammle Punkte & steig auf",
    championTitle: "Monats-Champion",
    championText: "Top 3 gewinnen die Krone",
    dailyTitle: "Täglicher 24h Quiz",
    dailyText: "Jeden Tag 5 neue Fragen zu Ernährung, Training, Mental Health und Prävention.",
    knowledgeTitle: "Wissen, das bleibt",
    knowledgeText: "Kurze Erklärungen nach jeder Antwort. So lernst du mit jeder Challenge dazu.",
    monthlyTitle: "Monats-Champion",
    monthlyText: "Die besten drei Profile erhalten monatlich eine exklusive Krone neben ihrem Namen.",
    today: "Heute",
    dailyQuizTitle: "Tägliches Gesundheitsquiz",
    dailyQuizText: "5 kurze Fragen • 24 Stunden • Dein Wissen, dein Fortschritt",
    leaderboardEyebrow: "Monats-Champion",
    leaderboardTitle: "Monatsrangliste",
    fullRanking: "Komplette Rangliste",
    leaderboardLoading: "Regionale Rangliste wird geladen...",
    leaderboardEmpty: "In deiner Region wurden noch keine Punkte gesammelt.",
    leaderboardNoRegion: "Füge in deinem Profil eine Region hinzu, um die Rangliste zu sehen.",
    leaderboardSignIn: "Einloggen, um deine regionale Rangliste zu sehen.",
    leaderboardMember: "Mitglied",
    you: "Du",
    statTime: "Zeit pro Challenge",
    statQuestions: "Fragen täglich",
    statKnowledge: "Wissen erweitern",
    statChampion: "Champion werden",
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
    start: "Start quiz",
    startTitle: "Are you ready?",
    startDescription: "The timer starts only when you click Start. You get 5 questions today and have 30 seconds for each question.",
    back: "Back",
    next: "Next",
    done: "Done",
    submit: "Submit answers",
    timeUp: "Time up",
    progress: "Question {current}/{total}",
    secondsLeft: "{seconds}s",
    submitted: "Result saved",
    alreadySubmitted: "You have already completed this quiz.",
    score: "{score} points",
    correct: "{correct}/{total} correct",
    speedBonus: "+{bonus} speed bonus",
    completedTitle: "Congratulations, you completed the test!",
    completedText: "Your answers have been saved. Review what you selected and compare it with the correct answers.",
    reviewTitle: "Review your answers",
    homeCta: "Go to homepage",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    correctBadge: "Correct",
    wrongBadge: "Wrong",
    submitError: "The quiz could not be saved.",
    answerCheckError: "The answer could not be checked.",
    heroEyebrow: "Bewegesund challenges",
    heroTitleFirst: "Test your knowledge.",
    heroTitleSecond: "Become champion.",
    heroLead: "Daily quizzes, collect points, and compete each month for the champion crown.",
    duration: "Only takes 2 minutes",
    challengeTitle: "24h challenge",
    challengeText: "Fresh questions daily",
    pointsTitle: "Points & rank",
    pointsText: "Collect points & move up",
    championTitle: "Monthly champion",
    championText: "Top 3 win the crown",
    dailyTitle: "Daily 24h quiz",
    dailyText: "Five new daily questions on nutrition, training, mental health, and prevention.",
    knowledgeTitle: "Knowledge that sticks",
    knowledgeText: "Short explanations after every answer help you learn with each challenge.",
    monthlyTitle: "Monthly champion",
    monthlyText: "The best three profiles receive an exclusive monthly crown next to their name.",
    today: "Today",
    dailyQuizTitle: "Daily health quiz",
    dailyQuizText: "5 quick questions • 24 hours • Your knowledge, your progress",
    leaderboardEyebrow: "Monthly champion",
    leaderboardTitle: "Monthly leaderboard",
    fullRanking: "Full ranking",
    leaderboardLoading: "Loading regional leaderboard...",
    leaderboardEmpty: "No points have been collected in your region yet.",
    leaderboardNoRegion: "Add a region in your profile to see the leaderboard.",
    leaderboardSignIn: "Sign in to see your regional leaderboard.",
    leaderboardMember: "Member",
    you: "You",
    statTime: "Time per challenge",
    statQuestions: "Daily questions",
    statKnowledge: "Expand knowledge",
    statChampion: "Become champion",
  },
} as const;

const DAILY_QUESTION_COUNT = 5;
const DEFAULT_QUESTION_SECONDS = 30;
const MIN_QUESTION_SECONDS = 30;

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

function berlinDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return hash >>> 0;
}

function dailyQuestions(questions: PublicQuizQuestion[], dateKey: string) {
  return [...questions]
    .sort((left, right) => stableHash(`${dateKey}:${left.id}`) - stableHash(`${dateKey}:${right.id}`))
    .slice(0, DAILY_QUESTION_COUNT);
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

function leaderboardInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "M";
}

function readableRegion(regionKey: string) {
  return regionKey
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function QuizClient({
  locale,
  gameMode = false,
  autoStart = false,
}: {
  locale: string;
  gameMode?: boolean;
  autoStart?: boolean;
}) {
  const labels = locale === "de" ? copy.de : copy.en;
  const { user, profile, loading: authLoading, openAuth } = useAuth();
  const quizPanelRef = useRef<HTMLElement | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const questionStartedAtRef = useRef<number>(Date.now());
  const autoStartedRef = useRef(false);
  const [quizzes, setQuizzes] = useState<PublicQuiz[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answeredAtMs, setAnsweredAtMs] = useState<Record<string, number>>({});
  const [answerFeedbacks, setAnswerFeedbacks] = useState<Record<string, QuizAnswerFeedback>>({});
  const [timedOutQuestions, setTimedOutQuestions] = useState<Record<string, boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_QUESTION_SECONDS);
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isExampleOpen, setIsExampleOpen] = useState(false);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isGamePopupOpen, setIsGamePopupOpen] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>({
    regionKey: null,
    entries: [],
  });

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

  useEffect(() => {
    if (!user || !profile?.regionKey) {
      return undefined;
    }

    const entriesQuery = query(
      collection(db, "leaderboards", "monthly", "regions", profile.regionKey, "entries"),
      orderBy("score", "desc"),
      limit(3),
    );

    return onSnapshot(
      entriesQuery,
      (snapshot) => {
        const entries = snapshot.docs.map((document) => {
          const data = document.data();
          const displayName = typeof data.displayName === "string" && data.displayName.trim()
            ? data.displayName.trim()
            : labels.leaderboardMember;
          const regionKey = typeof data.regionKey === "string" && data.regionKey.trim()
            ? data.regionKey
            : profile.regionKey ?? "";
          const score = typeof data.score === "number" && Number.isFinite(data.score) ? data.score : 0;

          return {
            userId: document.id,
            displayName,
            regionKey,
            score,
          };
        });

        setLeaderboardState({ regionKey: profile.regionKey, entries });
      },
      () => {
        setLeaderboardState({ regionKey: profile.regionKey, entries: [] });
      },
    );
  }, [labels.leaderboardMember, profile?.regionKey, user]);

  const activeQuiz = quizzes[0] ?? null;
  const quizDay = useMemo(() => berlinDateKey(), []);
  const activeQuestions = useMemo(() => (
    activeQuiz ? dailyQuestions(activeQuiz.questions, quizDay) : []
  ), [activeQuiz, quizDay]);
  const currentQuestion = activeQuestions[currentQuestionIndex] ?? null;
  const questionSeconds = activeQuiz?.timeLimitSeconds && Number.isFinite(activeQuiz.timeLimitSeconds)
    ? Math.max(MIN_QUESTION_SECONDS, Math.round(activeQuiz.timeLimitSeconds))
    : DEFAULT_QUESTION_SECONDS;
  const currentQuestionAnswered = currentQuestion ? Boolean(selectedAnswers[currentQuestion.id]) : false;
  const currentQuestionTimedOut = currentQuestion ? Boolean(timedOutQuestions[currentQuestion.id]) : false;
  const currentQuestionFeedback = currentQuestion ? answerFeedbacks[currentQuestion.id] : undefined;
  const canMoveForward = (currentQuestionAnswered && !currentQuestionFeedback?.loading) || currentQuestionTimedOut;
  const isLastQuestion = currentQuestionIndex >= activeQuestions.length - 1;
  const regionKey = profile?.regionKey ?? null;
  const leaderboardEntries = regionKey === leaderboardState.regionKey ? leaderboardState.entries : [];
  const leaderboardLoading = Boolean(user && regionKey && regionKey !== leaderboardState.regionKey);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  const monthlyScore = typeof profile?.monthlyScore === "number" ? profile.monthlyScore : 0;
  const displayName = profile?.firstName || profile?.displayName || user?.displayName || labels.leaderboardMember;
  const leaderboardWithCurrentUser = user && regionKey && !leaderboardEntries.some((entry) => entry.userId === user.uid)
    ? [
      ...leaderboardEntries,
      {
        userId: user.uid,
        displayName,
        regionKey,
        score: monthlyScore,
      },
    ].sort((left, right) => right.score - left.score).slice(0, 3)
    : leaderboardEntries;

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setAnsweredAtMs({});
    setAnswerFeedbacks({});
    setTimedOutQuestions({});
    autoStartedRef.current = false;
    setHasStarted(false);
    setIsStartDialogOpen(false);
    setResult(null);
  }, [activeQuiz?.id, quizDay]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
    setTimeLeft(questionSeconds);
  }, [currentQuestion?.id, questionSeconds]);

  useEffect(() => {
    if (!hasStarted || !currentQuestion || result || currentQuestionAnswered || currentQuestionTimedOut) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimedOutQuestions((questions) => ({ ...questions, [currentQuestion.id]: true }));
          setAnsweredAtMs((answers) => (
            answers[currentQuestion.id] ? answers : { ...answers, [currentQuestion.id]: questionSeconds * 1000 }
          ));
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [currentQuestion, currentQuestionAnswered, currentQuestionTimedOut, hasStarted, questionSeconds, result]);

  const startQuizRound = useCallback(() => {
    startedAtRef.current = Date.now();
    questionStartedAtRef.current = Date.now();
    setTimeLeft(questionSeconds);
    setIsStartDialogOpen(false);
    setHasStarted(true);
    window.requestAnimationFrame(() => {
      quizPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [questionSeconds]);

  useEffect(() => {
    if (!gameMode || !autoStart || autoStartedRef.current || authLoading || loading || !activeQuiz || hasStarted || result) {
      return;
    }

    if (!user) {
      openAuth();
      return;
    }

    autoStartedRef.current = true;
    startQuizRound();
  }, [activeQuiz, authLoading, autoStart, gameMode, hasStarted, loading, openAuth, result, startQuizRound, user]);

  const handleOpenStart = () => {
    if (!user) {
      openAuth();
      return;
    }

    if (!gameMode) {
      setIsGamePopupOpen(true);
      return;
    }

    if (gameMode) {
      startQuizRound();
      return;
    }

    setIsStartDialogOpen(true);
  };

  const handleStart = () => {
    if (!user) {
      setIsStartDialogOpen(false);
      openAuth();
      return;
    }

    startQuizRound();
  };

  const handleSelect = async (questionId: string, optionId: string) => {
    if (timedOutQuestions[questionId] || selectedAnswers[questionId] || result) return;

    setSelectedAnswers((current) => ({ ...current, [questionId]: optionId }));
    setAnsweredAtMs((current) => (
      current[questionId] ? current : { ...current, [questionId]: Date.now() - questionStartedAtRef.current }
    ));
    setAnswerFeedbacks((current) => ({
      ...current,
      [questionId]: { optionId, loading: true },
    }));

    if (!activeQuiz || !user) return;

    try {
      const checkQuizAnswer = httpsCallable<
        { quizId: string; questionId: string; optionId: string; answeredAt: string },
        { ok: boolean; questionId: string; optionId: string; correctOptionId: string; correct: boolean }
      >(functions, "checkQuizAnswer");
      const response = await checkQuizAnswer({
        quizId: activeQuiz.id,
        questionId,
        optionId,
        answeredAt: new Date().toISOString(),
      });

      setAnswerFeedbacks((current) => ({
        ...current,
        [questionId]: {
          optionId,
          correctOptionId: response.data.correctOptionId,
          correct: response.data.correct,
          loading: false,
        },
      }));
    } catch {
      setAnswerFeedbacks((current) => ({
        ...current,
        [questionId]: { optionId, loading: false },
      }));
      setSubmitError(labels.answerCheckError);
    }
  };

  const handleNext = () => {
    if (!canMoveForward) return;

    if (isLastQuestion) {
      void handleSubmit();
      return;
    }

    setCurrentQuestionIndex((current) => Math.min(current + 1, activeQuestions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    if (!activeQuiz || activeQuestions.length === 0) return;
    if (!user) {
      openAuth();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await user.getIdToken(true);
      const submitQuizAttempt = httpsCallable<
        {
          quizId: string;
          durationMs: number;
          completedAt: string;
          answers: Array<{ questionId: string; optionId: string | null; answeredAtMs?: number }>;
        },
        QuizResult
      >(functions, "submitQuizAttempt");
      const response = await submitQuizAttempt({
        quizId: activeQuiz.id,
        durationMs: Date.now() - startedAtRef.current,
        completedAt: new Date().toISOString(),
        answers: activeQuestions.map((question) => ({
          questionId: question.id,
          optionId: selectedAnswers[question.id] ?? null,
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
    <>
      {!gameMode ? (
        <>
          <section className={styles.hero} aria-labelledby="quiz-hero-title">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <Dumbbell size={18} />
                {labels.heroEyebrow}
              </p>
              <h1 id="quiz-hero-title">
                <span>{labels.heroTitleFirst}</span>
                <span>{labels.heroTitleSecond}</span>
              </h1>
              <p>{labels.heroLead}</p>
              <div className={styles.heroActions}>
                <button type="button" className={styles.primaryLink} onClick={handleOpenStart} disabled={authLoading || loading || !activeQuiz}>
                  <Target size={17} />
                  {labels.start}
                  <ArrowRight size={17} />
                </button>
                <span className={styles.durationHint}>
                  <Clock3 size={16} />
                  {labels.duration}
                </span>
              </div>
            </div>

            <div className={styles.heroVisual} aria-hidden="true">
              <Image src="/quiz-hero-challenge.png" alt="" fill priority sizes="(max-width: 900px) 100vw, 46vw" />
            </div>

            <div className={styles.heroCard} aria-hidden="true">
              <div className={styles.heroCardIcon}><Clock3 size={27} /></div>
              <strong>{labels.challengeTitle}</strong>
              <span>{labels.challengeText}</span>
              <div className={styles.heroCardIcon}><Target size={27} /></div>
              <strong>{labels.pointsTitle}</strong>
              <span>{labels.pointsText}</span>
              <div className={styles.heroCardIcon}><Crown size={28} /></div>
              <strong>{labels.championTitle}</strong>
              <span>{labels.championText}</span>
            </div>
          </section>

          <section className={styles.featureGrid} aria-label={labels.heroEyebrow}>
            <article className={styles.featureCard}>
              <Clock3 size={40} />
              <div>
                <h2>{labels.dailyTitle}</h2>
                <p>{labels.dailyText}</p>
              </div>
            </article>
            <article className={styles.featureCard}>
              <BookOpen size={40} />
              <div>
                <h2>{labels.knowledgeTitle}</h2>
                <p>{labels.knowledgeText}</p>
              </div>
            </article>
            <article className={styles.featureCard}>
              <Crown size={42} />
              <div>
                <h2>{labels.monthlyTitle}</h2>
                <p>{labels.monthlyText}</p>
              </div>
            </article>
          </section>
        </>
      ) : null}

      <div className={gameMode ? styles.gameModeShell : styles.challengeGrid}>
        <section ref={quizPanelRef} className={styles.liveQuizPanel} aria-live="polite">
      {!gameMode ? (
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.todayBadge}>{labels.today}</p>
            <h2 className={styles.quizTitle}>{activeQuiz?.title ?? labels.dailyQuizTitle}</h2>
            <p className={styles.quizLead}>{activeQuiz?.description ?? labels.dailyQuizText}</p>
          </div>
          <div className={styles.quizHeaderActions}>
            <span aria-hidden="true"><Shield size={18} /></span>
            <span aria-hidden="true"><Clock3 size={18} /></span>
            <span aria-hidden="true"><BriefcaseBusiness size={18} /></span>
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
      ) : null}

      {loading ? <p className={styles.quizState}>{labels.loading}</p> : null}
      {!loading && !activeQuiz ? <p className={styles.quizState}>{loadError ?? labels.empty}</p> : null}

      {activeQuiz ? (
        <div className={styles.liveQuizBody}>
          {!result && !hasStarted ? (
            <div className={gameMode ? styles.inlineStartPanel : ""}>
              {gameMode ? (
                <div>
                  <h3 className={styles.startDialogTitle}>{labels.startTitle}</h3>
                  <p className={styles.startDialogText}>{labels.startDescription}</p>
                </div>
              ) : null}
              <button
                type="button"
                className={`${styles.submitQuizButton} ${styles.quizStartButton}`}
                disabled={authLoading}
                onClick={handleOpenStart}
              >
                <Clock3 size={16} />
                {labels.start}
              </button>
            </div>
          ) : null}

          {!result && hasStarted && currentQuestion ? (
            <div className={styles.dailyQuestionShell}>
              <div className={styles.dailyQuizMeta}>
                <span>
                  {formatTemplate(labels.progress, {
                    current: currentQuestionIndex + 1,
                    total: activeQuestions.length,
                  })}
                </span>
                <span className={currentQuestionTimedOut ? styles.timerExpired : styles.timerPill}>
                  <Clock3 size={15} />
                  {currentQuestionTimedOut
                    ? labels.timeUp
                    : formatTemplate(labels.secondsLeft, { seconds: timeLeft })}
                </span>
              </div>
              <div className={styles.quizProgressTrack} aria-hidden="true">
                <span
                  style={{
                    width: `${((currentQuestionIndex + (canMoveForward ? 1 : 0.15)) / Math.max(activeQuestions.length, 1)) * 100}%`,
                  }}
                />
              </div>

              <section className={styles.liveQuestion} aria-labelledby={`quiz-question-${currentQuestion.id}`}>
                <div className={styles.questionPromptRow}>
                  <div className={styles.questionIcon} aria-hidden="true">
                    <Leaf size={38} />
                  </div>
                  <h3 id={`quiz-question-${currentQuestion.id}`}>{currentQuestion.prompt}</h3>
                </div>
                <div className={styles.liveOptions}>
                  {currentQuestion.options.map((option) => {
                    const selected = selectedAnswers[currentQuestion.id] === option.id;
                    const isCorrectAnswer = currentQuestionFeedback?.correctOptionId === option.id;
                    const isWrongSelection = selected && currentQuestionFeedback?.correct === false;
                    const isCorrectSelection = selected && currentQuestionFeedback?.correct === true;
                    const optionClassName = [
                      selected ? styles.liveOptionActive : styles.liveOption,
                      isCorrectAnswer || isCorrectSelection ? styles.liveOptionCorrect : "",
                      isWrongSelection ? styles.liveOptionWrong : "",
                    ].filter(Boolean).join(" ");

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={optionClassName}
                        onClick={() => void handleSelect(currentQuestion.id, option.id)}
                        disabled={currentQuestionAnswered || currentQuestionTimedOut || Boolean(result)}
                      >
                        <span className={styles.optionMarker} aria-hidden="true">
                          {selected && currentQuestionFeedback?.loading ? <Loader2 className={styles.spinIcon} size={15} /> : null}
                          {isCorrectAnswer || isCorrectSelection ? <Check size={17} /> : null}
                          {isWrongSelection ? <X size={17} /> : null}
                        </span>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.quizQuestionActions}>
                  <button
                    type="button"
                    className={styles.previousQuizButton}
                    disabled={currentQuestionIndex === 0 || submitting}
                    onClick={handlePrevious}
                  >
                    <ArrowLeft size={18} />
                    {labels.back}
                  </button>
                  <button
                    type="button"
                    className={styles.submitQuizButton}
                    disabled={!canMoveForward || submitting}
                    onClick={handleNext}
                  >
                    {isLastQuestion ? (user ? labels.done : labels.signIn) : labels.next}
                    {submitting ? <Loader2 className={styles.spinIcon} size={16} /> : isLastQuestion ? <Send size={16} /> : <ArrowRight size={18} />}
                  </button>
                </div>
              </section>

              <div className={styles.quizStepper} aria-label={formatTemplate(labels.progress, {
                current: currentQuestionIndex + 1,
                total: activeQuestions.length,
              })}
              >
                {activeQuestions.map((question, index) => {
                  const isAnswered = Boolean(selectedAnswers[question.id]) || Boolean(timedOutQuestions[question.id]);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <span
                      key={question.id}
                      className={`${styles.quizStep} ${isCurrent ? styles.quizStepCurrent : ""} ${isAnswered ? styles.quizStepDone : ""}`}
                    >
                      <span className={styles.quizStepDot}>
                        {isAnswered && !isCurrent ? <Check size={13} /> : index + 1}
                      </span>
                      <span className={styles.quizStepLabel}>{formatTemplate(labels.progress, {
                        current: index + 1,
                        total: activeQuestions.length,
                      }).replace(`/${activeQuestions.length}`, "")}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          {result ? (
            <section className={styles.completionPanel} aria-labelledby="quiz-completed-title">
              <div className={styles.completionHero}>
                <div className={styles.completionIcon} aria-hidden="true">
                  <CheckCircle2 size={34} />
                </div>
                <div>
                  <p>{result.alreadySubmitted ? labels.alreadySubmitted : labels.submitted}</p>
                  <h3 id="quiz-completed-title">{labels.completedTitle}</h3>
                  <span>{labels.completedText}</span>
                </div>
              </div>

              <div className={styles.quizResult}>
                <span>{formatTemplate(labels.score, { score: result.score ?? 0 })}</span>
                <span>
                  {formatTemplate(labels.correct, {
                    correct: result.correctCount ?? 0,
                    total: result.totalQuestions ?? activeQuestions.length,
                  })}
                </span>
                <span>{formatTemplate(labels.speedBonus, { bonus: result.speedBonus ?? 0 })}</span>
              </div>

              <div className={styles.completionActions}>
                <Link href={`/${locale}`} className={styles.homeButton}>
                  {labels.homeCta}
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div>
                <h3 className={styles.answerReviewTitle}>{labels.reviewTitle}</h3>
              <div className={styles.answerReviewList}>
                {activeQuestions.map((question) => {
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
              </div>
            </section>
          ) : null}

          {submitError ? <p className={styles.quizError}>{submitError}</p> : null}
        </div>
      ) : null}
        </section>

        {!gameMode ? (
        <aside className={styles.leaderboardPanel} aria-labelledby="monthly-ranking-title">
          <div className={styles.leaderboardHeader}>
            <div>
              <p className={styles.leaderboardEyebrow}>
                <Trophy size={15} />
                {labels.leaderboardEyebrow}
              </p>
              <h2 id="monthly-ranking-title">{labels.leaderboardTitle}</h2>
            </div>
            <Link href={`/${locale}/profile`} className={styles.rankingButton}>
              {labels.fullRanking}
              <ArrowRight size={16} />
            </Link>
          </div>

          {!user ? <p className={styles.leaderboardState}>{labels.leaderboardSignIn}</p> : null}
          {user && !regionKey ? <p className={styles.leaderboardState}>{labels.leaderboardNoRegion}</p> : null}
          {leaderboardLoading ? <p className={styles.leaderboardState}>{labels.leaderboardLoading}</p> : null}
          {user && regionKey && !leaderboardLoading && leaderboardWithCurrentUser.length === 0 ? (
            <p className={styles.leaderboardState}>{labels.leaderboardEmpty}</p>
          ) : null}
          {user && regionKey && !leaderboardLoading ? leaderboardWithCurrentUser.map((player, index) => {
            const rank = index + 1;

            return (
              <div key={player.userId} className={styles.leaderboardRow}>
                <span className={`${styles.rank} ${styles[`rank${rank}` as "rank1" | "rank2" | "rank3"]}`}>
                  {rank}
                </span>
                <span className={styles.playerAvatar}>{leaderboardInitials(player.displayName)}</span>
                <span className={styles.player}>
                  <strong>
                    {player.displayName}
                    {rank === 1 ? <Crown size={14} /> : null}
                  </strong>
                  <small>{player.userId === user.uid ? labels.you : readableRegion(player.regionKey)}</small>
                </span>
                <strong className={styles.points}>{numberFormatter.format(player.score)}</strong>
              </div>
            );
          }) : null}
        </aside>
        ) : null}
      </div>

      {!gameMode ? (
      <section className={styles.statsRail} aria-label={labels.heroEyebrow}>
        <div>
          <Clock3 size={30} />
          <strong>24h</strong>
          <span>{labels.statTime}</span>
        </div>
        <div>
          <Info size={30} />
          <strong>5</strong>
          <span>{labels.statQuestions}</span>
        </div>
        <div>
          <Medal size={30} />
          <strong>∞</strong>
          <span>{labels.statKnowledge}</span>
        </div>
        <div>
          <Crown size={30} />
          <strong>1</strong>
          <span>{labels.statChampion}</span>
        </div>
      </section>
      ) : null}

      {isGamePopupOpen ? (
        <div className={styles.gameOverlay} role="presentation" onClick={() => setIsGamePopupOpen(false)}>
          <section
            className={styles.gameDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-game-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.gameDialogHeader}>
              <h2 id="quiz-game-title">{activeQuiz?.title ?? labels.dailyQuizTitle}</h2>
              <button
                type="button"
                className={styles.gameCloseButton}
                onClick={() => setIsGamePopupOpen(false)}
                aria-label={labels.close}
              >
                <X size={18} />
              </button>
            </div>
            <QuizClient locale={locale} gameMode />
          </section>
        </div>
      ) : null}

      {isStartDialogOpen ? (
        <div className={styles.exampleOverlay} role="presentation" onClick={() => setIsStartDialogOpen(false)}>
          <section
            className={styles.exampleDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-start-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.exampleDialogHeader}>
              <div>
                <h2 id="quiz-start-title" className={styles.startDialogTitle}>{labels.startTitle}</h2>
                <p className={styles.startDialogText}>{labels.startDescription}</p>
              </div>
              <button
                type="button"
                className={styles.exampleCloseButton}
                onClick={() => setIsStartDialogOpen(false)}
                aria-label={labels.close}
              >
                <X size={18} />
              </button>
            </div>
            <button type="button" className={styles.startDialogButton} disabled={authLoading} onClick={handleStart}>
              <Clock3 size={16} />
              {labels.start}
            </button>
          </section>
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
    </>
  );
}

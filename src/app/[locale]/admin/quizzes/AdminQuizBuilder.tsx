"use client";

import { httpsCallable } from "firebase/functions";
import { Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { functions } from "../../../../../firebase.config";
import { useAuth } from "../../components/AuthProvider";
import styles from "./AdminQuizBuilder.module.css";

interface AdminQuizOption {
  id: string;
  label: string;
}

interface AdminQuizQuestion {
  id: string;
  prompt: string;
  correctOptionId: string;
  options: AdminQuizOption[];
}

const copy = {
  de: {
    eyebrow: "Admin",
    title: "Quiz erstellen",
    description: "Erstelle Fragen, markiere die richtige Antwort und speichere den Quiz direkt in Firestore.",
    signIn: "Bitte einloggen. Nur Admins können speichern.",
    adminRequired: "Admin-Zugriff erforderlich",
    setupDescription: "Wenn noch kein Admin existiert, kannst du den ersten Admin mit dem Setup-Code aktivieren.",
    setupCode: "Setup-Code",
    claimAdmin: "Admin aktivieren",
    claimingAdmin: "Wird aktiviert...",
    adminClaimed: "Admin-Zugriff aktiviert.",
    adminClaimError: "Admin konnte nicht aktiviert werden. Prüfe den Code oder ob bereits ein Admin existiert.",
    quizId: "Quiz ID",
    quizTitle: "Titel",
    quizDescription: "Beschreibung",
    locale: "Sprache",
    status: "Status",
    draft: "Entwurf",
    published: "Veröffentlicht",
    availableFrom: "Verfügbar ab",
    availableUntil: "Verfügbar bis",
    monthlyPeriod: "Monat",
    timeLimit: "Zeitlimit Sekunden",
    points: "Punkte pro richtiger Antwort",
    speedBonus: "Max. Speed-Bonus",
    xp: "XP Belohnung",
    allowRetake: "Wiederholung erlauben",
    question: "Frage",
    answer: "Antwort",
    correct: "Richtig",
    addQuestion: "Frage hinzufügen",
    addAnswer: "Antwort hinzufügen",
    save: "Quiz speichern",
    saving: "Wird gespeichert...",
    saved: "Quiz gespeichert.",
    error: "Quiz konnte nicht gespeichert werden. Prüfe Admin-Rolle und Pflichtfelder.",
  },
  en: {
    eyebrow: "Admin",
    title: "Create quiz",
    description: "Create questions, mark the correct answer, and save the quiz directly to Firestore.",
    signIn: "Please sign in. Only admins can save.",
    adminRequired: "Admin access required",
    setupDescription: "If no admin exists yet, you can activate the first admin with the setup code.",
    setupCode: "Setup code",
    claimAdmin: "Activate admin",
    claimingAdmin: "Activating...",
    adminClaimed: "Admin access activated.",
    adminClaimError: "Admin could not be activated. Check the code or whether an admin already exists.",
    quizId: "Quiz ID",
    quizTitle: "Title",
    quizDescription: "Description",
    locale: "Language",
    status: "Status",
    draft: "Draft",
    published: "Published",
    availableFrom: "Available from",
    availableUntil: "Available until",
    monthlyPeriod: "Month",
    timeLimit: "Time limit seconds",
    points: "Points per correct answer",
    speedBonus: "Max speed bonus",
    xp: "XP reward",
    allowRetake: "Allow retake",
    question: "Question",
    answer: "Answer",
    correct: "Correct",
    addQuestion: "Add question",
    addAnswer: "Add answer",
    save: "Save quiz",
    saving: "Saving...",
    saved: "Quiz saved.",
    error: "Quiz could not be saved. Check admin role and required fields.",
  },
} as const;

function makeOption(index: number): AdminQuizOption {
  return { id: String.fromCharCode(97 + index), label: "" };
}

function makeQuestion(index: number): AdminQuizQuestion {
  return {
    id: `q${index + 1}`,
    prompt: "",
    correctOptionId: "a",
    options: [makeOption(0), makeOption(1), makeOption(2)],
  };
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function toIsoDateTime(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export default function AdminQuizBuilder({ locale }: { locale: string }) {
  const labels = locale === "de" ? copy.de : copy.en;
  const { user, profile, openAuth } = useAuth();
  const isAdmin = profile?.roles.includes("admin") ?? false;
  const [setupCode, setSetupCode] = useState("");
  const [quizId, setQuizId] = useState(`monthly-fitness-${currentMonth()}`);
  const [title, setTitle] = useState(locale === "de" ? "Monatlicher Fitness-Quiz" : "Monthly Fitness Quiz");
  const [description, setDescription] = useState("");
  const [quizLocale, setQuizLocale] = useState<"de" | "en">(locale === "en" ? "en" : "de");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [monthlyPeriod, setMonthlyPeriod] = useState(currentMonth());
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
  const [pointsPerCorrect, setPointsPerCorrect] = useState(100);
  const [speedBonusMax, setSpeedBonusMax] = useState(50);
  const [xpReward, setXpReward] = useState(10);
  const [allowRetake, setAllowRetake] = useState(false);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([makeQuestion(0)]);
  const [isSaving, setIsSaving] = useState(false);
  const [isClaimingAdmin, setIsClaimingAdmin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => (
    Boolean(user)
    && quizId.trim()
    && title.trim()
    && questions.every((question) => (
      question.id.trim()
      && question.prompt.trim()
      && question.correctOptionId
      && question.options.length >= 2
      && question.options.every((option) => option.id.trim() && option.label.trim())
      && question.options.some((option) => option.id === question.correctOptionId)
    ))
  ), [questions, quizId, title, user]);

  const updateQuestion = (index: number, patch: Partial<AdminQuizQuestion>) => {
    setQuestions((current) => current.map((question, questionIndex) => (
      questionIndex === index ? { ...question, ...patch } : question
    )));
  };

  const updateOption = (questionIndex: number, optionIndex: number, patch: Partial<AdminQuizOption>) => {
    setQuestions((current) => current.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex) return question;

      return {
        ...question,
        options: question.options.map((option, currentOptionIndex) => (
          currentOptionIndex === optionIndex ? { ...option, ...patch } : option
        )),
      };
    }));
  };

  const addOption = (questionIndex: number) => {
    setQuestions((current) => current.map((question, currentQuestionIndex) => (
      currentQuestionIndex === questionIndex
        ? { ...question, options: [...question.options, makeOption(question.options.length)] }
        : question
    )));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((current) => current.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex || question.options.length <= 2) return question;
      const nextOptions = question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex);

      return {
        ...question,
        options: nextOptions,
        correctOptionId: nextOptions.some((option) => option.id === question.correctOptionId)
          ? question.correctOptionId
          : nextOptions[0].id,
      };
    }));
  };

  const handleSave = async () => {
    if (!user) {
      openAuth();
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const saveQuiz = httpsCallable(functions, "saveQuiz");
      await saveQuiz({
        quizId,
        title,
        description,
        locale: quizLocale,
        status,
        availableFrom: toIsoDateTime(availableFrom),
        availableUntil: toIsoDateTime(availableUntil),
        monthlyPeriod,
        timeLimitSeconds,
        allowRetake,
        pointsPerCorrect,
        speedBonusMax,
        xpReward,
        questions,
      });
      setMessage(labels.saved);
    } catch {
      setError(labels.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClaimAdmin = async () => {
    if (!user) {
      openAuth();
      return;
    }

    setIsClaimingAdmin(true);
    setMessage(null);
    setError(null);

    try {
      const claimFirstAdmin = httpsCallable(functions, "claimFirstAdmin");
      await claimFirstAdmin({ setupCode });
      setMessage(labels.adminClaimed);
      setSetupCode("");
    } catch {
      setError(labels.adminClaimError);
    } finally {
      setIsClaimingAdmin(false);
    }
  };

  return (
    <main className={styles.adminPage}>
      <section className={styles.hero}>
        <p>{labels.eyebrow}</p>
        <h1>{labels.title}</h1>
        <span>{labels.description}</span>
      </section>

      {!user ? (
        <button type="button" className={styles.primaryButton} onClick={openAuth}>
          {labels.signIn}
        </button>
      ) : null}

      {user && !isAdmin ? (
        <section className={styles.setupPanel}>
          <div>
            <p>{labels.adminRequired}</p>
            <h2>{labels.setupDescription}</h2>
          </div>
          <label>
            {labels.setupCode}
            <input
              type="password"
              value={setupCode}
              onChange={(event) => setSetupCode(event.target.value)}
              autoComplete="one-time-code"
            />
          </label>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!setupCode.trim() || isClaimingAdmin}
            onClick={handleClaimAdmin}
          >
            {isClaimingAdmin ? labels.claimingAdmin : labels.claimAdmin}
          </button>
        </section>
      ) : null}

      {user && isAdmin ? (
        <>

      <section className={styles.formGrid}>
        <label>
          {labels.quizId}
          <input value={quizId} onChange={(event) => setQuizId(event.target.value)} />
        </label>
        <label>
          {labels.quizTitle}
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className={styles.fullWidth}>
          {labels.quizDescription}
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          {labels.locale}
          <select value={quizLocale} onChange={(event) => setQuizLocale(event.target.value === "en" ? "en" : "de")}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          {labels.status}
          <select value={status} onChange={(event) => setStatus(event.target.value === "published" ? "published" : "draft")}>
            <option value="draft">{labels.draft}</option>
            <option value="published">{labels.published}</option>
          </select>
        </label>
        <label>
          {labels.availableFrom}
          <input type="datetime-local" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} />
        </label>
        <label>
          {labels.availableUntil}
          <input type="datetime-local" value={availableUntil} onChange={(event) => setAvailableUntil(event.target.value)} />
        </label>
        <label>
          {labels.monthlyPeriod}
          <input type="month" value={monthlyPeriod} onChange={(event) => setMonthlyPeriod(event.target.value)} />
        </label>
        <label>
          {labels.timeLimit}
          <input type="number" min="1" value={timeLimitSeconds} onChange={(event) => setTimeLimitSeconds(Number(event.target.value))} />
        </label>
        <label>
          {labels.points}
          <input type="number" min="1" value={pointsPerCorrect} onChange={(event) => setPointsPerCorrect(Number(event.target.value))} />
        </label>
        <label>
          {labels.speedBonus}
          <input type="number" min="0" value={speedBonusMax} onChange={(event) => setSpeedBonusMax(Number(event.target.value))} />
        </label>
        <label>
          {labels.xp}
          <input type="number" min="0" value={xpReward} onChange={(event) => setXpReward(Number(event.target.value))} />
        </label>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={allowRetake} onChange={(event) => setAllowRetake(event.target.checked)} />
          {labels.allowRetake}
        </label>
      </section>

      <section className={styles.questionList}>
        {questions.map((question, questionIndex) => (
          <article key={questionIndex} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <h2>{labels.question} {questionIndex + 1}</h2>
              {questions.length > 1 ? (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}
                  aria-label="Remove question"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
            <label>
              ID
              <input value={question.id} onChange={(event) => updateQuestion(questionIndex, { id: event.target.value })} />
            </label>
            <label>
              {labels.question}
              <textarea value={question.prompt} onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })} />
            </label>
            <div className={styles.optionList}>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className={styles.optionRow}>
                  <input
                    className={styles.optionId}
                    value={option.id}
                    onChange={(event) => {
                      const previousId = option.id;
                      const nextId = event.target.value;
                      updateOption(questionIndex, optionIndex, { id: nextId });
                      if (question.correctOptionId === previousId) {
                        updateQuestion(questionIndex, { correctOptionId: nextId });
                      }
                    }}
                    aria-label={`${labels.answer} ID`}
                  />
                  <input
                    value={option.label}
                    onChange={(event) => updateOption(questionIndex, optionIndex, { label: event.target.value })}
                    placeholder={`${labels.answer} ${optionIndex + 1}`}
                  />
                  <label className={styles.correctLabel}>
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={question.correctOptionId === option.id}
                      onChange={() => updateQuestion(questionIndex, { correctOptionId: option.id })}
                    />
                    {labels.correct}
                  </label>
                  {question.options.length > 2 ? (
                    <button type="button" className={styles.iconButton} onClick={() => removeOption(questionIndex, optionIndex)}>
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button type="button" className={styles.secondaryButton} onClick={() => addOption(questionIndex)}>
              <Plus size={16} />
              {labels.addAnswer}
            </button>
          </article>
        ))}
      </section>

      <div className={styles.actionBar}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setQuestions((current) => [...current, makeQuestion(current.length)])}
        >
          <Plus size={16} />
          {labels.addQuestion}
        </button>
        <button type="button" className={styles.primaryButton} disabled={!canSave || isSaving} onClick={handleSave}>
          <Save size={16} />
          {isSaving ? labels.saving : labels.save}
        </button>
      </div>

      {message ? <p className={styles.successMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}
        </>
      ) : null}

      {user && !isAdmin && message ? <p className={styles.successMessage}>{message}</p> : null}
      {user && !isAdmin && error ? <p className={styles.errorMessage}>{error}</p> : null}
    </main>
  );
}

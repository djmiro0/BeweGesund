/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { initializeApp, cert, applicationDefault } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

const SOURCE_FILE = process.env.QUIZ_SOURCE_FILE
  || "/Users/dmirosavljevic/.codex/attachments/46116928-ba79-46f3-9b8e-6569691db5fa/pasted-text.txt";
const TRANSLATIONS_FILE = path.join(__dirname, "health-quiz-translations.tsv");
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "sandrin-app";
const SERVICE_ACCOUNT_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const DRY_RUN = process.argv.includes("--dry-run");
const USE_FIREBASE_CLI_AUTH = process.argv.includes("--use-firebase-cli-auth");

function parseSource() {
  const text = fs.readFileSync(SOURCE_FILE, "utf8");
  const blocks = [...text.matchAll(/(?:^|\n)(\d+)\. ([\s\S]*?)(?=\n\d+\. |$)/g)];

  return blocks.map((match) => {
    const body = match[2].trim();
    const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
    const optionLines = lines.filter((line) => /^\* [ABC]\)/.test(line));
    const options = optionLines.map((line) => {
      const option = line.match(/^\* ([ABC])\)\s*(.*)$/);
      if (!option) throw new Error(`Invalid option line: ${line}`);

      return {
        id: option[1].toLowerCase(),
        correct: /\(TAČNO\)/.test(line),
      };
    });
    const correctOptionId = options.find((option) => option.correct)?.id;

    if (options.length !== 3 || !correctOptionId) {
      throw new Error(`Question ${match[1]} is missing options or a correct answer.`);
    }

    return {
      number: Number(match[1]),
      id: `q${match[1]}`,
      correctOptionId,
    };
  });
}

function parseTranslations() {
  const lines = fs.readFileSync(TRANSLATIONS_FILE, "utf8")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line && !line.startsWith("#"));
  const translations = new Map();

  for (const line of lines) {
    const [locale, number, prompt, a, b, c] = line.split("\t");

    if (!locale || !number || !prompt || !a || !b || !c) {
      throw new Error(`Invalid translation line: ${line}`);
    }

    translations.set(`${locale}:${number}`, {
      id: `q${number}`,
      prompt,
      options: [
        { id: "a", label: a },
        { id: "b", label: b },
        { id: "c", label: c },
      ],
    });
  }

  return translations;
}

function buildQuiz(locale, sourceQuestions, translations) {
  const questions = sourceQuestions.map((sourceQuestion) => {
    const translated = translations.get(`${locale}:${sourceQuestion.number}`);
    if (!translated) {
      throw new Error(`Missing ${locale} translation for question ${sourceQuestion.number}.`);
    }

    return translated;
  });
  const answers = Object.fromEntries(sourceQuestions.map((question) => [question.id, question.correctOptionId]));

  return {
    quizId: `daily-health-knowledge-${locale}`,
    publicQuiz: {
      title: locale === "de" ? "Tägliches Gesundheitsquiz" : "Daily Health Quiz",
      description: locale === "de"
        ? "Jeden Tag 5 kurze Fragen zu Ernährung, Training, mentaler Gesundheit und Prävention."
        : "Every day, 5 short questions about nutrition, training, mental health, and prevention.",
      locale,
      status: "published",
      monthlyPeriod: new Date().toISOString().slice(0, 7),
      timeLimitSeconds: 30,
      allowRetake: false,
      pointsPerCorrect: 100,
      speedBonusMax: 50,
      xpReward: 10,
      questions,
      updatedAt: FieldValue.serverTimestamp(),
    },
    answerKey: {
      answers,
      updatedAt: FieldValue.serverTimestamp(),
    },
  };
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };

  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .filter(([, nestedValue]) => nestedValue !== undefined)
            .map(([key, nestedValue]) => [key, firestoreValue(nestedValue)]),
        ),
      },
    };
  }

  throw new Error(`Unsupported Firestore value: ${value}`);
}

function firestoreDocument(data) {
  return {
    fields: Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, firestoreValue(value)]),
    ),
  };
}

function firebaseCliAccessToken() {
  const output = execFileSync("npx", ["firebase-tools", "login:list", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(output);
  const token = parsed.result?.[0]?.tokens?.access_token;

  if (typeof token !== "string" || !token) {
    throw new Error("Firebase CLI is not logged in or did not return an access token.");
  }

  return token;
}

async function setDocumentWithRest(accessToken, collection, documentId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${documentId}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(firestoreDocument(data)),
  });

  if (!response.ok) {
    throw new Error(`Firestore REST write failed for ${collection}/${documentId}: ${response.status} ${await response.text()}`);
  }
}

async function importWithRest(quizzes) {
  const accessToken = firebaseCliAccessToken();
  const updatedAt = new Date();

  for (const quiz of quizzes) {
    await Promise.all([
      setDocumentWithRest(accessToken, "quizzes", quiz.quizId, {
        ...quiz.publicQuiz,
        updatedAt,
      }),
      setDocumentWithRest(accessToken, "quizAnswerKeys", quiz.quizId, {
        ...quiz.answerKey,
        updatedAt,
      }),
    ]);
    console.log(`Imported ${quiz.quizId}: ${quiz.publicQuiz.questions.length} questions`);
  }
}

async function main() {
  const sourceQuestions = parseSource();
  const translations = parseTranslations();

  if (sourceQuestions.length !== 100) {
    throw new Error(`Expected 100 source questions, got ${sourceQuestions.length}.`);
  }

  const missing = ["en", "de"].flatMap((locale) => (
    sourceQuestions
      .filter((question) => !translations.has(`${locale}:${question.number}`))
      .map((question) => `${locale}:${question.number}`)
  ));

  if (missing.length > 0) {
    throw new Error(`Missing translations: ${missing.join(", ")}`);
  }

  const quizzes = ["en", "de"].map((locale) => buildQuiz(locale, sourceQuestions, translations));

  if (DRY_RUN) {
    for (const quiz of quizzes) {
      console.log(`Validated ${quiz.quizId}: ${quiz.publicQuiz.questions.length} questions`);
    }
    return;
  }

  if (USE_FIREBASE_CLI_AUTH) {
    await importWithRest(quizzes);
    return;
  }

  const credential = SERVICE_ACCOUNT_FILE
    ? cert(JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, "utf8")))
    : applicationDefault();

  initializeApp({ credential, projectId: PROJECT_ID });
  const db = getFirestore();

  for (const quiz of quizzes) {
    await Promise.all([
      db.collection("quizzes").doc(quiz.quizId).set(quiz.publicQuiz, { merge: true }),
      db.collection("quizAnswerKeys").doc(quiz.quizId).set(quiz.answerKey, { merge: true }),
    ]);
    console.log(`Imported ${quiz.quizId}: ${quiz.publicQuiz.questions.length} questions`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

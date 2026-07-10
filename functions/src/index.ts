import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import {
  db,
  increment,
  LEADERBOARDS_COLLECTION,
  QUIZ_ANSWER_KEYS_COLLECTION,
  QUIZ_LEADERBOARDS_COLLECTION,
  QUIZZES_COLLECTION,
  REWARDS_COLLECTION,
  serverTimestamp,
  userRef,
} from "./firestore";
import {
  adminSetupCode,
  appBaseUrl,
  functionsBaseUrl,
  googleHealthClientId,
  googleHealthClientSecret,
  stripeBasicPriceId,
  stripePlusPriceId,
  stripeSecretKey,
  stripeWebhookSecret,
} from "./config";
import type {
  CompletionPayload,
  CheckQuizAnswerPayload,
  ContentEngagementPayload,
  ContentRewardClaimPayload,
  ContentRewardType,
  MemberPackage,
  PremiumStatus,
  QuizAnswerPayload,
  QuizAttemptPayload,
  RewardClaimPayload,
  SaveQuizPayload,
  StripeCheckoutPayload,
} from "./types";

const REGION = "europe-west3";
const appCheckCallableOptions = {
  region: REGION,
  enforceAppCheck: true,
} as const;
const authenticatedCallableOptions = {
  region: REGION,
  cors: true,
} as const;
const DAILY_QUIZ_QUESTION_COUNT = 5;
const MIN_QUIZ_QUESTION_SECONDS = 30;
const CONTENT_PROGRESS_COLLECTION = "contentProgress";
const DAILY_REWARDS_COLLECTION = "dailyRewards";
const POINTS_LEDGER_COLLECTION = "pointsLedger";
const MAX_ENGAGEMENT_SECONDS_PER_UPDATE = 30;
const MONTHLY_POINTS_FIELDS = ["monthlyPoints", "monthlyScore"];
type StripeClient = InstanceType<typeof Stripe>;
type StripeSubscription = Awaited<ReturnType<StripeClient["subscriptions"]["retrieve"]>>;
type StripeEvent = ReturnType<StripeClient["webhooks"]["constructEvent"]>;
type StripeSubscriptionStatus = StripeSubscription["status"];
type StripeCheckoutSession = Awaited<ReturnType<StripeClient["checkout"]["sessions"]["retrieve"]>>;

interface GoogleHealthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  refresh_token_expires_in?: number;
}

interface GoogleHealthIdentityResponse {
  legacyUserId?: string;
  healthUserId?: string;
}

interface GoogleHealthRollupResponse {
  rollupDataPoints?: Array<Record<string, unknown>>;
}

interface QuizQuestion {
  id: string;
  prompt?: string;
  options?: Array<{ id: string; label?: string }>;
}

interface QuizDocument {
  title?: string;
  locale?: "de" | "en";
  status?: "draft" | "published" | "archived";
  availableFrom?: { toDate?: () => Date } | string | Date;
  availableUntil?: { toDate?: () => Date } | string | Date;
  questions?: QuizQuestion[];
  timeLimitSeconds?: number;
  monthlyPeriod?: string;
  allowRetake?: boolean;
  pointsPerCorrect?: number;
  speedBonusMax?: number;
  xpReward?: number;
}

type RewardPolicy = "ONCE_PER_CONTENT" | "LIMITED_PER_DAY";
type RewardState = "LOCKED" | "AVAILABLE" | "CLAIMED" | "DAILY_LIMIT_REACHED";

interface ContentRewardConfig {
  contentType: ContentRewardType;
  requiredSeconds?: number;
  requiredDurationRatio?: number;
  rewardPolicy: RewardPolicy;
  dailyLimit?: number;
  points: number;
}

interface ContentProgressDocument {
  contentId?: string;
  contentType?: ContentRewardType;
  engagementSeconds?: number;
  requiredSeconds?: number;
  completed?: boolean;
  rewardAvailable?: boolean;
  rewardClaimed?: boolean;
  rewardClaimedAt?: unknown;
  completedAt?: unknown;
  createdAt?: unknown;
}

const CONTENT_REWARD_CONFIG: Record<ContentRewardType, ContentRewardConfig> = {
  blog: {
    contentType: "blog",
    requiredSeconds: 60,
    rewardPolicy: "ONCE_PER_CONTENT",
    points: 40,
  },
  course: {
    contentType: "course",
    requiredDurationRatio: 0.5,
    rewardPolicy: "LIMITED_PER_DAY",
    dailyLimit: 2,
    points: 40,
  },
  relaxation: {
    contentType: "relaxation",
    requiredDurationRatio: 0.5,
    rewardPolicy: "ONCE_PER_CONTENT",
    points: 30,
  },
  quiz: {
    contentType: "quiz",
    requiredSeconds: 0,
    rewardPolicy: "ONCE_PER_CONTENT",
    points: 25,
  },
};

const GOOGLE_HEALTH_PROVIDER = "googleHealth";
const GOOGLE_HEALTH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.profile.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
];

function getGoogleHealthRedirectUri() {
  return `${functionsBaseUrl.value().replace(/\/$/, "")}/googleHealthOAuthCallback`;
}

function createRandomToken() {
  return randomBytes(32).toString("base64url");
}

function getGoogleHealthTokenExpiresAt(expiresInSeconds: number) {
  return Date.now() + Math.max(60, expiresInSeconds - 60) * 1000;
}

function getCivilDateParts(date: string) {
  const [year, month, day] = date.split("-").map((part) => Number(part));

  return { year, month, day };
}

function berlinIsoDate(date = new Date(), locale = "de-DE") {
  const parts = new Intl.DateTimeFormat(locale, {
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

function todayIsoDate(locale = "de-DE") {
  return berlinIsoDate(new Date(), locale);
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return hash >>> 0;
}

function dailyQuizQuestions(questions: QuizQuestion[], dateKey: string) {
  return [...questions]
    .sort((left, right) => stableHash(`${dateKey}:${left.id}`) - stableHash(`${dateKey}:${right.id}`))
    .slice(0, DAILY_QUIZ_QUESTION_COUNT);
}

function requireAuth(auth: { uid: string } | null | undefined) {
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return auth.uid;
}

function toDate(value: QuizDocument["availableFrom"]) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const timestampDate = value.toDate?.();
  return timestampDate instanceof Date ? timestampDate : null;
}

function currentMonthPeriod(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}

function requireStringId(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim() || value.length > 160) {
    throw new HttpsError("invalid-argument", `${fieldName} is required.`);
  }

  return value.trim();
}

function requireContentType(value: unknown): ContentRewardType {
  if (
    value !== "blog"
    && value !== "course"
    && value !== "relaxation"
    && value !== "quiz"
  ) {
    throw new HttpsError("invalid-argument", "contentType is invalid.");
  }

  return value;
}

function getContentRewardConfig(contentType: ContentRewardType) {
  return CONTENT_REWARD_CONFIG[contentType];
}

function calculateRequiredSeconds(config: ContentRewardConfig, durationSeconds?: number) {
  if (typeof config.requiredSeconds === "number") return config.requiredSeconds;

  if (
    typeof config.requiredDurationRatio === "number"
    && typeof durationSeconds === "number"
    && Number.isFinite(durationSeconds)
    && durationSeconds > 0
  ) {
    return Math.max(1, Math.ceil(durationSeconds * config.requiredDurationRatio));
  }

  throw new HttpsError("invalid-argument", "durationSeconds is required for this content type.");
}

function getRewardState(
  progress: Pick<ContentProgressDocument, "completed" | "rewardAvailable" | "rewardClaimed">,
  dailyLimitReached = false,
): RewardState {
  if (progress.rewardClaimed) return "CLAIMED";
  if (dailyLimitReached) return "DAILY_LIMIT_REACHED";
  if (progress.completed || progress.rewardAvailable) return "AVAILABLE";
  return "LOCKED";
}

function getContentProgressRef(uid: string, contentId: string) {
  return userRef(uid).collection(CONTENT_PROGRESS_COLLECTION).doc(contentId);
}

function buildUserPointIncrements(points: number) {
  return MONTHLY_POINTS_FIELDS.reduce<Record<string, ReturnType<typeof increment>>>(
    (updates, field) => ({
      ...updates,
      [field]: increment(points),
    }),
    {
      points: increment(points),
      totalPoints: increment(points),
    },
  );
}

function publicDisplayName(profile: FirebaseFirestore.DocumentSnapshot) {
  const firstName = profile.get("firstName");
  const displayName = profile.get("displayName");

  if (typeof firstName === "string" && firstName.trim()) return firstName.trim();
  if (typeof displayName === "string" && displayName.trim()) return displayName.trim();

  return "Member";
}

function numericProfileField(profile: FirebaseFirestore.DocumentSnapshot, field: string) {
  const value = profile.get(field);

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function updateRegionalLeaderboardEntries(
  transaction: FirebaseFirestore.Transaction,
  profile: FirebaseFirestore.DocumentSnapshot,
  uid: string,
  pointsGain: number,
) {
  if (pointsGain <= 0) return;

  const regionKey = profile.get("regionKey");
  if (typeof regionKey !== "string" || !regionKey.trim()) return;

  const displayName = publicDisplayName(profile);
  const leaderboardUpdates = [
    { period: "weekly", scoreField: "weeklyScore" },
    { period: "monthly", scoreField: "monthlyScore" },
  ] as const;

  leaderboardUpdates.forEach(({ period, scoreField }) => {
    const entryRef = db
      .collection(LEADERBOARDS_COLLECTION)
      .doc(period)
      .collection("regions")
      .doc(regionKey)
      .collection("entries")
      .doc(uid);

    transaction.set(entryRef, {
      userId: uid,
      displayName,
      regionKey,
      score: numericProfileField(profile, scoreField) + pointsGain,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

async function assertContentExists(contentId: string, contentType: ContentRewardType) {
  if (contentType !== "quiz") return;

  const quizSnapshot = await db.collection(QUIZZES_COLLECTION).doc(contentId).get();
  if (!quizSnapshot.exists) {
    throw new HttpsError("not-found", "Content does not exist.");
  }
}

async function claimContentRewardForUser(
  uid: string,
  contentId: string,
  contentType: ContentRewardType,
  transaction: FirebaseFirestore.Transaction,
) {
  const config = getContentRewardConfig(contentType);
  const profileRef = userRef(uid);
  const progressRef = getContentProgressRef(uid, contentId);
  const today = todayIsoDate();
  const dailyRewardRef = profileRef.collection(DAILY_REWARDS_COLLECTION).doc(today);
  const ledgerRef = profileRef.collection(POINTS_LEDGER_COLLECTION).doc(`${contentType}_${contentId}`);
  const reads = [transaction.get(profileRef), transaction.get(progressRef), transaction.get(ledgerRef)];

  if (config.rewardPolicy === "LIMITED_PER_DAY") reads.push(transaction.get(dailyRewardRef));

  const [profileSnapshot, progressSnapshot, ledgerSnapshot, dailyRewardSnapshot] = await Promise.all(reads);

  if (!profileSnapshot.exists) {
    throw new HttpsError("failed-precondition", "User profile does not exist.");
  }

  if (!progressSnapshot.exists) {
    throw new HttpsError("failed-precondition", "Content progress does not exist.");
  }

  if (ledgerSnapshot.exists) {
    const progress = progressSnapshot.data() as ContentProgressDocument;
    return {
      ok: true,
      alreadyClaimed: true,
      pointsGain: 0,
      rewardState: getRewardState({ ...progress, rewardClaimed: true }),
    };
  }

  const progress = progressSnapshot.data() as ContentProgressDocument;
  const engagementSeconds = Math.max(0, Math.floor(progress.engagementSeconds ?? 0));
  const requiredSeconds = Math.max(0, Math.floor(progress.requiredSeconds ?? 0));

  if (progress.contentType !== contentType || progress.contentId !== contentId) {
    throw new HttpsError("failed-precondition", "Content progress does not match this reward.");
  }

  if (progress.rewardClaimed) {
    return {
      ok: true,
      alreadyClaimed: true,
      pointsGain: 0,
      rewardState: "CLAIMED" as RewardState,
    };
  }

  if (engagementSeconds < requiredSeconds) {
    throw new HttpsError("failed-precondition", "Required engagement has not been reached.");
  }

  const dailyRewardData = dailyRewardSnapshot?.exists
    ? dailyRewardSnapshot.data() as { courseRewardCount?: number; rewardedContentIds?: string[] }
    : null;
  const rewardedContentIds = dailyRewardData?.rewardedContentIds ?? [];
  const dailyLimitReached = config.rewardPolicy === "LIMITED_PER_DAY"
    && !rewardedContentIds.includes(contentId)
    && (dailyRewardData?.courseRewardCount ?? 0) >= (config.dailyLimit ?? 0);

  if (dailyLimitReached) {
    transaction.set(progressRef, {
      rewardAvailable: true,
      dailyLimitReached: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      ok: true,
      alreadyClaimed: false,
      pointsGain: 0,
      rewardState: "DAILY_LIMIT_REACHED" as RewardState,
    };
  }

  transaction.set(progressRef, {
    completed: true,
    rewardAvailable: false,
    rewardClaimed: true,
    rewardClaimedAt: serverTimestamp(),
    dailyLimitReached: false,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  transaction.set(ledgerRef, {
    contentId,
    contentType,
    points: config.points,
    reason: "content_reward",
    createdAt: serverTimestamp(),
  });

  transaction.update(profileRef, {
    ...buildUserPointIncrements(config.points),
    updatedAt: serverTimestamp(),
  });
  updateRegionalLeaderboardEntries(transaction, profileSnapshot, uid, config.points);

  if (config.rewardPolicy === "LIMITED_PER_DAY") {
    transaction.set(dailyRewardRef, {
      date: today,
      courseRewardCount: increment(1),
      rewardedContentIds: Array.from(new Set([...rewardedContentIds, contentId])),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  return {
    ok: true,
    alreadyClaimed: false,
    pointsGain: config.points,
    rewardState: "CLAIMED" as RewardState,
  };
}

function normalizeQuizAnswers(answers: QuizAnswerPayload[] | undefined) {
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > 80) {
    throw new HttpsError("invalid-argument", "answers are required.");
  }

  return answers.map((answer) => ({
    questionId: requireStringId(answer.questionId, "questionId"),
    optionId: typeof answer.optionId === "string" && answer.optionId.trim()
      ? requireStringId(answer.optionId, "optionId")
      : null,
    answeredAtMs: typeof answer.answeredAtMs === "number" && Number.isFinite(answer.answeredAtMs)
      ? Math.max(0, Math.round(answer.answeredAtMs))
      : null,
  }));
}

async function requireAdmin(uid: string) {
  const snapshot = await userRef(uid).get();
  const roles = snapshot.get("roles");

  if (!Array.isArray(roles) || !roles.includes("admin")) {
    throw new HttpsError("permission-denied", "Admin access is required.");
  }
}

async function hasAnyAdmin() {
  const snapshot = await db
    .collection("users")
    .where("roles", "array-contains", "admin")
    .limit(1)
    .get();

  return !snapshot.empty;
}

function normalizeRoles(value: unknown) {
  const roles = Array.isArray(value) ? value.filter((role): role is string => typeof role === "string") : [];

  return Array.from(new Set([...roles, "member", "admin"]));
}

function optionalDate(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${fieldName} must be an ISO date string.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpsError("invalid-argument", `${fieldName} is invalid.`);
  }

  return date;
}

function normalizeSaveQuizPayload(payload: SaveQuizPayload) {
  const quizId = requireStringId(payload.quizId, "quizId");
  const title = requireStringId(payload.title, "title");
  const locale = payload.locale === "en" ? "en" : "de";
  const status = payload.status === "published" ? "published" : "draft";
  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  if (questions.length === 0 || questions.length > 80) {
    throw new HttpsError("invalid-argument", "At least one question is required.");
  }

  const answerMap: Record<string, string> = {};
  const normalizedQuestions = questions.map((question, questionIndex) => {
    const questionId = requireStringId(question.id || `q${questionIndex + 1}`, "questionId");
    const prompt = requireStringId(question.prompt, "prompt");
    const options = Array.isArray(question.options) ? question.options : [];

    if (options.length < 2 || options.length > 8) {
      throw new HttpsError("invalid-argument", "Each question needs 2 to 8 answers.");
    }

    const normalizedOptions = options.map((option, optionIndex) => ({
      id: requireStringId(option.id || `a${optionIndex + 1}`, "optionId"),
      label: requireStringId(option.label, "optionLabel"),
    }));
    const optionIds = new Set(normalizedOptions.map((option) => option.id));
    const correctOptionId = requireStringId(question.correctOptionId, "correctOptionId");

    if (!optionIds.has(correctOptionId)) {
      throw new HttpsError("invalid-argument", "Correct answer must match one of the options.");
    }

    answerMap[questionId] = correctOptionId;

    return {
      id: questionId,
      prompt,
      options: normalizedOptions,
    };
  });

  const availableFrom = optionalDate(payload.availableFrom, "availableFrom");
  const availableUntil = optionalDate(payload.availableUntil, "availableUntil");

  if (availableFrom && availableUntil && availableUntil.getTime() <= availableFrom.getTime()) {
    throw new HttpsError("invalid-argument", "availableUntil must be after availableFrom.");
  }

  return {
    quizId,
    publicQuiz: {
      title,
      description: typeof payload.description === "string" ? payload.description.trim() : "",
      locale,
      status,
      availableFrom,
      availableUntil,
      monthlyPeriod: typeof payload.monthlyPeriod === "string" ? payload.monthlyPeriod.trim() : currentMonthPeriod(),
      timeLimitSeconds: Number.isFinite(payload.timeLimitSeconds)
        ? Math.max(MIN_QUIZ_QUESTION_SECONDS, Math.round(payload.timeLimitSeconds ?? MIN_QUIZ_QUESTION_SECONDS))
        : MIN_QUIZ_QUESTION_SECONDS,
      allowRetake: payload.allowRetake === true,
      pointsPerCorrect: Number.isFinite(payload.pointsPerCorrect) ? Math.max(1, Math.round(payload.pointsPerCorrect ?? 100)) : 100,
      speedBonusMax: Number.isFinite(payload.speedBonusMax) ? Math.max(0, Math.round(payload.speedBonusMax ?? 50)) : 50,
      xpReward: Number.isFinite(payload.xpReward) ? Math.max(0, Math.round(payload.xpReward ?? 10)) : 10,
      questions: normalizedQuestions,
      updatedAt: serverTimestamp(),
    },
    answerKey: {
      answers: answerMap,
      updatedAt: serverTimestamp(),
    },
  };
}

function getQuizAvailability(quiz: QuizDocument, now: Date) {
  const availableFrom = toDate(quiz.availableFrom);
  const availableUntil = toDate(quiz.availableUntil);

  return {
    availableFrom,
    availableUntil,
    isOpen: (!availableFrom || availableFrom.getTime() <= now.getTime())
      && (!availableUntil || availableUntil.getTime() >= now.getTime()),
  };
}

function requireRecentSignIn(authTime: unknown) {
  const authTimeSeconds = typeof authTime === "number" ? authTime : Number(authTime);
  const fiveMinutesInSeconds = 5 * 60;

  if (!Number.isFinite(authTimeSeconds) || Date.now() / 1000 - authTimeSeconds > fiveMinutesInSeconds) {
    throw new HttpsError("failed-precondition", "Recent sign-in is required before deleting the account.");
  }
}

function computeStreak(lastCompletedAt: Date | null, completedAt: Date) {
  if (!lastCompletedAt) {
    return 1;
  }

  const previous = new Date(lastCompletedAt);
  previous.setHours(0, 0, 0, 0);

  const current = new Date(completedAt);
  current.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((current.getTime() - previous.getTime()) / 86400000);

  if (diffDays <= 0) {
    return null;
  }

  if (diffDays === 1) {
    return "increment";
  }

  return "reset";
}

function createStripeClient() {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: "2026-05-27.dahlia",
  });
}

function getBillingReturnUrl(locale: unknown) {
  const safeLocale = locale === "en" ? "en" : "de";
  return `${appBaseUrl.value().replace(/\/$/, "")}/${safeLocale}/profile`;
}

function getCheckoutReturnUrl(locale: unknown) {
  const safeLocale = locale === "en" ? "en" : "de";
  return `${appBaseUrl.value().replace(/\/$/, "")}/${safeLocale}`;
}

function getStripePriceId(memberPackage: MemberPackage) {
  return memberPackage === "plus" ? stripePlusPriceId.value() : stripeBasicPriceId.value();
}

function getMemberPackageForPrice(priceId: string | undefined): MemberPackage {
  if (priceId === stripeBasicPriceId.value()) return "basic";
  if (priceId === stripePlusPriceId.value()) return "plus";

  throw new Error(`Unknown Stripe Price ID: ${priceId ?? "missing"}`);
}

function getStripeCustomerId(customer: StripeSubscription["customer"]) {
  return typeof customer === "string" ? customer : customer.id;
}

function getInternalSubscriptionStatus(status: StripeSubscriptionStatus): PremiumStatus {
  if (status === "trialing" || status === "active") return status;
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "canceled";
}

function subscriptionAccess(subscription: StripeSubscription) {
  const internalStatus = getInternalSubscriptionStatus(subscription.status);

  return {
    memberPackage: getMemberPackageForPrice(subscription.items.data[0]?.price.id),
    premiumStatus: internalStatus,
    subscriptionStatus: internalStatus,
    stripeSubscriptionStatus: subscription.status,
  };
}

async function syncStripeSubscription(subscription: StripeSubscription, fallbackUid?: string | null) {
  const uid = subscription.metadata.uid || fallbackUid;

  if (!uid) {
    logger.warn("Stripe subscription is missing Firebase uid metadata.", {
      subscriptionId: subscription.id,
    });
    return;
  }

  const subscriptionItem = subscription.items.data[0];
  const customerId = getStripeCustomerId(subscription.customer);
  const access = subscriptionAccess(subscription);

  await userRef(uid).set(
    {
      ...access,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await userRef(uid).collection("subscriptions").doc(subscription.id).set(
    {
      subscriptionId: subscription.id,
      customerId,
      priceId: subscriptionItem?.price.id ?? null,
      status: subscription.status,
      currentPeriodEnd: subscriptionItem?.current_period_end ?? null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function syncStripeCheckoutSession(stripe: StripeClient, session: StripeCheckoutSession) {
  if (session.mode !== "subscription") return;

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) {
    logger.warn("Stripe checkout session is missing subscription.", {
      sessionId: session.id,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription, session.client_reference_id ?? session.metadata?.uid);
}

async function applyCompletion(userId: string, kind: "lesson" | "workout", payload: CompletionPayload) {
  const itemId = kind === "lesson" ? payload.lessonId : payload.workoutId;

  if (!itemId || itemId.length > 160) {
    throw new HttpsError("invalid-argument", `${kind}Id is required.`);
  }

  const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
  if (Number.isNaN(completedAt.getTime()) || completedAt.getTime() > Date.now() + 60_000) {
    throw new HttpsError("invalid-argument", "completedAt is invalid.");
  }
  const completionCollection = kind === "lesson" ? "lessonCompletions" : "workoutCompletions";
  const xpGain = kind === "lesson" ? 20 : 35;
  const pointsGain = kind === "lesson" ? 10 : 20;

  const ref = userRef(userId);

  return db.runTransaction(async (transaction) => {
    const completionRef = ref.collection(completionCollection).doc(itemId);
    const [snapshot, completionSnapshot] = await Promise.all([
      transaction.get(ref),
      transaction.get(completionRef),
    ]);

    if (!snapshot.exists) {
      throw new HttpsError("failed-precondition", "User profile does not exist.");
    }

    if (completionSnapshot.exists) {
      return { ok: true, alreadyCompleted: true, xpGain: 0, pointsGain: 0 };
    }

    const data = snapshot.data() as {
      currentStreak?: number;
      longestStreak?: number;
      lastCompletedAt?: { toDate?: () => Date };
    };

    const lastCompletedAt = data.lastCompletedAt?.toDate?.() ?? null;
    const streakMode = computeStreak(lastCompletedAt, completedAt);
    const currentStreak =
      streakMode === null
        ? data.currentStreak ?? 0
        : streakMode === "increment"
          ? (data.currentStreak ?? 0) + 1
          : 1;

    const longestStreak = Math.max(data.longestStreak ?? 0, currentStreak);

    transaction.set(
      completionRef,
      {
        userId,
        completedAt,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    transaction.update(ref, {
      xp: increment(xpGain),
      points: increment(pointsGain),
      weeklyScore: increment(pointsGain),
      monthlyScore: increment(pointsGain),
      currentStreak,
      longestStreak,
      lastCompletedAt: completedAt,
      updatedAt: serverTimestamp(),
    });
    updateRegionalLeaderboardEntries(transaction, snapshot, userId, pointsGain);

    return {
      ok: true,
      xpGain,
      pointsGain,
      currentStreak,
      longestStreak,
    };
  });
}

export const updateContentEngagement = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  const payload = request.data as ContentEngagementPayload;
  const contentId = requireStringId(payload.contentId, "contentId");
  const contentType = requireContentType(payload.contentType);
  const config = getContentRewardConfig(contentType);
  const engagementDelta = typeof payload.engagementSeconds === "number" && Number.isFinite(payload.engagementSeconds)
    ? Math.max(0, Math.min(MAX_ENGAGEMENT_SECONDS_PER_UPDATE, Math.floor(payload.engagementSeconds)))
    : 0;
  const durationSeconds = typeof payload.durationSeconds === "number" && Number.isFinite(payload.durationSeconds)
    ? Math.max(1, Math.floor(payload.durationSeconds))
    : undefined;
  const requiredSeconds = calculateRequiredSeconds(config, durationSeconds);

  if (engagementDelta <= 0 && requiredSeconds > 0) {
    throw new HttpsError("invalid-argument", "engagementSeconds must be greater than 0.");
  }

  await assertContentExists(contentId, contentType);

  const progressRef = getContentProgressRef(uid, contentId);

  return db.runTransaction(async (transaction) => {
    const progressSnapshot = await transaction.get(progressRef);
    const existing = progressSnapshot.exists ? progressSnapshot.data() as ContentProgressDocument : null;

    if (existing?.contentType && existing.contentType !== contentType) {
      throw new HttpsError("failed-precondition", "Content progress exists for a different content type.");
    }

    const currentEngagementSeconds = Math.max(0, Math.floor(existing?.engagementSeconds ?? 0));
    const nextEngagementSeconds = existing?.rewardClaimed
      ? currentEngagementSeconds
      : Math.max(currentEngagementSeconds, currentEngagementSeconds + engagementDelta);
    const completed = nextEngagementSeconds >= requiredSeconds;
    const completedAt = existing?.completedAt ?? (completed ? serverTimestamp() : null);

    transaction.set(progressRef, {
      contentId,
      contentType,
      engagementSeconds: nextEngagementSeconds,
      requiredSeconds,
      completed,
      rewardAvailable: completed && !existing?.rewardClaimed,
      rewardClaimed: existing?.rewardClaimed ?? false,
      rewardClaimedAt: existing?.rewardClaimedAt ?? null,
      dailyLimitReached: false,
      completedAt,
      createdAt: progressSnapshot.exists ? existing?.createdAt ?? serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      ok: true,
      contentId,
      contentType,
      engagementSeconds: nextEngagementSeconds,
      requiredSeconds,
      completed,
      rewardState: getRewardState({
        completed,
        rewardAvailable: completed && !existing?.rewardClaimed,
        rewardClaimed: existing?.rewardClaimed ?? false,
      }),
    };
  });
});

export const claimContentReward = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  const payload = request.data as ContentRewardClaimPayload;
  const contentId = requireStringId(payload.contentId, "contentId");
  const contentType = requireContentType(payload.contentType);

  await assertContentExists(contentId, contentType);

  return db.runTransaction((transaction) => claimContentRewardForUser(uid, contentId, contentType, transaction));
});

export const deleteUserAccount = onCall(
  {
    ...appCheckCallableOptions,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    const uid = requireAuth(request.auth);
    requireRecentSignIn(request.auth?.token.auth_time);

    const ref = userRef(uid);
    const profileSnapshot = await ref.get();
    const subscriptionId = profileSnapshot.get("stripeSubscriptionId") as string | undefined;

    if (subscriptionId) {
      const stripe = createStripeClient();

      try {
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          metadata: { uid: "" },
        });

        if (subscription.status !== "canceled") {
          await stripe.subscriptions.cancel(subscriptionId);
        }
      } catch (error) {
        logger.error("Stripe subscription cancellation failed during account deletion.", {
          uid,
          subscriptionId,
          error,
        });
        throw new HttpsError(
          "failed-precondition",
          "The subscription could not be canceled. The account was not deleted.",
        );
      }
    }

    await db.recursiveDelete(ref);
    await getAuth().deleteUser(uid);

    logger.info("User account deleted", { uid });
    return { ok: true };
  },
);

export const completeLesson = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  return applyCompletion(uid, "lesson", request.data as CompletionPayload);
});

export const completeWorkout = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  return applyCompletion(uid, "workout", request.data as CompletionPayload);
});

export const claimFirstAdmin = onCall(
  {
    ...appCheckCallableOptions,
    secrets: [adminSetupCode],
  },
  async (request) => {
    const uid = requireAuth(request.auth);
    const setupCode = typeof request.data?.setupCode === "string" ? request.data.setupCode.trim() : "";

    if (!setupCode || setupCode !== adminSetupCode.value()) {
      throw new HttpsError("permission-denied", "The admin setup code is invalid.");
    }

    if (await hasAnyAdmin()) {
      throw new HttpsError("failed-precondition", "An admin already exists.");
    }

    const ref = userRef(uid);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new HttpsError("failed-precondition", "User profile does not exist.");
    }

    await ref.set({
      roles: normalizeRoles(snapshot.get("roles")),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    logger.info("First admin claimed", { uid });
    return { ok: true };
  },
);

export const saveQuiz = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  await requireAdmin(uid);

  const { quizId, publicQuiz, answerKey } = normalizeSaveQuizPayload(request.data as SaveQuizPayload);

  await Promise.all([
    db.collection(QUIZZES_COLLECTION).doc(quizId).set(publicQuiz, { merge: true }),
    db.collection(QUIZ_ANSWER_KEYS_COLLECTION).doc(quizId).set(answerKey, { merge: true }),
  ]);

  logger.info("Quiz saved", { quizId, uid, status: publicQuiz.status });
  return { ok: true, quizId };
});

export const checkQuizAnswer = onCall(authenticatedCallableOptions, async (request) => {
  requireAuth(request.auth);

  const payload = request.data as CheckQuizAnswerPayload;
  const quizId = requireStringId(payload.quizId, "quizId");
  const questionId = requireStringId(payload.questionId, "questionId");
  const optionId = requireStringId(payload.optionId, "optionId");
  const answeredAt = payload.answeredAt ? new Date(payload.answeredAt) : new Date();

  if (Number.isNaN(answeredAt.getTime()) || answeredAt.getTime() > Date.now() + 60_000) {
    throw new HttpsError("invalid-argument", "answeredAt is invalid.");
  }

  const [quizSnapshot, answerKeySnapshot] = await Promise.all([
    db.collection(QUIZZES_COLLECTION).doc(quizId).get(),
    db.collection(QUIZ_ANSWER_KEYS_COLLECTION).doc(quizId).get(),
  ]);

  if (!quizSnapshot.exists) {
    throw new HttpsError("not-found", "Quiz does not exist.");
  }

  const quiz = quizSnapshot.data() as QuizDocument;
  if (quiz.status !== "published") {
    throw new HttpsError("failed-precondition", "Quiz is not published.");
  }

  const availability = getQuizAvailability(quiz, answeredAt);
  if (!availability.isOpen) {
    throw new HttpsError("failed-precondition", "Quiz is not currently available.");
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const quizDay = berlinIsoDate(answeredAt);
  const dailyQuestionIds = new Set(dailyQuizQuestions(questions, quizDay).map((question) => question.id));

  if (!dailyQuestionIds.has(questionId)) {
    throw new HttpsError("invalid-argument", "Question is not part of today's quiz.");
  }

  const answerKey = answerKeySnapshot.data() as { answers?: Record<string, unknown> } | undefined;
  const correctOptionId = answerKey?.answers?.[questionId];

  if (typeof correctOptionId !== "string") {
    throw new HttpsError("failed-precondition", "Quiz answer key is incomplete.");
  }

  return {
    ok: true,
    questionId,
    optionId,
    correctOptionId,
    correct: optionId === correctOptionId,
  };
});

export const submitQuizAttempt = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  const payload = request.data as QuizAttemptPayload;
  const quizId = requireStringId(payload.quizId, "quizId");
  const answers = normalizeQuizAnswers(payload.answers);
  const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();

  if (Number.isNaN(completedAt.getTime()) || completedAt.getTime() > Date.now() + 60_000) {
    throw new HttpsError("invalid-argument", "completedAt is invalid.");
  }

  const durationMs = typeof payload.durationMs === "number" && Number.isFinite(payload.durationMs)
    ? Math.max(0, Math.round(payload.durationMs))
    : null;
  const quizRef = db.collection(QUIZZES_COLLECTION).doc(quizId);
  const answerKeyRef = db.collection(QUIZ_ANSWER_KEYS_COLLECTION).doc(quizId);
  const profileRef = userRef(uid);
  const quizDay = berlinIsoDate(completedAt);
  const attemptRef = profileRef.collection("quizAttempts").doc(`${quizId}_${quizDay}`);

  return db.runTransaction(async (transaction) => {
    const [profileSnapshot, attemptSnapshot, quizSnapshot, answerKeySnapshot] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(attemptRef),
      transaction.get(quizRef),
      transaction.get(answerKeyRef),
    ]);

    if (!profileSnapshot.exists) {
      throw new HttpsError("failed-precondition", "User profile does not exist.");
    }

    if (!quizSnapshot.exists) {
      throw new HttpsError("not-found", "Quiz does not exist.");
    }

    const quiz = quizSnapshot.data() as QuizDocument;
    if (quiz.status !== "published") {
      throw new HttpsError("failed-precondition", "Quiz is not published.");
    }

    const availability = getQuizAvailability(quiz, completedAt);
    if (!availability.isOpen) {
      throw new HttpsError("failed-precondition", "Quiz is not currently available.");
    }

    if (attemptSnapshot.exists && !quiz.allowRetake) {
      const previousAttempt = attemptSnapshot.data() as {
        score?: number;
        correctCount?: number;
        totalQuestions?: number;
        speedBonus?: number;
        answers?: unknown;
      };

      return {
        ok: true,
        alreadySubmitted: true,
        score: previousAttempt.score ?? 0,
        correctCount: previousAttempt.correctCount ?? 0,
        totalQuestions: previousAttempt.totalQuestions ?? 0,
        speedBonus: previousAttempt.speedBonus ?? 0,
        answers: Array.isArray(previousAttempt.answers) ? previousAttempt.answers : [],
        xpGain: 0,
        pointsGain: 0,
      };
    }

    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    if (questions.length === 0) {
      throw new HttpsError("failed-precondition", "Quiz does not have questions.");
    }

    const answerKey = answerKeySnapshot.data() as { answers?: Record<string, unknown> } | undefined;
    if (!answerKey?.answers || typeof answerKey.answers !== "object") {
      throw new HttpsError("failed-precondition", "Quiz answer key is missing.");
    }

    const dailyQuestions = dailyQuizQuestions(questions, quizDay);
    const questionIds = new Set(dailyQuestions.map((question) => question.id));
    const submittedByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
    const correctAnswers = Object.entries(answerKey.answers).filter(([questionId, optionId]) => (
      questionIds.has(questionId) && typeof optionId === "string"
    ));

    if (correctAnswers.length !== dailyQuestions.length) {
      throw new HttpsError("failed-precondition", "Daily quiz answer key is incomplete.");
    }

    let correctCount = 0;
    const scoredAnswers = correctAnswers.map(([questionId, correctOptionId]) => {
      const submitted = submittedByQuestion.get(questionId);
      const isCorrect = submitted?.optionId === correctOptionId;
      if (isCorrect) correctCount += 1;

      return {
        questionId,
        optionId: submitted?.optionId ?? null,
        correctOptionId,
        correct: isCorrect,
        answeredAtMs: submitted?.answeredAtMs ?? null,
      };
    });

    const totalQuestions = correctAnswers.length;
    const pointsPerCorrect = Number.isFinite(quiz.pointsPerCorrect) ? Math.max(1, quiz.pointsPerCorrect ?? 100) : 100;
    const speedBonusMax = Number.isFinite(quiz.speedBonusMax) ? Math.max(0, quiz.speedBonusMax ?? 50) : 50;
    const secondsPerQuestion = Number.isFinite(quiz.timeLimitSeconds) && quiz.timeLimitSeconds
      ? Math.max(MIN_QUIZ_QUESTION_SECONDS, quiz.timeLimitSeconds)
      : MIN_QUIZ_QUESTION_SECONDS;
    const timeLimitMs = secondsPerQuestion * totalQuestions * 1000;
    const speedRatio = durationMs !== null
      ? Math.max(0, 1 - Math.min(durationMs, timeLimitMs) / timeLimitMs)
      : 0;
    const speedBonus = correctCount > 0 ? Math.round(speedBonusMax * speedRatio) : 0;
    const score = correctCount * pointsPerCorrect + speedBonus;
    const xpGain = Number.isFinite(quiz.xpReward) ? Math.max(0, quiz.xpReward ?? 10) : 10;
    const period = quiz.monthlyPeriod || currentMonthPeriod(completedAt);
    const leaderboardEntryRef = db
      .collection(QUIZ_LEADERBOARDS_COLLECTION)
      .doc(period)
      .collection("entries")
      .doc(uid);

    transaction.set(attemptRef, {
      quizId,
      quizDay,
      userId: uid,
      score,
      correctCount,
      totalQuestions,
      speedBonus,
      durationMs,
      answers: scoredAnswers,
      completedAt,
      createdAt: serverTimestamp(),
    });

    transaction.set(leaderboardEntryRef, {
      quizId,
      userId: uid,
      score: increment(score),
      correctCount: increment(correctCount),
      totalQuestions: increment(totalQuestions),
      durationMs,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.update(profileRef, {
      xp: increment(xpGain),
      points: increment(score),
      weeklyScore: increment(score),
      monthlyScore: increment(score),
      lastQuizCompletedAt: completedAt,
      updatedAt: serverTimestamp(),
    });
    updateRegionalLeaderboardEntries(transaction, profileSnapshot, uid, score);

    return {
      ok: true,
      alreadySubmitted: false,
      score,
      correctCount,
      totalQuestions,
      speedBonus,
      answers: scoredAnswers,
      xpGain,
      pointsGain: score,
      period,
    };
  });
});

export const updateStreak = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  const ref = userRef(uid);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new HttpsError("failed-precondition", "User profile does not exist.");
  }

  const data = snapshot.data() as { currentStreak?: number; lastCompletedAt?: { toDate?: () => Date } };
  const lastCompletedAt = data.lastCompletedAt?.toDate?.();

  if (!lastCompletedAt) {
    return { ok: true, currentStreak: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const previous = new Date(lastCompletedAt);
  previous.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - previous.getTime()) / 86400000);

  if (diffDays > 1 && (data.currentStreak ?? 0) !== 0) {
    await ref.update({
      currentStreak: 0,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, currentStreak: 0, reset: true };
  }

  return { ok: true, currentStreak: data.currentStreak ?? 0, reset: false };
});

async function rebuildLeaderboard(period: "weekly" | "monthly") {
  const scoreField = period === "weekly" ? "weeklyScore" : "monthlyScore";
  const rankField = period === "weekly" ? "weeklyLeaderboardRank" : "monthlyLeaderboardRank";
  const snapshot = await db.collection("users").orderBy(scoreField, "desc").limit(100).get();
  const leaderboardRef = db.collection(LEADERBOARDS_COLLECTION).doc(period);
  const batch = db.batch();

  snapshot.docs.forEach((doc, index) => {
    const regionKey = doc.get("regionKey");
    const displayName = publicDisplayName(doc);

    batch.set(
      leaderboardRef.collection("entries").doc(doc.id),
      {
        userId: doc.id,
        displayName,
        regionKey: typeof regionKey === "string" ? regionKey : null,
        rank: index + 1,
        score: doc.get(scoreField) ?? 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    batch.update(doc.ref, {
      [rankField]: index + 1,
      updatedAt: serverTimestamp(),
    });

    if (typeof regionKey === "string" && regionKey.trim()) {
      batch.set(
        leaderboardRef.collection("regions").doc(regionKey).collection("entries").doc(doc.id),
        {
          userId: doc.id,
          displayName,
          regionKey,
          score: doc.get(scoreField) ?? 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  });

  batch.set(
    leaderboardRef,
    {
      period,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();

  return { ok: true, entries: snapshot.size };
}

export const updateWeeklyLeaderboard = onSchedule(
  { region: REGION, schedule: "0 * * * *", timeZone: "Europe/Berlin" },
  async () => {
    await rebuildLeaderboard("weekly");
  },
);

export const updateMonthlyLeaderboard = onSchedule(
  { region: REGION, schedule: "30 0 * * *", timeZone: "Europe/Berlin" },
  async () => {
    await rebuildLeaderboard("monthly");
  },
);

export const claimReward = onCall(appCheckCallableOptions, async (request) => {
  const uid = requireAuth(request.auth);
  const { rewardId } = request.data as RewardClaimPayload;

  if (!rewardId) {
    throw new HttpsError("invalid-argument", "rewardId is required.");
  }

  const userDocumentRef = userRef(uid);
  const rewardDocumentRef = db.collection(REWARDS_COLLECTION).doc(rewardId);

  return db.runTransaction(async (transaction) => {
    const [userSnapshot, rewardSnapshot] = await Promise.all([
      transaction.get(userDocumentRef),
      transaction.get(rewardDocumentRef),
    ]);

    if (!userSnapshot.exists || !rewardSnapshot.exists) {
      throw new HttpsError("not-found", "User or reward was not found.");
    }

    const userData = userSnapshot.data() as { points?: number; claimedRewardIds?: string[] };
    const rewardData = rewardSnapshot.data() as { cost?: number; active?: boolean };

    if (rewardData.active === false) {
      throw new HttpsError("failed-precondition", "Reward is not active.");
    }

    if ((userData.claimedRewardIds ?? []).includes(rewardId)) {
      throw new HttpsError("already-exists", "Reward has already been claimed.");
    }

    const rewardCost = rewardData.cost ?? 0;
    const currentPoints = userData.points ?? 0;

    if (currentPoints < rewardCost) {
      throw new HttpsError("failed-precondition", "Not enough points to claim this reward.");
    }

    transaction.update(userDocumentRef, {
      points: currentPoints - rewardCost,
      claimedRewardIds: [...(userData.claimedRewardIds ?? []), rewardId],
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      userDocumentRef.collection("rewards").doc(rewardId),
      {
        rewardId,
        claimedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return { ok: true, rewardId };
  });
});

export const createStripeCheckoutSession = onCall(
  {
    ...appCheckCallableOptions,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    const uid = requireAuth(request.auth);
    const { locale, memberPackage } = request.data as StripeCheckoutPayload;

    if (memberPackage !== "basic" && memberPackage !== "plus") {
      throw new HttpsError("invalid-argument", "memberPackage must be basic or plus.");
    }

    const stripe = createStripeClient();
    const profileRef = userRef(uid);
    const profileSnapshot = await profileRef.get();
    const profile = profileSnapshot.data() as {
      email?: string;
      stripeCustomerId?: string;
      subscriptionStatus?: string;
    } | undefined;

    if (profile?.subscriptionStatus === "active" || profile?.subscriptionStatus === "trialing") {
      throw new HttpsError("already-exists", "An active subscription already exists.");
    }

    let customerId = profile?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: request.auth?.token.email as string | undefined ?? profile?.email,
        metadata: { uid },
      });
      customerId = customer.id;
      await profileRef.set({ stripeCustomerId: customerId, updatedAt: serverTimestamp() }, { merge: true });
    }

    const returnUrl = getCheckoutReturnUrl(locale);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{
        price: getStripePriceId(memberPackage),
        quantity: 1,
      }],
      success_url: `${returnUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?checkout=canceled`,
      client_reference_id: uid,
      metadata: { uid, memberPackage },
      subscription_data: { metadata: { uid, memberPackage } },
      allow_promotion_codes: true,
    });

    await profileRef.collection("subscriptions").doc(session.id).set({
      status: "checkout_created",
      sessionId: session.id,
      customerId,
      memberPackage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (!session.url) {
      throw new HttpsError("internal", "Stripe did not return a checkout URL.");
    }

    return { ok: true, sessionId: session.id, url: session.url };
  },
);

export const confirmStripeCheckoutSession = onCall(
  {
    ...appCheckCallableOptions,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    const uid = requireAuth(request.auth);
    const sessionId = typeof request.data?.sessionId === "string" ? request.data.sessionId : "";

    if (!sessionId.startsWith("cs_")) {
      throw new HttpsError("invalid-argument", "A valid Stripe checkout session ID is required.");
    }

    const profileSnapshot = await userRef(uid).get();
    const customerId = profileSnapshot.get("stripeCustomerId") as string | undefined;
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionCustomerId = typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

    if (session.client_reference_id !== uid && session.metadata?.uid !== uid) {
      throw new HttpsError("permission-denied", "The checkout session does not belong to this user.");
    }

    if (customerId && sessionCustomerId !== customerId) {
      throw new HttpsError("permission-denied", "The checkout customer does not match this user.");
    }

    if (session.mode !== "subscription" || session.status !== "complete") {
      throw new HttpsError("failed-precondition", "The checkout session is not complete.");
    }

    await syncStripeCheckoutSession(stripe, session);

    return { ok: true };
  },
);

export const createStripeCustomerPortalSession = onCall(
  {
    ...appCheckCallableOptions,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    const uid = requireAuth(request.auth);
    const { locale } = request.data as StripeCheckoutPayload;
    const profileSnapshot = await userRef(uid).get();
    const customerId = profileSnapshot.get("stripeCustomerId") as string | undefined;

    if (!customerId) {
      throw new HttpsError("failed-precondition", "No Stripe customer exists for this account.");
    }

    const session = await createStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: getBillingReturnUrl(locale),
    });

    return { ok: true, url: session.url };
  },
);

export const createGoogleHealthAuthorizationUrl = onCall(
  appCheckCallableOptions,
  async (request) => {
    const uid = requireAuth(request.auth);
    const locale = request.data?.locale === "en" ? "en" : "de";
    const state = createRandomToken();
    const redirectUri = getGoogleHealthRedirectUri();

    await db.collection("googleHealthOAuthStates").doc(state).set({
      uid,
      locale,
      createdAt: serverTimestamp(),
      expiresAtMs: Date.now() + 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      response_type: "code",
      client_id: googleHealthClientId.value(),
      redirect_uri: redirectUri,
      scope: GOOGLE_HEALTH_SCOPES.join(" "),
      state,
      access_type: "offline",
      prompt: "consent",
    });

    return {
      ok: true,
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  },
);

async function exchangeGoogleHealthCode(code: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleHealthClientId.value(),
      client_secret: googleHealthClientSecret.value(),
      grant_type: "authorization_code",
      code,
      redirect_uri: getGoogleHealthRedirectUri(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Health token exchange failed with status ${response.status}.`);
  }

  return await response.json() as GoogleHealthTokenResponse;
}

async function refreshGoogleHealthToken(uid: string, refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleHealthClientId.value(),
      client_secret: googleHealthClientSecret.value(),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new HttpsError("failed-precondition", "Google Health authorization has expired. Reconnect wearable.");
  }

  const token = await response.json() as GoogleHealthTokenResponse;
  await userRef(uid).collection("wearables").doc(GOOGLE_HEALTH_PROVIDER).set(
    {
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? refreshToken,
      expiresAtMs: getGoogleHealthTokenExpiresAt(token.expires_in),
      refreshTokenExpiresAtMs: token.refresh_token_expires_in
        ? Date.now() + token.refresh_token_expires_in * 1000
        : null,
      scope: token.scope ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return token.access_token;
}

async function getGoogleHealthAccessToken(uid: string) {
  const connectionRef = userRef(uid).collection("wearables").doc(GOOGLE_HEALTH_PROVIDER);
  const snapshot = await connectionRef.get();

  if (!snapshot.exists) {
    throw new HttpsError("failed-precondition", "Google Health is not connected.");
  }

  const data = snapshot.data() as {
    accessToken?: string;
    refreshToken?: string;
    expiresAtMs?: number;
  };

  if (!data.accessToken || !data.refreshToken) {
    throw new HttpsError("failed-precondition", "Google Health connection is incomplete.");
  }

  if (!data.expiresAtMs || data.expiresAtMs <= Date.now() + 60_000) {
    return await refreshGoogleHealthToken(uid, data.refreshToken);
  }

  return data.accessToken;
}

async function fetchGoogleHealthJson<T>(
  accessToken: string,
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown },
): Promise<T> {
  const response = await fetch(`https://health.googleapis.com/v4/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    throw new HttpsError("unavailable", `Google Health request failed with status ${response.status}.`);
  }

  return await response.json() as T;
}

function firstRollupNumber(response: GoogleHealthRollupResponse, dataType: string, keys: string[]) {
  const data = response.rollupDataPoints?.[0]?.[dataType];
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function secondsToRoundedMinutes(value: number | null) {
  if (value == null) return null;
  return Math.round(value / 60);
}

function googleHealthDailyRollupBody(date: string) {
  const parts = getCivilDateParts(date);

  return {
    range: {
      start: {
        date: parts,
        time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 },
      },
      end: {
        date: parts,
        time: { hours: 23, minutes: 59, seconds: 59, nanos: 0 },
      },
    },
    windowSizeDays: 1,
  };
}

async function syncGoogleHealthDailySummaryForUser(uid: string, date: string) {
  const accessToken = await getGoogleHealthAccessToken(uid);
  const body = googleHealthDailyRollupBody(date);
  const [steps, activeMinutes, restingHeartRate, sleep] = await Promise.all([
    fetchGoogleHealthJson<GoogleHealthRollupResponse>(
      accessToken,
      "users/me/dataTypes/steps/dataPoints:dailyRollUp",
      { method: "POST", body },
    ).catch(() => ({ rollupDataPoints: [] })),
    fetchGoogleHealthJson<GoogleHealthRollupResponse>(
      accessToken,
      "users/me/dataTypes/active-minutes/dataPoints:dailyRollUp",
      { method: "POST", body },
    ).catch(() => ({ rollupDataPoints: [] })),
    fetchGoogleHealthJson<GoogleHealthRollupResponse>(
      accessToken,
      "users/me/dataTypes/daily-resting-heart-rate/dataPoints:reconcile",
      { method: "POST", body },
    ).catch(() => ({ rollupDataPoints: [] })),
    fetchGoogleHealthJson<GoogleHealthRollupResponse>(
      accessToken,
      "users/me/dataTypes/sleep/dataPoints:dailyRollUp",
      { method: "POST", body },
    ).catch(() => ({ rollupDataPoints: [] })),
  ]);

  const activeMinutesSeconds = firstRollupNumber(activeMinutes, "activeMinutes", ["durationSumSeconds"]);
  const activeMinutesCount = firstRollupNumber(activeMinutes, "activeMinutes", ["minutesSum", "countSum", "count"]);
  const sleepSeconds = firstRollupNumber(sleep, "sleep", ["durationSumSeconds"]);
  const sleepMinutes = firstRollupNumber(sleep, "sleep", ["minutesAsleep", "minutesInSleepPeriod"]);
  const dailySummary = {
    provider: GOOGLE_HEALTH_PROVIDER,
    date,
    steps: firstRollupNumber(steps, "steps", ["countSum", "count"]) ?? 0,
    activeMinutes: secondsToRoundedMinutes(activeMinutesSeconds) ?? activeMinutesCount ?? 0,
    caloriesOut: null,
    restingHeartRate: firstRollupNumber(restingHeartRate, "dailyRestingHeartRate", ["beatsPerMinute", "bpm", "average"]) ?? null,
    sleepMinutes: secondsToRoundedMinutes(sleepSeconds) ?? sleepMinutes,
  };

  await userRef(uid).collection("healthDaily").doc(date).set(
    {
      ...dailySummary,
      syncedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return dailySummary;
}

export const googleHealthOAuthCallback = onRequest(
  { region: REGION, secrets: [googleHealthClientSecret] },
  async (request, response) => {
    const code = typeof request.query.code === "string" ? request.query.code : "";
    const state = typeof request.query.state === "string" ? request.query.state : "";
    const stateRef = db.collection("googleHealthOAuthStates").doc(state);
    const stateSnapshot = state ? await stateRef.get() : null;

    if (!code || !stateSnapshot?.exists) {
      response.status(400).send("Invalid Google Health authorization callback.");
      return;
    }

    const stateData = stateSnapshot.data() as { uid?: string; locale?: string; expiresAtMs?: number };
    if (!stateData.uid || !stateData.expiresAtMs || stateData.expiresAtMs < Date.now()) {
      await stateRef.delete().catch(() => undefined);
      response.status(400).send("Expired Google Health authorization callback.");
      return;
    }

    try {
      const token = await exchangeGoogleHealthCode(code);
      const identity = await fetchGoogleHealthJson<GoogleHealthIdentityResponse>(token.access_token, "users/me/identity");
      await userRef(stateData.uid).collection("wearables").doc(GOOGLE_HEALTH_PROVIDER).set(
        {
          provider: GOOGLE_HEALTH_PROVIDER,
          healthUserId: identity.healthUserId ?? null,
          legacyUserId: identity.legacyUserId ?? null,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          expiresAtMs: getGoogleHealthTokenExpiresAt(token.expires_in),
          refreshTokenExpiresAtMs: token.refresh_token_expires_in
            ? Date.now() + token.refresh_token_expires_in * 1000
            : null,
          scope: token.scope ?? null,
          connectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await stateRef.delete().catch(() => undefined);
      await syncGoogleHealthDailySummaryForUser(stateData.uid, todayIsoDate());

      const safeLocale = stateData.locale === "en" ? "en" : "de";
      response.redirect(`${appBaseUrl.value().replace(/\/$/, "")}/${safeLocale}/profile?wearable=google-health-connected`);
    } catch (error) {
      logger.error("Google Health authorization failed.", error);
      response.status(502).send("Google Health authorization failed.");
    }
  },
);

export const syncGoogleHealthDailySummary = onCall(
  { ...appCheckCallableOptions, secrets: [googleHealthClientSecret] },
  async (request) => {
    const uid = requireAuth(request.auth);
    const date = typeof request.data?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(request.data.date)
      ? request.data.date
      : todayIsoDate();

    const summary = await syncGoogleHealthDailySummaryForUser(uid, date);
    return { ok: true, summary };
  },
);

export const getGoogleHealthConnectionStatus = onCall(
  appCheckCallableOptions,
  async (request) => {
    const uid = requireAuth(request.auth);
    const snapshot = await userRef(uid).collection("wearables").doc(GOOGLE_HEALTH_PROVIDER).get();

    if (!snapshot.exists) {
      return { connected: false };
    }

    const data = snapshot.data() as { updatedAt?: unknown; healthUserId?: string };
    return {
      connected: true,
      healthUserId: data.healthUserId ?? null,
    };
  },
);

export const disconnectGoogleHealth = onCall(
  appCheckCallableOptions,
  async (request) => {
    const uid = requireAuth(request.auth);
    await userRef(uid).collection("wearables").doc(GOOGLE_HEALTH_PROVIDER).delete();
    return { ok: true };
  },
);

export const stripeWebhook = onRequest(
  { region: REGION, secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (request, response) => {
    const signature = request.header("stripe-signature");

    if (!signature) {
      response.status(400).send("Missing Stripe signature.");
      return;
    }

    const stripe = createStripeClient();

    let event: StripeEvent;

    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        stripeWebhookSecret.value(),
      );
    } catch (error) {
      logger.error("Stripe webhook verification failed", error);
      response.status(400).send("Invalid signature.");
      return;
    }

    const processedEvent = await db.collection("stripeWebhookEvents").doc(event.id).get();
    if (processedEvent.exists) {
      response.status(200).json({ received: true, duplicate: true });
      return;
    }

    if (
      event.type === "customer.subscription.created"
      || event.type === "customer.subscription.updated"
      || event.type === "customer.subscription.deleted"
    ) {
      await syncStripeSubscription(event.data.object as StripeSubscription);
    } else if (event.type === "checkout.session.completed") {
      await syncStripeCheckoutSession(stripe, event.data.object as StripeCheckoutSession);
    }

    await db.collection("stripeWebhookEvents").doc(event.id).set({
      type: event.type,
      processedAt: serverTimestamp(),
    });

    response.status(200).json({ received: true });
  },
);

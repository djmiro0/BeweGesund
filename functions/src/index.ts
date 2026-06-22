import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import { increment, LEADERBOARDS_COLLECTION, REWARDS_COLLECTION, serverTimestamp, userRef, db } from "./firestore";
import {
  appBaseUrl,
  fitbitClientId,
  fitbitClientSecret,
  stripeBasicPriceId,
  stripePlusPriceId,
  stripeSecretKey,
  stripeWebhookSecret,
} from "./config";
import type {
  CompletionPayload,
  MemberPackage,
  PremiumStatus,
  RewardClaimPayload,
  StripeCheckoutPayload,
} from "./types";

const REGION = "europe-west3";
type StripeClient = InstanceType<typeof Stripe>;
type StripeSubscription = Awaited<ReturnType<StripeClient["subscriptions"]["retrieve"]>>;
type StripeEvent = ReturnType<StripeClient["webhooks"]["constructEvent"]>;
type StripeSubscriptionStatus = StripeSubscription["status"];

interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  user_id?: string;
}

interface FitbitActivityResponse {
  summary?: {
    steps?: number;
    fairlyActiveMinutes?: number;
    lightlyActiveMinutes?: number;
    veryActiveMinutes?: number;
    caloriesOut?: number;
  };
}

interface FitbitHeartResponse {
  "activities-heart"?: Array<{
    value?: {
      restingHeartRate?: number;
    };
  }>;
}

interface FitbitSleepResponse {
  summary?: {
    totalMinutesAsleep?: number;
  };
}

function getFitbitRedirectUri() {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "sandrin-app";
  return `https://${REGION}-${projectId}.cloudfunctions.net/fitbitOAuthCallback`;
}

function createRandomToken() {
  return randomBytes(32).toString("base64url");
}

function getFitbitAuthorizationHeader() {
  return `Basic ${Buffer.from(`${fitbitClientId.value()}:${fitbitClientSecret.value()}`).toString("base64")}`;
}

function getFitbitTokenExpiresAt(expiresInSeconds: number) {
  return Date.now() + Math.max(60, expiresInSeconds - 60) * 1000;
}

function todayIsoDate(locale = "de-DE") {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function requireAuth(auth: { uid: string } | null | undefined) {
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return auth.uid;
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

async function syncStripeSubscription(subscription: StripeSubscription) {
  const uid = subscription.metadata.uid;

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

    return {
      ok: true,
      xpGain,
      pointsGain,
      currentStreak,
      longestStreak,
    };
  });
}

export const deleteUserAccount = onCall(
  {
    region: REGION,
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

export const completeLesson = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request.auth);
  return applyCompletion(uid, "lesson", request.data as CompletionPayload);
});

export const completeWorkout = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request.auth);
  return applyCompletion(uid, "workout", request.data as CompletionPayload);
});

export const updateStreak = onCall({ region: REGION }, async (request) => {
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
    batch.set(
      leaderboardRef.collection("entries").doc(doc.id),
      {
        userId: doc.id,
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

export const claimReward = onCall({ region: REGION }, async (request) => {
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
    region: REGION,
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
      success_url: `${returnUrl}?checkout=success`,
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

export const createStripeCustomerPortalSession = onCall(
  {
    region: REGION,
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

export const createFitbitAuthorizationUrl = onCall(
  { region: REGION },
  async (request) => {
    const uid = requireAuth(request.auth);
    const locale = request.data?.locale === "en" ? "en" : "de";
    const state = createRandomToken();
    const redirectUri = getFitbitRedirectUri();

    await db.collection("fitbitOAuthStates").doc(state).set({
      uid,
      locale,
      createdAt: serverTimestamp(),
      expiresAtMs: Date.now() + 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      response_type: "code",
      client_id: fitbitClientId.value(),
      redirect_uri: redirectUri,
      scope: "activity heartrate sleep profile weight",
      state,
      prompt: "consent",
    });

    return {
      ok: true,
      url: `https://www.fitbit.com/oauth2/authorize?${params.toString()}`,
    };
  },
);

async function exchangeFitbitCode(code: string) {
  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: getFitbitAuthorizationHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getFitbitRedirectUri(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Fitbit token exchange failed with status ${response.status}.`);
  }

  return await response.json() as FitbitTokenResponse;
}

async function refreshFitbitToken(uid: string, refreshToken: string) {
  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: getFitbitAuthorizationHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new HttpsError("failed-precondition", "Fitbit authorization has expired. Reconnect Fitbit.");
  }

  const token = await response.json() as FitbitTokenResponse;
  await userRef(uid).collection("wearables").doc("fitbit").set(
    {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAtMs: getFitbitTokenExpiresAt(token.expires_in),
      scope: token.scope ?? null,
      fitbitUserId: token.user_id ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return token.access_token;
}

async function getFitbitAccessToken(uid: string) {
  const connectionRef = userRef(uid).collection("wearables").doc("fitbit");
  const snapshot = await connectionRef.get();

  if (!snapshot.exists) {
    throw new HttpsError("failed-precondition", "Fitbit is not connected.");
  }

  const data = snapshot.data() as {
    accessToken?: string;
    refreshToken?: string;
    expiresAtMs?: number;
  };

  if (!data.accessToken || !data.refreshToken) {
    throw new HttpsError("failed-precondition", "Fitbit connection is incomplete.");
  }

  if (!data.expiresAtMs || data.expiresAtMs <= Date.now() + 60_000) {
    return await refreshFitbitToken(uid, data.refreshToken);
  }

  return data.accessToken;
}

async function fetchFitbitJson<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`https://api.fitbit.com/1/user/-/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new HttpsError("unavailable", `Fitbit request failed with status ${response.status}.`);
  }

  return await response.json() as T;
}

async function syncFitbitDailySummaryForUser(uid: string, date: string) {
  const accessToken = await getFitbitAccessToken(uid);
  const [activity, heart, sleep] = await Promise.all([
    fetchFitbitJson<FitbitActivityResponse>(accessToken, `activities/date/${date}.json`),
    fetchFitbitJson<FitbitHeartResponse>(accessToken, `activities/heart/date/${date}/1d.json`),
    fetchFitbitJson<FitbitSleepResponse>(accessToken, `sleep/date/${date}.json`),
  ]);

  const summary = activity.summary ?? {};
  const activeMinutes =
    (summary.lightlyActiveMinutes ?? 0)
    + (summary.fairlyActiveMinutes ?? 0)
    + (summary.veryActiveMinutes ?? 0);
  const dailySummary = {
    provider: "fitbit",
    date,
    steps: summary.steps ?? 0,
    activeMinutes,
    caloriesOut: summary.caloriesOut ?? null,
    restingHeartRate: heart["activities-heart"]?.[0]?.value?.restingHeartRate ?? null,
    sleepMinutes: sleep.summary?.totalMinutesAsleep ?? null,
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

export const fitbitOAuthCallback = onRequest(
  { region: REGION, secrets: [fitbitClientSecret] },
  async (request, response) => {
    const code = typeof request.query.code === "string" ? request.query.code : "";
    const state = typeof request.query.state === "string" ? request.query.state : "";
    const stateRef = db.collection("fitbitOAuthStates").doc(state);
    const stateSnapshot = state ? await stateRef.get() : null;

    if (!code || !stateSnapshot?.exists) {
      response.status(400).send("Invalid Fitbit authorization callback.");
      return;
    }

    const stateData = stateSnapshot.data() as { uid?: string; locale?: string; expiresAtMs?: number };
    if (!stateData.uid || !stateData.expiresAtMs || stateData.expiresAtMs < Date.now()) {
      await stateRef.delete().catch(() => undefined);
      response.status(400).send("Expired Fitbit authorization callback.");
      return;
    }

    try {
      const token = await exchangeFitbitCode(code);
      await userRef(stateData.uid).collection("wearables").doc("fitbit").set(
        {
          provider: "fitbit",
          fitbitUserId: token.user_id ?? null,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          expiresAtMs: getFitbitTokenExpiresAt(token.expires_in),
          scope: token.scope ?? null,
          connectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await stateRef.delete().catch(() => undefined);
      await syncFitbitDailySummaryForUser(stateData.uid, todayIsoDate());

      const safeLocale = stateData.locale === "en" ? "en" : "de";
      response.redirect(`${appBaseUrl.value().replace(/\/$/, "")}/${safeLocale}/profile?wearable=fitbit-connected`);
    } catch (error) {
      logger.error("Fitbit authorization failed.", error);
      response.status(502).send("Fitbit authorization failed.");
    }
  },
);

export const syncFitbitDailySummary = onCall(
  { region: REGION, secrets: [fitbitClientSecret] },
  async (request) => {
    const uid = requireAuth(request.auth);
    const date = typeof request.data?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(request.data.date)
      ? request.data.date
      : todayIsoDate();

    const summary = await syncFitbitDailySummaryForUser(uid, date);
    return { ok: true, summary };
  },
);

export const getFitbitConnectionStatus = onCall(
  { region: REGION },
  async (request) => {
    const uid = requireAuth(request.auth);
    const snapshot = await userRef(uid).collection("wearables").doc("fitbit").get();

    if (!snapshot.exists) {
      return { connected: false };
    }

    const data = snapshot.data() as { updatedAt?: unknown; fitbitUserId?: string };
    return {
      connected: true,
      fitbitUserId: data.fitbitUserId ?? null,
    };
  },
);

export const disconnectFitbit = onCall(
  { region: REGION },
  async (request) => {
    const uid = requireAuth(request.auth);
    await userRef(uid).collection("wearables").doc("fitbit").delete();
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
    }

    await db.collection("stripeWebhookEvents").doc(event.id).set({
      type: event.type,
      processedAt: serverTimestamp(),
    });

    response.status(200).json({ received: true });
  },
);

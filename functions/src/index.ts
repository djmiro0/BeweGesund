import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import Stripe from "stripe";
import { increment, LEADERBOARDS_COLLECTION, REWARDS_COLLECTION, serverTimestamp, userRef, db } from "./firestore";
import { stripeSecretKey, stripeWebhookSecret } from "./config";
import type { CompletionPayload, RewardClaimPayload, StripeCheckoutPayload, UserProfile } from "./types";

const REGION = "europe-west3";

function requireAuth(auth: { uid: string } | null | undefined) {
  if (!auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return auth.uid;
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

async function applyCompletion(userId: string, kind: "lesson" | "workout", payload: CompletionPayload) {
  const itemId = kind === "lesson" ? payload.lessonId : payload.workoutId;

  if (!itemId) {
    throw new HttpsError("invalid-argument", `${kind}Id is required.`);
  }

  const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
  const completionCollection = kind === "lesson" ? "lessonCompletions" : "workoutCompletions";
  const xpGain = kind === "lesson" ? 20 : 35;
  const pointsGain = kind === "lesson" ? 10 : 20;

  const ref = userRef(userId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      throw new HttpsError("failed-precondition", "User profile does not exist.");
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
      ref.collection(completionCollection).doc(itemId),
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

export const createUserProfile = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request.auth);
  const authUser = request.auth;
  const ref = userRef(uid);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return { ok: true, created: false };
  }

  const profile: UserProfile = {
    uid,
    email: authUser.token.email ?? "",
    displayName: authUser.token.name ?? null,
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    xp: 0,
    points: 0,
    premiumStatus: "free",
    subscriptionStatus: "free",
    currentStreak: 0,
    longestStreak: 0,
    weeklyScore: 0,
    monthlyScore: 0,
    weeklyLeaderboardRank: null,
    monthlyLeaderboardRank: null,
    claimedRewardIds: [],
    roles: ["member"],
  };

  await ref.set(profile);

  return { ok: true, created: true };
});

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
  async () => rebuildLeaderboard("weekly"),
);

export const updateMonthlyLeaderboard = onSchedule(
  { region: REGION, schedule: "30 0 * * *", timeZone: "Europe/Berlin" },
  async () => rebuildLeaderboard("monthly"),
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
  { region: REGION, secrets: [stripeSecretKey] },
  async (request) => {
    const uid = requireAuth(request.auth);
    const { priceId, successUrl, cancelUrl } = request.data as StripeCheckoutPayload;

    if (!priceId || !successUrl || !cancelUrl) {
      throw new HttpsError("invalid-argument", "priceId, successUrl, and cancelUrl are required.");
    }

    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2025-04-30.basil",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: uid,
      metadata: { uid },
      allow_promotion_codes: true,
    });

    await userRef(uid).collection("subscriptions").doc(session.id).set({
      status: "checkout_created",
      sessionId: session.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { ok: true, sessionId: session.id, url: session.url };
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

    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2025-04-30.basil",
    });

    let event: Stripe.Event;

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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid ?? session.client_reference_id;

      if (uid) {
        await userRef(uid).set(
          {
            premiumStatus: "active",
            subscriptionStatus: "active",
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.uid;

      if (uid) {
        await userRef(uid).set(
          {
            premiumStatus: "canceled",
            subscriptionStatus: "canceled",
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    response.status(200).json({ received: true });
  },
);

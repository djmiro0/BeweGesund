import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import Stripe from "stripe";
import { increment, LEADERBOARDS_COLLECTION, REWARDS_COLLECTION, serverTimestamp, userRef, db } from "./firestore";
import { stripeSecretKey, stripeWebhookSecret } from "./config";
import type { CompletionPayload, RegistrationProfilePayload, RewardClaimPayload, StripeCheckoutPayload, UserProfile } from "./types";

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

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${field} is required.`);
  }

  return value.trim();
}

function requireNumberInRange(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new HttpsError("invalid-argument", `${field} must be between ${min} and ${max}.`);
  }

  return value;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function optionalNumberInRange(value: unknown, field: string, min: number, max: number) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return requireNumberInRange(value, field, min, max);
}

function normalizeRegistrationPayload(data: unknown) {
  const payload = (data ?? {}) as RegistrationProfilePayload;
  const occupationKeys = ["sedentary", "standing", "physical"];
  const regionKeys = [
    "baden-wuerttemberg",
    "bavaria",
    "berlin",
    "brandenburg",
    "bremen",
    "hamburg",
    "hesse",
    "lower-saxony",
    "mecklenburg-western-pomerania",
    "north-rhine-westphalia",
    "rhineland-palatinate",
    "saarland",
    "saxony",
    "saxony-anhalt",
    "schleswig-holstein",
    "thuringia",
  ];
  const anamnesisStatusKeys = ["pending", "completed", "review-required"];
  const occupationKey = optionalString(payload.occupationKey);
  const regionKey = requireString(payload.regionKey, "regionKey");
  const anamnesisStatusKey = payload.anamnesisStatusKey ?? "pending";

  if (occupationKey && !occupationKeys.includes(occupationKey)) {
    throw new HttpsError("invalid-argument", "occupationKey is invalid.");
  }

  if (!regionKeys.includes(regionKey)) {
    throw new HttpsError("invalid-argument", "regionKey is invalid.");
  }

  if (!anamnesisStatusKeys.includes(anamnesisStatusKey)) {
    throw new HttpsError("invalid-argument", "anamnesisStatusKey is invalid.");
  }

  if (payload.consentAccepted !== true) {
    throw new HttpsError("failed-precondition", "Registration consent is required.");
  }

  return {
    displayName: requireString(payload.displayName, "displayName"),
    photoURL: optionalString(payload.photoURL),
    dateOfBirth: optionalString(payload.dateOfBirth),
    heightCm: optionalNumberInRange(payload.heightCm, "heightCm", 80, 240),
    weightKg: optionalNumberInRange(payload.weightKg, "weightKg", 25, 300),
    occupationKey,
    regionKey,
    averageStepsPerDay:
      typeof payload.averageStepsPerDay === "number" && Number.isFinite(payload.averageStepsPerDay)
        ? Math.max(0, payload.averageStepsPerDay)
        : null,
    primaryGoalKey: typeof payload.primaryGoalKey === "string" && payload.primaryGoalKey.trim()
      ? payload.primaryGoalKey.trim()
      : null,
    anamnesisStatusKey,
  };
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
  const authUser = request.auth!;
  const registrationProfile = normalizeRegistrationPayload(request.data);
  const ref = userRef(uid);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    await ref.set(
      {
        displayName: registrationProfile.displayName,
        photoURL: registrationProfile.photoURL,
        dateOfBirth: registrationProfile.dateOfBirth,
        heightCm: registrationProfile.heightCm,
        weightKg: registrationProfile.weightKg,
        occupationKey: registrationProfile.occupationKey,
        regionKey: registrationProfile.regionKey,
        averageStepsPerDay: registrationProfile.averageStepsPerDay,
        primaryGoalKey: registrationProfile.primaryGoalKey,
        anamnesisStatusKey: registrationProfile.anamnesisStatusKey,
        consentAcceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return { ok: true, created: false };
  }

  const profile: UserProfile = {
    uid,
    email: authUser.token.email ?? "",
    displayName: registrationProfile.displayName,
    photoURL: registrationProfile.photoURL,
    dateOfBirth: registrationProfile.dateOfBirth,
    heightCm: registrationProfile.heightCm,
    weightKg: registrationProfile.weightKg,
    occupationKey: registrationProfile.occupationKey,
    regionKey: registrationProfile.regionKey,
    averageStepsPerDay: registrationProfile.averageStepsPerDay,
    primaryGoalKey: registrationProfile.primaryGoalKey,
    memberPackage: "starter",
    startedCourseIds: [],
    completedCourseIds: [],
    recommendedCourseIds: [],
    anamnesisStatusKey: registrationProfile.anamnesisStatusKey,
    consentAcceptedAt: serverTimestamp(),
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
  { region: REGION, secrets: [stripeSecretKey] },
  async (request) => {
    const uid = requireAuth(request.auth);
    const { priceId, successUrl, cancelUrl } = request.data as StripeCheckoutPayload;

    if (!priceId || !successUrl || !cancelUrl) {
      throw new HttpsError("invalid-argument", "priceId, successUrl, and cancelUrl are required.");
    }

    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2025-08-27.basil",
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
      apiVersion: "2025-08-27.basil",
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

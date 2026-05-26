# Backend Architecture

## Stack

- Next.js: frontend and UI
- Firebase Auth: authentication
- Firestore: application data
- Firebase Cloud Functions v2: trusted backend logic
- Firestore Security Rules: client-side write protection
- Contentful: articles and research content
- Mux or Cloudflare Stream: training video and live delivery
- Stripe: subscriptions
- Vercel: hosting

## Trust Boundaries

The frontend must never directly update:

- `xp`
- `points`
- `premiumStatus`
- `subscriptionStatus`
- `claimedRewardIds`
- `weeklyScore`
- `monthlyScore`
- `weeklyLeaderboardRank`
- `monthlyLeaderboardRank`

These fields are owned by Cloud Functions only.

## Firestore Shape

### `/users/{uid}`

- identity: `uid`, `email`, `displayName`, `photoURL`
- progression: `xp`, `points`
- streaks: `currentStreak`, `longestStreak`, `lastCompletedAt`
- subscription: `premiumStatus`, `subscriptionStatus`
- leaderboard: `weeklyScore`, `monthlyScore`, `weeklyLeaderboardRank`, `monthlyLeaderboardRank`
- rewards: `claimedRewardIds`
- timestamps: `createdAt`, `updatedAt`

### `/users/{uid}/lessonCompletions/{lessonId}`

- `userId`
- `completedAt`
- `createdAt`

### `/users/{uid}/workoutCompletions/{workoutId}`

- `userId`
- `completedAt`
- `createdAt`

### `/users/{uid}/subscriptions/{sessionId}`

- Stripe checkout/session status snapshots

### `/users/{uid}/rewards/{rewardId}`

- `rewardId`
- `claimedAt`

### `/rewards/{rewardId}`

- reward definition managed by admins/backend

### `/leaderboards/weekly`
### `/leaderboards/monthly`

- aggregate metadata

### `/leaderboards/{period}/entries/{uid}`

- `userId`
- `rank`
- `score`
- `updatedAt`

### Public content collections

- `/articles/{articleId}`
- `/research/{entryId}`
- `/courses/{courseId}`

These are read-only from the client and can be mirrored from Contentful if needed.

## Functions

- `createUserProfile`
- `completeLesson`
- `completeWorkout`
- `updateStreak`
- `updateWeeklyLeaderboard`
- `updateMonthlyLeaderboard`
- `claimReward`
- `createStripeCheckoutSession`
- `stripeWebhook`

## Recommended Next Steps

1. Add a Firebase Admin setup for local emulators and production secrets.
2. Connect `createUserProfile` to the first sign-in/register flow.
3. Add a typed Firestore client layer on the Next.js side for read-only user data.
4. Wire Stripe product and price IDs through environment variables.
5. Decide whether Mux or Cloudflare Stream will power protected video playback.

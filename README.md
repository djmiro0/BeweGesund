# S.BeweGesund

S.BeweGesund is a bilingual health and movement platform built with Next.js. The frontend handles the member experience, while Firebase and Cloud Functions own authentication, protected data updates, gamification, and subscription logic.

## Stack

- Next.js for frontend and UI
- Firebase Auth for authentication
- Firestore for application data
- Firebase Cloud Functions v2 for trusted backend logic
- Firestore Security Rules for client write protection
- Contentful for articles and research content
- Mux or Cloudflare Stream for video and live training
- Stripe for subscriptions
- Vercel for hosting

## Backend Principle

The frontend must not directly update:

- xp
- points
- premium status
- subscription status
- rewards
- weekly leaderboard
- monthly leaderboard

All gamification and subscription logic belongs in Cloud Functions.

## Included Scaffold

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `functions/` Cloud Functions v2 scaffold
- `docs/backend-architecture.md`

## Important Functions

- `createUserProfile`
- `completeLesson`
- `completeWorkout`
- `updateStreak`
- `updateWeeklyLeaderboard`
- `updateMonthlyLeaderboard`
- `claimReward`
- `createStripeCheckoutSession`
- `stripeWebhook`

## Local Frontend

```bash
npm install
npm run dev
```

## Next Backend Step

Install the Firebase Functions dependencies in `functions/`, connect the first authenticated user flow to `createUserProfile`, and start reading protected member state from Firestore instead of mock data.

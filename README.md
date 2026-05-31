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

## Contentful Calendar and Video Content

The app now reads the live calendar from Contentful when the environment variables in `.env.example` are configured. If Contentful is not configured yet, the existing local mock schedule is used as a fallback.

Create a `calendarEvent` content type with these fields:

- `title` short text, required
- `description` long text
- `liveTrainingLink` short text or URL
- `slug` short text
- `startsAt` date/time, required
- `durationMinutes` integer
- `format` short text, either `training` or `seminar`
- `coach` short text
- `packageRequired` short text, one of `starter`, `rehab-plus`, `all-access`
- `muxPlaybackId` short text, optional when the session has replay video

Create a `trainingVideo` content type with these fields:

- `title` short text, required
- `description` long text
- `slug` short text
- `duration` short text
- `level` short text
- `image` or `featuredImage` media
- `muxPlaybackId` short text

Mux owns uploaded video files and playback. Contentful owns the editorial metadata and stores the Mux `playbackId` once the video is ready.

To create a Mux direct upload URL from the app backend, set `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, and preferably `MUX_ADMIN_UPLOAD_TOKEN`, then call `POST /api/mux/direct-upload` with `Authorization: Bearer <MUX_ADMIN_UPLOAD_TOKEN>`.

## Next Backend Step

Install the Firebase Functions dependencies in `functions/`, connect the first authenticated user flow to `createUserProfile`, and start reading protected member state from Firestore instead of mock data.

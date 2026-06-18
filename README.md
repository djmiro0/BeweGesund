# Bewegesund

Bewegesund is a bilingual health and movement platform built with Next.js. The frontend handles the member experience, while Firebase and Cloud Functions own authentication, protected data updates, gamification, and subscription logic.

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

- `completeLesson`
- `completeWorkout`
- `updateStreak`
- `updateWeeklyLeaderboard`
- `updateMonthlyLeaderboard`
- `claimReward`
- `createStripeCheckoutSession`
- `createStripeCustomerPortalSession`
- `stripeWebhook`

## Local Frontend

`.env.example` lists variable names only. It does not store real credentials or
production values.

For local development, copy the template and fill the real values in `.env.local`
before starting the dev server:

```bash
cp .env.example .env.local
```

```bash
npm install
npm run dev
```

For Firebase App Check protected flows, set
`NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED=true` and
`NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` in `.env.local` and in the deployment
environment. Leave `NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED` empty or unset during
local development if reCAPTCHA is not fully configured. Stripe billing is
protected by Firebase Auth and verified Stripe webhooks, so checkout and portal
sessions do not depend on App Check.

## Contentful Calendar, Course, and Video Content

The app reads Contentful from runtime environment variables such as `.env.local` in development or deployment provider variables in production. `.env.example` is only a list of required variable names and is not loaded by Next.js automatically. If Contentful is not configured yet, the calendar, courses, and blogs do not render fake fallback entries.

Create a `calendarEvent` content type with these fields:

- `title` short text, required
- `description` long text
- `liveTrainingLink` short text or URL
- `slug` short text
- `startsAt` date/time, required
- `durationMinutes` integer
- `format` short text, either `training` or `seminar`
- `coach` short text
- `packageRequired` short text, one of `basic`, `plus`. Recorded course content is
  available to Basic members; live content requires Plus.
- `muxPlaybackId` short text, optional when the session has replay video

Create a `trainingVideo` content type with these fields:

- `title` short text, required
- `description` long text
- `slug` short text
- `duration` short text
- `level` short text
- `image` or `featuredImage` media
- `muxPlaybackId` short text

Create a `course` content type with these fields:

- `title` short text, required
- `slug` short text, required; use the same value as the app course id, for example `reha-knee`
- `description` long text
- `exerciseInstructions` long text
- `muxPlaybackId` short text, the signed Mux playback id
- `duration` integer, shown as minutes on the course card
- `level` short text
- `courseKey` short text, optional stable internal key
- `posterImage`, `featuredImage`, or `image` media
- `tags` short text, optional grouping label such as `rehab`, `training`, or `nutrition`
- `packageRequired` short text, one of `basic`, `plus`. Live training and live
  seminars should use `plus`.
- `publishedAt` date/time, optional sort fallback
- `coach`, `categoryKey`, `categoryTitle`, `categoryDescription`, `unlocksPerWeek`, `note`, and `order` are also supported if you add them later

Mux owns uploaded video files and playback. Contentful owns the editorial metadata and stores the Mux `playbackId` once the video is ready. Course playback is protected through `POST /api/mux/playback-token`: the client sends the Firebase ID token, the route verifies it, and the app returns a short-lived signed Mux playback token.

To create a Mux direct upload URL from the app backend, set `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, and `MUX_ADMIN_UPLOAD_TOKEN`, then call `POST /api/mux/direct-upload` with `Authorization: Bearer <MUX_ADMIN_UPLOAD_TOKEN>`. New direct uploads are created with signed playback policy. The endpoint fails closed when any credential is missing.

For protected playback, set `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_PRIVATE_KEY`, and `FIREBASE_PROJECT_ID`. Existing Mux assets must also have a signed playback id/policy; public-only playback ids will not work with signed playback tokens.

## Production Readiness

Run the release checks and complete the external service configuration described
in `docs/production-operations.md`. Stripe Checkout and Customer Portal are
implemented; configure and verify them in test mode using
`docs/stripe-billing.md` before enabling live billing.

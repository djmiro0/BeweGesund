# Quiz Gamification

## Firestore model

Public quiz documents live in `quizzes/{quizId}`. These documents are readable by the app and must not contain correct answers.

```json
{
  "title": "Monthly Fitness Quiz",
  "description": "Short health and training knowledge check.",
  "locale": "en",
  "status": "published",
  "availableFrom": "2026-07-01T00:00:00.000Z",
  "availableUntil": "2026-07-02T00:00:00.000Z",
  "timeLimitSeconds": 30,
  "monthlyPeriod": "2026-07",
  "allowRetake": false,
  "pointsPerCorrect": 100,
  "speedBonusMax": 50,
  "xpReward": 10,
  "questions": [
    {
      "id": "q1",
      "prompt": "Which factor counts most for the quiz leaderboard?",
      "options": [
        { "id": "a", "label": "Only reading articles" },
        { "id": "b", "label": "Correct answers plus speed" },
        { "id": "c", "label": "Only training minutes" }
      ]
    }
  ]
}
```

Private answer keys live in `quizAnswerKeys/{quizId}`. Firestore rules do not expose them to clients; `submitQuizAttempt` reads them with Admin SDK.

```json
{
  "answers": {
    "q1": "b"
  }
}
```

## Submit flow

The app reads published `quizzes` documents, opens a deterministic daily set of up to 5 questions, and sends selected answers to the callable function `submitQuizAttempt`.

The function:

- requires Firebase Auth and App Check
- validates that the quiz is published and currently available
- compares the daily answers against `quizAnswerKeys/{quizId}`
- stores the result in `users/{uid}/quizAttempts/{quizId}_{YYYY-MM-DD}`
- updates `quizLeaderboards/{monthlyPeriod}/entries/{uid}`
- increments user `xp`, `points`, `weeklyScore`, and `monthlyScore`

## First production checklist

1. Deploy Firestore rules.
2. Deploy functions so `submitQuizAttempt` exists.
3. Create matching `quizzes/{quizId}` and `quizAnswerKeys/{quizId}` documents.
4. Open `/de/quiz` or `/en/quiz` and submit with a signed-in user.

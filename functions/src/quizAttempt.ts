import { HttpsError } from "firebase-functions/v2/https";

export interface QuizAttemptQuestion {
  id: string;
  options?: Array<{ id: string }>;
}

export interface SubmittedQuizAnswer {
  questionId: string;
  optionId: string | null;
}

export function validateSubmittedQuizSet(
  questions: QuizAttemptQuestion[],
  answers: SubmittedQuizAnswer[],
  expectedQuestionCount: number,
) {
  if (answers.length !== expectedQuestionCount) {
    throw new HttpsError(
      "invalid-argument",
      `Quiz attempt must contain ${expectedQuestionCount} answers.`,
    );
  }

  const quizQuestionsById = new Map(
    questions.map((question) => [question.id, question]),
  );
  const submittedQuestionIds = new Set(
    answers.map((answer) => answer.questionId),
  );

  if (submittedQuestionIds.size !== answers.length) {
    throw new HttpsError(
      "invalid-argument",
      "Quiz attempt contains duplicate questions.",
    );
  }

  for (const answer of answers) {
    const question = quizQuestionsById.get(answer.questionId);
    if (!question) {
      throw new HttpsError(
        "invalid-argument",
        "Question is not part of this quiz.",
      );
    }

    const optionIds = new Set(
      (question.options ?? []).map((option) => option.id),
    );
    if (answer.optionId !== null && !optionIds.has(answer.optionId)) {
      throw new HttpsError(
        "invalid-argument",
        "Answer option is not part of this question.",
      );
    }
  }

  return submittedQuestionIds;
}

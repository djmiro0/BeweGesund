import { describe, expect, it } from "vitest";
import { validateSubmittedQuizSet } from "../functions/src/quizAttempt";

const questions = [
  { id: "q1", options: [{ id: "a" }, { id: "b" }] },
  { id: "q2", options: [{ id: "a" }, { id: "b" }] },
  { id: "q3", options: [{ id: "a" }, { id: "b" }] },
];

describe("validateSubmittedQuizSet", () => {
  it("returns submitted question IDs for a valid random quiz attempt", () => {
    const submittedQuestionIds = validateSubmittedQuizSet(
      questions,
      [
        { questionId: "q3", optionId: "a" },
        { questionId: "q1", optionId: "b" },
      ],
      2,
    );

    expect([...submittedQuestionIds]).toEqual(["q3", "q1"]);
  });

  it("rejects attempts with the wrong number of answers", () => {
    expect(() =>
      validateSubmittedQuizSet(
        questions,
        [{ questionId: "q1", optionId: "a" }],
        2,
      ),
    ).toThrow("Quiz attempt must contain 2 answers.");
  });

  it("rejects duplicate questions", () => {
    expect(() =>
      validateSubmittedQuizSet(
        questions,
        [
          { questionId: "q1", optionId: "a" },
          { questionId: "q1", optionId: "b" },
        ],
        2,
      ),
    ).toThrow("Quiz attempt contains duplicate questions.");
  });

  it("rejects questions that do not belong to the quiz", () => {
    expect(() =>
      validateSubmittedQuizSet(
        questions,
        [
          { questionId: "q1", optionId: "a" },
          { questionId: "outside", optionId: "a" },
        ],
        2,
      ),
    ).toThrow("Question is not part of this quiz.");
  });

  it("rejects options that do not belong to the submitted question", () => {
    expect(() =>
      validateSubmittedQuizSet(
        questions,
        [
          { questionId: "q1", optionId: "a" },
          { questionId: "q2", optionId: "c" },
        ],
        2,
      ),
    ).toThrow("Answer option is not part of this question.");
  });
});

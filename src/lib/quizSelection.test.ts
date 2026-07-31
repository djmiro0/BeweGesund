import { describe, expect, it } from "vitest";
import { selectRandomQuizQuestions } from "./quizSelection";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  private readonly store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const questions = [
  { id: "hydration" },
  { id: "protein" },
  { id: "sleep" },
  { id: "cardio" },
  { id: "mobility" },
  { id: "fiber" },
  { id: "stress" },
  { id: "balance" },
];

describe("selectRandomQuizQuestions", () => {
  it("selects the requested number of questions and remembers the selected set", () => {
    const storage = new MemoryStorage();

    const selected = selectRandomQuizQuestions(questions, "quiz:test", {
      count: 5,
      seedFactory: () => "alpha",
      storage,
    });

    expect(selected).toHaveLength(5);
    expect(selected.map((question) => question.id)).toEqual([
      "mobility",
      "hydration",
      "balance",
      "protein",
      "cardio",
    ]);
    expect(JSON.parse(storage.getItem("quiz:test") ?? "[]")).toEqual([
      "mobility|hydration|balance|protein|cardio",
    ]);
  });

  it("skips a recently used set when another seed produces a fresh combination", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "quiz:test",
      JSON.stringify(["mobility|hydration|balance|protein|cardio"]),
    );
    const seeds = ["alpha", "beta"];

    const selected = selectRandomQuizQuestions(questions, "quiz:test", {
      count: 5,
      seedFactory: () => seeds.shift() ?? "beta",
      storage,
    });

    expect(selected.map((question) => question.id)).toEqual([
      "balance",
      "protein",
      "fiber",
      "sleep",
      "cardio",
    ]);
    expect(JSON.parse(storage.getItem("quiz:test") ?? "[]")).toEqual([
      "balance|protein|fiber|sleep|cardio",
      "mobility|hydration|balance|protein|cardio",
    ]);
  });

  it("uses all available questions when fewer than five exist", () => {
    const selected = selectRandomQuizQuestions(
      questions.slice(0, 3),
      "quiz:test",
      {
        count: 5,
        seedFactory: () => "alpha",
        storage: new MemoryStorage(),
      },
    );

    expect(selected).toHaveLength(3);
  });
});

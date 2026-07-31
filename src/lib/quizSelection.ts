export interface QuizSelectionQuestion {
  id: string;
}

export const DEFAULT_QUIZ_QUESTION_COUNT = 5;
const DEFAULT_RECENT_RANDOM_SET_LIMIT = 12;

export function stableQuizHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return hash >>> 0;
}

export function createQuizRandomSeed() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    return `${values[0]}:${values[1]}:${Date.now()}`;
  }

  return `${Math.random()}:${Date.now()}`;
}

export function selectRandomQuizQuestions<
  TQuestion extends QuizSelectionQuestion,
>(
  questions: TQuestion[],
  storageKey: string,
  options: {
    count?: number;
    recentSetLimit?: number;
    seedFactory?: () => string;
    storage?: Pick<Storage, "getItem" | "setItem">;
  } = {},
) {
  const count = Math.min(
    options.count ?? DEFAULT_QUIZ_QUESTION_COUNT,
    questions.length,
  );
  if (count === 0) return [];

  const storage =
    options.storage ??
    (typeof window !== "undefined" ? window.localStorage : undefined);
  const recentSetLimit =
    options.recentSetLimit ?? DEFAULT_RECENT_RANDOM_SET_LIMIT;
  const seedFactory = options.seedFactory ?? createQuizRandomSeed;

  let recentSets: string[] = [];
  try {
    recentSets = JSON.parse(storage?.getItem(storageKey) ?? "[]");
  } catch {
    recentSets = [];
  }

  let selected = questions.slice(0, count);
  let selectedKey = selected.map((question) => question.id).join("|");

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const seed = seedFactory();
    selected = [...questions]
      .sort(
        (left, right) =>
          stableQuizHash(`${seed}:${left.id}`) -
          stableQuizHash(`${seed}:${right.id}`),
      )
      .slice(0, count);
    selectedKey = selected.map((question) => question.id).join("|");

    if (
      !recentSets.includes(selectedKey) ||
      recentSets.length >= Math.max(1, questions.length - count)
    ) {
      break;
    }
  }

  try {
    storage?.setItem(
      storageKey,
      JSON.stringify(
        [
          selectedKey,
          ...recentSets.filter((item) => item !== selectedKey),
        ].slice(0, recentSetLimit),
      ),
    );
  } catch {
    // The quiz can still run if browser storage is unavailable.
  }

  return selected;
}

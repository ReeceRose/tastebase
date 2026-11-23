import type { AlignedPair } from "@/lib/types/recipe-refresh-types";

// Two lines this alike are treated as one line that was edited.
export const DEFAULT_MATCH_THRESHOLD = 0.5;

function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean),
  );
}

// Dice coefficient over the words each line uses: 1 for the same words,
// 0 for none in common.
export function textSimilarity(a: string, b: string): number {
  const left = words(a);
  const right = words(b);
  if (left.size === 0 && right.size === 0) return 1;
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) {
    if (right.has(word)) shared += 1;
  }
  return (2 * shared) / (left.size + right.size);
}

// Lines up two lists in order, pairing the most similar lines without
// crossing, like a diff that also pairs edited lines. Unpaired lines come
// back with one side null, positioned where they sit in their own list.
export function alignLists(
  before: string[],
  after: string[],
  threshold = DEFAULT_MATCH_THRESHOLD,
): AlignedPair[] {
  const similarity = before.map((left) =>
    after.map((right) => textSimilarity(left, right)),
  );
  const rows = before.length + 1;
  const columns = after.length + 1;
  const score: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(columns).fill(0),
  );

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      const pair = similarity[i - 1][j - 1];
      score[i][j] = Math.max(
        score[i - 1][j],
        score[i][j - 1],
        pair >= threshold ? score[i - 1][j - 1] + pair : 0,
      );
    }
  }

  const pairs: AlignedPair[] = [];
  let i = before.length;
  let j = after.length;
  while (i > 0 || j > 0) {
    const pair = i > 0 && j > 0 ? similarity[i - 1][j - 1] : 0;
    if (
      i > 0 &&
      j > 0 &&
      pair >= threshold &&
      score[i][j] === score[i - 1][j - 1] + pair
    ) {
      pairs.push({ before: i - 1, after: j - 1 });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || score[i][j - 1] >= score[i - 1][j])) {
      pairs.push({ before: null, after: j - 1 });
      j -= 1;
    } else {
      pairs.push({ before: i - 1, after: null });
      i -= 1;
    }
  }
  return pairs.reverse();
}

import { COMMON_WORDS, generateWords } from "./words";

export interface Lesson {
  id: string;
  title: string;
  newKeys: string[];
  reviewKeys: string[]; // filled in automatically below — everything learned in prior lessons
  useRealWords?: boolean;
  mixedCase?: boolean; // drills random capitalization of already-learned letters
}

interface LessonSeed {
  id: string;
  title: string;
  newKeys: string[];
  useRealWords?: boolean;
  mixedCase?: boolean;
}

const SEEDS: LessonSeed[] = [
  { id: "home-index", title: "home row: index fingers", newKeys: ["f", "j"] },
  { id: "home-middle-ring", title: "home row: middle & ring", newKeys: ["d", "k", "s", "l"] },
  { id: "home-pinky", title: "home row: pinkies", newKeys: ["a", ";"] },
  { id: "home-reaches", title: "home row: reaches", newKeys: ["g", "h"] },
  { id: "home-review", title: "home row review", newKeys: [] },
  { id: "top-index", title: "top row: index fingers", newKeys: ["r", "u", "t", "y"] },
  { id: "top-middle-ring", title: "top row: middle & ring", newKeys: ["e", "i", "w", "o"] },
  { id: "top-pinky", title: "top row: pinkies", newKeys: ["q", "p"] },
  { id: "top-review", title: "top row review", newKeys: [] },
  { id: "bottom-index", title: "bottom row: index fingers", newKeys: ["v", "m", "b", "n"] },
  { id: "bottom-rest", title: "bottom row: middle, ring & pinky", newKeys: ["c", ",", "x", ".", "z", "/"] },
  { id: "bottom-review", title: "bottom row review", newKeys: [] },
  { id: "numbers", title: "number row", newKeys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] },
  { id: "symbols", title: "symbols & punctuation", newKeys: ["-", "=", "[", "]", "'"] },
  { id: "capitals", title: "capitals & shift", newKeys: [], mixedCase: true },
  { id: "full-review", title: "full keyboard review", newKeys: [], useRealWords: true },
];

export const LESSONS: Lesson[] = (() => {
  const learned: string[] = [];
  return SEEDS.map((seed) => {
    const lesson: Lesson = { ...seed, reviewKeys: [...learned] };
    learned.push(...seed.newKeys);
    return lesson;
  });
})();

const PASS_ACCURACY = 90;

export function passThreshold(): number {
  return PASS_ACCURACY;
}

function pickWeighted(newKeys: string[], reviewKeys: string[]): string {
  const pool = newKeys.length === 0 || (reviewKeys.length > 0 && Math.random() >= 0.7) ? reviewKeys : newKeys;
  return pool[Math.floor(Math.random() * pool.length)];
}

const isLetter = (ch: string) => /^[a-z]$/.test(ch);

// Once enough letters are unlocked that real short words become typeable,
// blend those in alongside the pseudo-random drills — less jibberish, more
// like actual typing, without changing anything for early letter-only lessons.
function realWordCandidates(allowedKeys: string[]): string[] {
  const allowed = new Set(allowedKeys.filter(isLetter));
  if (allowed.size === 0) return [];
  return COMMON_WORDS.filter((w) => [...w.toLowerCase()].every((ch) => allowed.has(ch)));
}

export function generateDrillText(lesson: Lesson, wordCount = 24): string {
  if (lesson.useRealWords) {
    return generateWords(wordCount, { punctuation: false, numbers: false })
      .map((w) => w.toLowerCase())
      .join(" ");
  }

  if (lesson.mixedCase) {
    const letterPool = lesson.reviewKeys.filter(isLetter);
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const len = 2 + Math.floor(Math.random() * 3);
      let word = "";
      for (let j = 0; j < len; j++) {
        const ch = letterPool[Math.floor(Math.random() * letterPool.length)];
        word += Math.random() < 0.35 ? ch.toUpperCase() : ch;
      }
      words.push(word);
    }
    return words.join(" ");
  }

  const allLearned = [...lesson.newKeys, ...lesson.reviewKeys];
  const realWords = realWordCandidates(allLearned);
  const useRealWordChance = realWords.length >= 8 ? 0.5 : 0;

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    if (Math.random() < useRealWordChance) {
      words.push(realWords[Math.floor(Math.random() * realWords.length)]);
      continue;
    }
    const len = 2 + Math.floor(Math.random() * 3);
    let word = "";
    for (let j = 0; j < len; j++) {
      word += pickWeighted(lesson.newKeys, lesson.reviewKeys);
    }
    words.push(word);
  }
  return words.join(" ");
}

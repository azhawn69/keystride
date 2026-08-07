import { generateWords } from "./words";

export interface Lesson {
  id: string;
  title: string;
  newKeys: string[];
  reviewKeys: string[]; // filled in automatically below — everything learned in prior lessons
  useRealWords?: boolean;
}

interface LessonSeed {
  id: string;
  title: string;
  newKeys: string[];
  useRealWords?: boolean;
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

export function generateDrillText(lesson: Lesson, wordCount = 24): string {
  if (lesson.useRealWords) {
    return generateWords(wordCount, { punctuation: false, numbers: false })
      .map((w) => w.toLowerCase())
      .join(" ");
  }

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const len = 2 + Math.floor(Math.random() * 3);
    let word = "";
    for (let j = 0; j < len; j++) {
      word += pickWeighted(lesson.newKeys, lesson.reviewKeys);
    }
    words.push(word);
  }
  return words.join(" ");
}

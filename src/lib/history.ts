export interface TestResult {
  date: string; // ISO string
  mode: "time" | "words";
  amount: number; // seconds for time mode, word count for words mode
  wpm: number;
  rawWpm: number;
  accuracy: number;
  punctuation: boolean;
  numbers: boolean;
}

const STORAGE_KEY = "keystride:history";
const MAX_ENTRIES = 100;

export function loadHistory(): TestResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResult(result: TestResult): TestResult[] {
  const history = loadHistory();
  history.unshift(result);
  const trimmed = history.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage unavailable, ignore
  }
  return trimmed;
}

export function personalBest(history: TestResult[], mode: "time" | "words", amount: number): number {
  return history
    .filter((h) => h.mode === mode && h.amount === amount)
    .reduce((best, h) => Math.max(best, h.wpm), 0);
}

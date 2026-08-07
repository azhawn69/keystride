export interface ArcadeResult {
  date: string;
  score: number;
  level: number;
  wordsDestroyed: number;
  bestCombo: number;
}

const STORAGE_KEY = "keystride:arcade";
const MAX_ENTRIES = 50;

export function loadArcadeHistory(): ArcadeResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArcadeResult(result: ArcadeResult): ArcadeResult[] {
  const history = loadArcadeHistory();
  history.unshift(result);
  const trimmed = history.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage unavailable, ignore
  }
  return trimmed;
}

export function arcadeBestScore(history: ArcadeResult[]): number {
  return history.reduce((best, h) => Math.max(best, h.score), 0);
}

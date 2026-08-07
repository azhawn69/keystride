import type { TestResult } from "./history";
import type { ArcadeResult } from "./arcadeHistory";

// XP is fully derived from history — no separate mutable counter to keep in sync.
export function practiceXp(result: TestResult): number {
  return Math.round(result.wpm * (result.accuracy / 100));
}

export function arcadeXp(result: ArcadeResult): number {
  return Math.round(result.score / 5);
}

export function totalXp(practiceHistory: TestResult[], arcadeHistory: ArcadeResult[]): number {
  const fromPractice = practiceHistory.reduce((sum, r) => sum + practiceXp(r), 0);
  const fromArcade = arcadeHistory.reduce((sum, r) => sum + arcadeXp(r), 0);
  return fromPractice + fromArcade;
}

const XP_PER_LEVEL_BASE = 50;

// xp required to REACH a given level (level 1 = 0 xp)
export function xpForLevel(level: number): number {
  return XP_PER_LEVEL_BASE * (level - 1) ** 2;
}

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(Math.sqrt(xp / XP_PER_LEVEL_BASE));
}

export interface LevelProgress {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-1
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const xpIntoLevel = xp - currentFloor;
  const xpForNextLevel = nextFloor - currentFloor;
  return {
    level,
    xp,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0,
  };
}

export interface PracticeSummary {
  testsCompleted: number;
  bestWpm: number;
  bestAccuracy: number;
  avgWpmRecent: number;
}

export function summarizePractice(history: TestResult[]): PracticeSummary {
  if (history.length === 0) {
    return { testsCompleted: 0, bestWpm: 0, bestAccuracy: 0, avgWpmRecent: 0 };
  }
  const recent = history.slice(0, 10);
  return {
    testsCompleted: history.length,
    bestWpm: Math.max(...history.map((h) => h.wpm)),
    bestAccuracy: Math.max(...history.map((h) => h.accuracy)),
    avgWpmRecent: Math.round(recent.reduce((sum, h) => sum + h.wpm, 0) / recent.length),
  };
}

export interface ArcadeSummary {
  gamesPlayed: number;
  bestScore: number;
  highestWave: number;
  totalWordsDestroyed: number;
  bestCombo: number;
}

export function summarizeArcade(history: ArcadeResult[]): ArcadeSummary {
  if (history.length === 0) {
    return { gamesPlayed: 0, bestScore: 0, highestWave: 0, totalWordsDestroyed: 0, bestCombo: 0 };
  }
  return {
    gamesPlayed: history.length,
    bestScore: Math.max(...history.map((h) => h.score)),
    highestWave: Math.max(...history.map((h) => h.level)),
    totalWordsDestroyed: history.reduce((sum, h) => sum + h.wordsDestroyed, 0),
    bestCombo: Math.max(...history.map((h) => h.bestCombo)),
  };
}

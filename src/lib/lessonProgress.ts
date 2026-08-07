const STORAGE_KEY = "keystride:lessons";

export interface LessonProgress {
  unlockedIndex: number; // index of the furthest lesson the player has unlocked
  bestAccuracy: Record<string, number>; // lesson id -> best accuracy %
}

const DEFAULT_PROGRESS: LessonProgress = { unlockedIndex: 0, bestAccuracy: {} };

export function loadLessonProgress(): LessonProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      unlockedIndex: typeof parsed.unlockedIndex === "number" ? parsed.unlockedIndex : 0,
      bestAccuracy: typeof parsed.bestAccuracy === "object" && parsed.bestAccuracy ? parsed.bestAccuracy : {},
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function recordLessonResult(
  lessonIndex: number,
  lessonId: string,
  accuracy: number,
  passed: boolean,
): LessonProgress {
  const progress = loadLessonProgress();
  progress.bestAccuracy[lessonId] = Math.max(progress.bestAccuracy[lessonId] ?? 0, accuracy);
  if (passed) {
    progress.unlockedIndex = Math.max(progress.unlockedIndex, lessonIndex + 1);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage unavailable, ignore
  }
  return progress;
}

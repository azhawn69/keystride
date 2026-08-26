import { supabase } from "./supabase";
import { loadHistory, type TestResult } from "./history";
import { loadArcadeHistory, type ArcadeResult } from "./arcadeHistory";
import { loadLessonProgress, type LessonProgress } from "./lessonProgress";

const HISTORY_KEY = "keystride:history";
const ARCADE_KEY = "keystride:arcade";
const LESSONS_KEY = "keystride:lessons";
const MAX_ENTRIES = 100;

// Set by the auth hook whenever the session changes. Kept as a module-level
// value (rather than threaded through every call site) so the existing
// local-only save functions in history.ts/arcadeHistory.ts/lessonProgress.ts
// don't need to know anything about auth — callers just fire a push after
// their normal local save, and it's a no-op when signed out.
let currentUserId: string | null = null;

export function setCurrentUserId(id: string | null) {
  currentUserId = id;
}

export function clearCurrentUser() {
  currentUserId = null;
}

export function pushPracticeResult(result: TestResult) {
  if (!currentUserId) return;
  supabase
    .from("practice_results")
    .upsert(
      {
        user_id: currentUserId,
        date: result.date,
        mode: result.mode,
        amount: result.amount,
        wpm: result.wpm,
        raw_wpm: result.rawWpm,
        accuracy: result.accuracy,
        punctuation: result.punctuation,
        numbers: result.numbers,
      },
      { onConflict: "user_id,date" },
    )
    .then(({ error }) => {
      if (error) console.error("cloud sync (practice) failed", error);
    });
}

export function pushArcadeResult(result: ArcadeResult) {
  if (!currentUserId) return;
  supabase
    .from("arcade_results")
    .upsert(
      {
        user_id: currentUserId,
        date: result.date,
        score: result.score,
        level: result.level,
        words_destroyed: result.wordsDestroyed,
        best_combo: result.bestCombo,
      },
      { onConflict: "user_id,date" },
    )
    .then(({ error }) => {
      if (error) console.error("cloud sync (arcade) failed", error);
    });
}

export function pushLessonProgress(progress: LessonProgress) {
  if (!currentUserId) return;
  supabase
    .from("lesson_progress")
    .upsert(
      { user_id: currentUserId, unlocked_index: progress.unlockedIndex, best_accuracy: progress.bestAccuracy },
      { onConflict: "user_id" },
    )
    .then(({ error }) => {
      if (error) console.error("cloud sync (lessons) failed", error);
    });
}

// Postgres round-trips a timestamptz as "...+00:00" even when it was written
// as "...Z" — same instant, different string. Dedupe (and store) by the
// normalized ISO form so a synced result never looks "new" again later.
function dedupeByDate<T extends { date: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const normalized = new Date(item.date).toISOString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized === item.date ? item : { ...item, date: normalized });
  }
  return out;
}

interface PracticeRow {
  date: string;
  mode: string;
  amount: number;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  punctuation: boolean;
  numbers: boolean;
}

interface ArcadeRow {
  date: string;
  score: number;
  level: number;
  words_destroyed: number;
  best_combo: number;
}

interface LessonRow {
  unlocked_index: number;
  best_accuracy: Record<string, number>;
}

// Called once on sign-in: pushes whatever exists only on this device, pulls
// everything from the cloud, merges (dedupe by timestamp for history; take
// the max for lesson progress), and writes the merged result back to both
// localStorage and Supabase so every device converges on the same state.
export async function syncOnSignIn(userId: string): Promise<void> {
  setCurrentUserId(userId);

  const localHistory = loadHistory();
  const localArcade = loadArcadeHistory();
  const localLessons = loadLessonProgress();

  if (localHistory.length > 0) {
    await supabase.from("practice_results").upsert(
      localHistory.map((r) => ({
        user_id: userId,
        date: r.date,
        mode: r.mode,
        amount: r.amount,
        wpm: r.wpm,
        raw_wpm: r.rawWpm,
        accuracy: r.accuracy,
        punctuation: r.punctuation,
        numbers: r.numbers,
      })),
      { onConflict: "user_id,date" },
    );
  }
  if (localArcade.length > 0) {
    await supabase.from("arcade_results").upsert(
      localArcade.map((r) => ({
        user_id: userId,
        date: r.date,
        score: r.score,
        level: r.level,
        words_destroyed: r.wordsDestroyed,
        best_combo: r.bestCombo,
      })),
      { onConflict: "user_id,date" },
    );
  }

  const [{ data: remoteHistory }, { data: remoteArcade }, { data: remoteLessons }] = await Promise.all([
    supabase
      .from("practice_results")
      .select("date,mode,amount,wpm,raw_wpm,accuracy,punctuation,numbers")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(MAX_ENTRIES),
    supabase
      .from("arcade_results")
      .select("date,score,level,words_destroyed,best_combo")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(MAX_ENTRIES),
    supabase.from("lesson_progress").select("unlocked_index,best_accuracy").eq("user_id", userId).maybeSingle(),
  ]);

  const remoteHistoryRows = (remoteHistory ?? []) as PracticeRow[];
  const remoteArcadeRows = (remoteArcade ?? []) as ArcadeRow[];
  const remoteLessonRow = remoteLessons as LessonRow | null;

  const mergedHistory = dedupeByDate([
    ...remoteHistoryRows.map(
      (r): TestResult => ({
        date: r.date,
        mode: r.mode as TestResult["mode"],
        amount: r.amount,
        wpm: r.wpm,
        rawWpm: r.raw_wpm,
        accuracy: r.accuracy,
        punctuation: r.punctuation,
        numbers: r.numbers,
      }),
    ),
    ...localHistory,
  ])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ENTRIES);

  const mergedArcade = dedupeByDate([
    ...remoteArcadeRows.map(
      (r): ArcadeResult => ({
        date: r.date,
        score: r.score,
        level: r.level,
        wordsDestroyed: r.words_destroyed,
        bestCombo: r.best_combo,
      }),
    ),
    ...localArcade,
  ])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ENTRIES);

  const mergedLessons: LessonProgress = {
    unlockedIndex: Math.max(localLessons.unlockedIndex, remoteLessonRow?.unlocked_index ?? 0),
    bestAccuracy: { ...localLessons.bestAccuracy },
  };
  if (remoteLessonRow?.best_accuracy) {
    for (const [key, val] of Object.entries(remoteLessonRow.best_accuracy)) {
      mergedLessons.bestAccuracy[key] = Math.max(mergedLessons.bestAccuracy[key] ?? 0, val);
    }
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));
  localStorage.setItem(ARCADE_KEY, JSON.stringify(mergedArcade));
  localStorage.setItem(LESSONS_KEY, JSON.stringify(mergedLessons));

  await supabase
    .from("lesson_progress")
    .upsert(
      { user_id: userId, unlocked_index: mergedLessons.unlockedIndex, best_accuracy: mergedLessons.bestAccuracy },
      { onConflict: "user_id" },
    );
}

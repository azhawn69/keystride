import { useMemo } from "react";
import { GraduationCap, Gamepad2, Keyboard, Star, Trophy, Zap } from "lucide-react";
import type { TestResult } from "@/lib/history";
import type { ArcadeResult } from "@/lib/arcadeHistory";
import type { LessonProgress } from "@/lib/lessonProgress";
import { levelProgress, summarizeArcade, summarizeLessons, summarizePractice, totalXp } from "@/lib/profile";

interface ProfileViewProps {
  practiceHistory: TestResult[];
  arcadeHistory: ArcadeResult[];
  lessonProgress: LessonProgress;
}

interface Activity {
  date: string;
  kind: "practice" | "arcade";
  label: string;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

export function ProfileView({ practiceHistory, arcadeHistory, lessonProgress }: ProfileViewProps) {
  const xp = useMemo(
    () => totalXp(practiceHistory, arcadeHistory, lessonProgress),
    [practiceHistory, arcadeHistory, lessonProgress],
  );
  const progress = useMemo(() => levelProgress(xp), [xp]);
  const practice = useMemo(() => summarizePractice(practiceHistory), [practiceHistory]);
  const arcade = useMemo(() => summarizeArcade(arcadeHistory), [arcadeHistory]);
  const lessons = useMemo(() => summarizeLessons(lessonProgress), [lessonProgress]);

  const activity: Activity[] = useMemo(() => {
    const fromPractice: Activity[] = practiceHistory.map((r) => ({
      date: r.date,
      kind: "practice",
      label: `${r.wpm} wpm · ${r.accuracy}% · ${r.mode === "time" ? `${r.amount}s` : `${r.amount}w`}`,
    }));
    const fromArcade: Activity[] = arcadeHistory.map((r) => ({
      date: r.date,
      kind: "arcade",
      label: `${r.score} score · wave ${r.level} · ${r.wordsDestroyed} words`,
    }));
    return [...fromPractice, ...fromArcade].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  }, [practiceHistory, arcadeHistory]);

  const hasAnyHistory = practiceHistory.length > 0 || arcadeHistory.length > 0 || lessons.completed > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border bg-card/40 p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400/10">
            <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
          </div>
          <div className="min-w-[14rem] flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight">level {progress.level}</span>
              <span className="text-sm text-muted-foreground">{xp} total xp</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${Math.min(progress.progress * 100, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {progress.xpIntoLevel} / {progress.xpForNextLevel} xp to level {progress.level + 1}
            </div>
          </div>
        </div>
      </div>

      {!hasAnyHistory ? (
        <div className="rounded-md border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No sessions yet — play a practice test or a round of arcade and your stats will show up here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3 rounded-md border border-amber-400/30 bg-card/40 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <GraduationCap className="h-4 w-4 text-amber-400" />
              lessons
            </div>
            <StatRow label="completed" value={`${lessons.completed} / ${lessons.total}`} />
            <StatRow label="avg accuracy" value={lessons.avgAccuracy > 0 ? `${lessons.avgAccuracy}%` : "—"} />
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(lessons.completed / lessons.total) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Keyboard className="h-4 w-4 text-amber-400" />
              practice
            </div>
            <StatRow label="tests completed" value={practice.testsCompleted} />
            <StatRow label="best wpm" value={practice.bestWpm} />
            <StatRow label="best accuracy" value={`${practice.bestAccuracy}%`} />
            <StatRow label="avg wpm (last 10)" value={practice.avgWpmRecent} />
          </div>

          <div className="space-y-3 rounded-md border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Gamepad2 className="h-4 w-4 text-amber-400" />
              arcade
            </div>
            <StatRow label="games played" value={arcade.gamesPlayed} />
            <StatRow label="best score" value={arcade.bestScore} />
            <StatRow label="highest wave" value={arcade.highestWave} />
            <StatRow label="words destroyed" value={arcade.totalWordsDestroyed} />
            <StatRow label="best combo" value={arcade.bestCombo} />
          </div>
        </div>
      )}

      {activity.length > 0 && (
        <div className="rounded-md border border-border bg-card/40 p-5">
          <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">recent activity</div>
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {a.kind === "practice" ? (
                  <Keyboard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <Gamepad2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="font-mono text-foreground">{a.label}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {new Date(a.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Trophy className="h-3.5 w-3.5" />
        every session is saved automatically in this browser
        <Zap className="ml-2 h-3.5 w-3.5" />
        xp comes from lessons, practice, and arcade play
      </p>
    </div>
  );
}

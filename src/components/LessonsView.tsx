import { useEffect, useRef, useState } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LESSONS, passThreshold } from "@/lib/lessons";
import { loadLessonProgress, recordLessonResult, type LessonProgress } from "@/lib/lessonProgress";
import { pushLessonProgress } from "@/lib/cloudSync";
import { useLessonEngine } from "@/hooks/useLessonEngine";
import { FingerGuideKeyboard } from "./FingerGuideKeyboard";

export function LessonsView() {
  const [progress, setProgress] = useState<LessonProgress>(() => loadLessonProgress());
  const [selectedIndex, setSelectedIndex] = useState(() => Math.min(progress.unlockedIndex, LESSONS.length - 1));
  const lesson = LESSONS[selectedIndex];

  const engine = useLessonEngine(lesson);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [flash, setFlash] = useState(false);
  const recordedRef = useRef(false);
  const prevErrors = useRef(0);

  useEffect(() => {
    containerRef.current?.focus();
  }, [selectedIndex]);

  useEffect(() => {
    if (engine.errors > prevErrors.current) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 200);
      prevErrors.current = engine.errors;
      return () => window.clearTimeout(t);
    }
    prevErrors.current = engine.errors;
  }, [engine.errors]);

  useEffect(() => {
    if (engine.status === "ready") recordedRef.current = false;
    if (engine.status === "done" && !recordedRef.current) {
      recordedRef.current = true;
      const passed = engine.accuracy >= passThreshold();
      const updated = recordLessonResult(selectedIndex, lesson.id, engine.accuracy, passed);
      setProgress(updated);
      pushLessonProgress(updated);
    }
  }, [engine.status, engine.accuracy, selectedIndex, lesson.id]);

  const passed = engine.status === "done" && engine.accuracy >= passThreshold();
  const isLastLesson = selectedIndex === LESSONS.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-card/40 p-2.5">
        {LESSONS.map((l, i) => {
          const locked = i > progress.unlockedIndex;
          const best = progress.bestAccuracy[l.id];
          const done = best !== undefined && best >= passThreshold();
          return (
            <button
              key={l.id}
              disabled={locked}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                i === selectedIndex ? "bg-amber-400/15 text-amber-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {locked ? (
                <Lock className="h-3 w-3" />
              ) : done ? (
                <Check className="h-3 w-3 text-amber-400" />
              ) : (
                <span className="font-mono">{i + 1}</span>
              )}
              {l.title}
              {best !== undefined && <span className="text-muted-foreground">({best}%)</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{lesson.title}</h2>
        <span className="text-xs text-muted-foreground">
          lesson {selectedIndex + 1} / {LESSONS.length}
        </span>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={engine.handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "relative rounded-md border bg-card/40 p-6 outline-none transition-colors",
          flash ? "border-red-500/70" : "border-border focus:border-amber-400/40",
        )}
      >
        <div
          className={cn(
            "font-mono text-2xl leading-relaxed tracking-widest",
            !focused && engine.status !== "done" && "blur-sm",
          )}
        >
          {engine.drillText.split("").map((ch, i) => {
            let cls = "text-muted-foreground/50";
            if (i < engine.position) cls = "text-amber-400";
            return (
              <span key={i} className="relative">
                {i === engine.position && (
                  <span className="absolute -left-[1px] top-0 h-full w-[2px] animate-pulse bg-amber-400" />
                )}
                <span className={cls}>{ch}</span>
              </span>
            );
          })}
        </div>

        {!focused && engine.status !== "done" && (
          <button
            onClick={() => containerRef.current?.focus()}
            className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground"
          >
            click here or press any key to focus
          </button>
        )}

        {engine.status === "done" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 px-6 text-center">
            <h3 className="text-xl font-semibold tracking-tight">{passed ? "lesson passed" : "keep practicing"}</h3>
            <div className="flex gap-8">
              <div>
                <div className="font-mono text-3xl tabular-nums text-amber-400">{engine.accuracy}%</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">accuracy</div>
              </div>
              <div>
                <div className="font-mono text-3xl tabular-nums text-foreground">{engine.wpm}</div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">wpm</div>
              </div>
            </div>
            {!passed && (
              <p className="max-w-xs text-xs text-muted-foreground">
                need {passThreshold()}% accuracy to unlock the next lesson — mistakes block you until you get the
                right key, so slow down and aim for clean keystrokes.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  engine.restart();
                  containerRef.current?.focus();
                }}
                className="rounded border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-amber-400/40"
              >
                retry
              </button>
              {passed && !isLastLesson && (
                <button
                  onClick={() => setSelectedIndex((i) => Math.min(i + 1, LESSONS.length - 1))}
                  className="rounded bg-amber-400 px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
                >
                  next lesson
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <FingerGuideKeyboard nextChar={engine.nextChar} />

      <p className="text-xs text-muted-foreground">
        a wrong key won&rsquo;t advance the drill &mdash; correct it before moving on. this mode is about technique,
        not speed.
      </p>
    </div>
  );
}

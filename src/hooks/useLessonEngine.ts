import { useCallback, useEffect, useRef, useState } from "react";
import { generateDrillText, type Lesson } from "@/lib/lessons";

export type LessonStatus = "ready" | "active" | "done";

// Lessons are strict: a wrong key does not advance. This is deliberate — the
// point is correct technique, not forgiving your way through mistakes.
export function useLessonEngine(lesson: Lesson) {
  const [drillText, setDrillText] = useState(() => generateDrillText(lesson));
  const [position, setPosition] = useState(0);
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState<LessonStatus>("ready");
  const [elapsedMs, setElapsedMs] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  const reset = useCallback(() => {
    setDrillText(generateDrillText(lesson));
    setPosition(0);
    setErrors(0);
    setStatus("ready");
    setElapsedMs(0);
    startTimeRef.current = null;
  }, [lesson]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (status === "done") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();

      if (status === "ready") {
        startTimeRef.current = Date.now();
        setStatus("active");
      }

      const expected = drillText[position];
      if (e.key.toLowerCase() === expected) {
        const nextPos = position + 1;
        setPosition(nextPos);
        if (nextPos >= drillText.length) {
          setStatus("done");
          setElapsedMs(startTimeRef.current ? Date.now() - startTimeRef.current : 0);
        }
      } else {
        setErrors((prev) => prev + 1);
      }
    },
    [status, drillText, position],
  );

  const totalKeystrokes = position + errors;
  const accuracy = totalKeystrokes > 0 ? Math.round((position / totalKeystrokes) * 100) : 100;
  const minutes = elapsedMs / 60000;
  const wpm = status === "done" && minutes > 0 ? Math.round(drillText.length / 5 / minutes) : 0;
  const nextChar = status === "done" ? null : (drillText[position] ?? null);

  return {
    drillText,
    position,
    errors,
    status,
    accuracy,
    wpm,
    nextChar,
    handleKeyDown,
    restart: reset,
  };
}

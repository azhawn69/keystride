import { memo, useEffect, useRef, useState } from "react";
import type { EngineStatus } from "@/hooks/useTypingEngine";
import { cn } from "@/lib/utils";

interface TypingAreaProps {
  words: string[];
  typedWords: string[];
  currentWordIndex: number;
  status: EngineStatus;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const WordDisplay = memo(function WordDisplay({
  target,
  typed,
  isCurrent,
}: {
  target: string;
  typed: string;
  isCurrent: boolean;
}) {
  const chars = target.split("");
  const extra = typed.length > target.length ? typed.slice(target.length) : "";

  return (
    <span className="relative inline-flex">
      {chars.map((ch, i) => {
        const typedCh = typed[i];
        let cls = "text-muted-foreground/50";
        if (typedCh !== undefined) {
          cls = typedCh === ch ? "text-foreground" : "text-red-400 underline decoration-red-400/70";
        }
        return (
          <span key={i} className="relative">
            {isCurrent && i === typed.length && (
              <span className="absolute -left-[1px] top-0 h-full w-[2px] animate-pulse bg-amber-400" />
            )}
            <span className={cls}>{ch}</span>
          </span>
        );
      })}
      {isCurrent && typed.length === chars.length && (
        <span className="absolute -right-[1px] top-0 h-full w-[2px] animate-pulse bg-amber-400" />
      )}
      {extra && <span className="text-red-500/70 line-through decoration-red-500/70">{extra}</span>}
    </span>
  );
});

export function TypingArea({ words, typedWords, currentWordIndex, status, onKeyDown }: TypingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentWordIndex]);

  // Only render a window of words around the current index for readability.
  const windowStart = Math.max(0, currentWordIndex - 4);
  const windowEnd = Math.min(words.length, windowStart + 70);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="relative rounded-md border border-border bg-card/40 p-6 outline-none focus:border-amber-400/40"
    >
      <div
        className={cn(
          "max-h-[9.5rem] overflow-hidden font-mono text-2xl leading-[2.75rem] tracking-wide",
          !focused && status !== "finished" && "blur-sm",
        )}
      >
        {words.slice(windowStart, windowEnd).map((w, i) => {
          const idx = windowStart + i;
          return (
            <span
              key={idx}
              ref={idx === currentWordIndex ? activeWordRef : undefined}
              className="mr-3 inline-block"
            >
              <WordDisplay target={w} typed={typedWords[idx] ?? ""} isCurrent={idx === currentWordIndex} />
            </span>
          );
        })}
      </div>

      {!focused && status !== "finished" && (
        <button
          onClick={() => containerRef.current?.focus()}
          className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground"
        >
          click here or press any key to focus
        </button>
      )}
    </div>
  );
}

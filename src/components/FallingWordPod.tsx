import { memo } from "react";
import { cn } from "@/lib/utils";
import type { FallingWord } from "@/hooks/useArcadeGame";

interface FallingWordPodProps {
  word: FallingWord;
  isActive: boolean;
}

// Depth cues: words scale up and brighten as they approach the bottom, giving a
// sense of them flying toward the player rather than sliding down a flat plane.
function depthStyle(y: number): { scale: number; opacity: number } {
  const t = Math.min(Math.max(y / 100, 0), 1);
  return { scale: 0.78 + t * 0.55, opacity: 0.6 + t * 0.4 };
}

export const FallingWordPod = memo(function FallingWordPod({ word, isActive }: FallingWordPodProps) {
  const chars = word.text.split("");
  const { scale, opacity } = depthStyle(word.y);

  return (
    <div
      className={cn(
        "absolute whitespace-nowrap rounded-md border px-3 py-1.5 font-mono text-lg backdrop-blur-sm transition-colors",
        isActive
          ? "border-amber-400 bg-amber-400/15 shadow-[0_0_18px_rgba(251,191,36,0.55)]"
          : "border-white/10 bg-card/80 shadow-[0_0_10px_rgba(0,0,0,0.4)]",
      )}
      style={{
        left: `${word.x}%`,
        top: `${word.y}%`,
        opacity,
        transform: `translate(-50%, 0) scale(${scale})`,
        zIndex: Math.round(word.y),
      }}
    >
      {chars.map((ch, i) => (
        <span
          key={i}
          className={cn(
            "transition-colors",
            i < word.typedLength ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" : "text-foreground",
          )}
        >
          {ch}
        </span>
      ))}
    </div>
  );
});

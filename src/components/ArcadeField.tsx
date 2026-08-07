import { useEffect, useRef, useState } from "react";
import { Heart, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useArcadeGame } from "@/hooks/useArcadeGame";
import { FallingWordPod } from "./FallingWordPod";

const SHARDS_PER_BURST = 8;

function ParticleBurst({ x, y, seed }: { x: number; y: number; seed: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      {Array.from({ length: SHARDS_PER_BURST }).map((_, i) => {
        const angle = (360 / SHARDS_PER_BURST) * i + (seed % 30);
        const dist = 28 + (seed % 5) * 6;
        return (
          <span
            key={i}
            className="animate-shard-burst absolute h-1.5 w-1.5 rounded-full bg-amber-400"
            style={{ "--angle": `${angle}deg`, "--dist": `${dist}px` } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

export function ArcadeField() {
  const game = useArcadeGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const showOverlay = game.status !== "playing";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card/40 px-4 py-2.5 font-mono">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-2xl tabular-nums text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              {game.score}
            </span>
            <span className="ml-1.5 text-xs text-muted-foreground">score</span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  "h-4 w-4 transition-colors",
                  i < game.lives ? "fill-red-400 text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]" : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm text-muted-foreground transition-colors",
              game.combo >= 5 && "text-amber-400",
            )}
          >
            <Zap className={cn("h-3.5 w-3.5", game.combo >= 5 ? "fill-amber-400 text-amber-400" : "text-amber-400")} />
            <span className={game.combo >= 5 ? "text-amber-400" : "text-foreground"}>{game.combo}</span>
            <span>combo</span>
          </div>
          <div className="text-sm text-muted-foreground">
            wave <span className="text-foreground">{game.level}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          best <span className="text-foreground">{game.bestScore}</span>
        </div>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={game.handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "arcade-starfield relative h-[28rem] overflow-hidden rounded-md border bg-[radial-gradient(ellipse_at_50%_120%,rgba(251,191,36,0.08),transparent_60%)] bg-card/60 outline-none transition-colors",
          game.hit ? "animate-field-shake border-red-500/70" : "border-border focus:border-amber-400/40",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        {game.words.map((w) => (
          <FallingWordPod key={w.id} word={w} isActive={w.id === game.activeWordId} />
        ))}

        {game.particles.map((p) => (
          <ParticleBurst key={p.id} x={p.x} y={p.y} seed={p.id} />
        ))}

        {!focused && game.status === "playing" && (
          <button
            onClick={() => containerRef.current?.focus()}
            className="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground"
          >
            click here or press any key to focus
          </button>
        )}

        {showOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 px-6 text-center">
            {game.status === "idle" && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">arcade mode</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Type the falling words before they hit the bottom. Missed words cost a life &mdash; survive as long
                  as you can as the pace ramps up.
                </p>
                {game.bestScore > 0 && (
                  <p className="text-sm text-muted-foreground">
                    best score: <span className="text-amber-400">{game.bestScore}</span>
                  </p>
                )}
                <button
                  onClick={() => {
                    game.start();
                    containerRef.current?.focus();
                  }}
                  className="rounded bg-amber-400 px-5 py-2 text-sm font-medium text-black shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-opacity hover:opacity-90"
                >
                  start
                </button>
                <p className="text-xs text-muted-foreground">or just start typing</p>
              </>
            )}

            {game.status === "gameover" && game.lastResult && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">game over</h2>
                {game.lastResult.score >= game.bestScore && game.lastResult.score > 0 && (
                  <p className="text-sm text-amber-400">new best score</p>
                )}
                <div className="flex gap-8">
                  <div>
                    <div className="font-mono text-3xl tabular-nums text-amber-400">{game.lastResult.score}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">score</div>
                  </div>
                  <div>
                    <div className="font-mono text-3xl tabular-nums text-foreground">{game.lastResult.level}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">wave</div>
                  </div>
                  <div>
                    <div className="font-mono text-3xl tabular-nums text-foreground">
                      {game.lastResult.wordsDestroyed}
                    </div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">words</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    game.start();
                    containerRef.current?.focus();
                  }}
                  className="rounded bg-amber-400 px-5 py-2 text-sm font-medium text-black shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-opacity hover:opacity-90"
                >
                  play again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        type any letter to lock onto the nearest matching word &middot; finish it before it reaches the bottom
      </p>
    </div>
  );
}

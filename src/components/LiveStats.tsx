import type { EngineSettings, EngineStatus } from "@/hooks/useTypingEngine";

interface LiveStatsProps {
  status: EngineStatus;
  settings: EngineSettings;
  timeLeft: number;
  elapsed: number;
  liveWpm: number;
  liveAccuracy: number;
}

export function LiveStats({ status, settings, timeLeft, elapsed, liveWpm, liveAccuracy }: LiveStatsProps) {
  const primary = settings.mode === "time" ? timeLeft : elapsed;
  const label = settings.mode === "time" ? "s left" : "s elapsed";

  return (
    <div className="flex items-baseline gap-8 px-1 font-mono">
      <div>
        <span className="text-3xl tabular-nums text-amber-400">{status === "waiting" ? settings.mode === "time" ? settings.timeLimit : 0 : primary}</span>
        <span className="ml-1.5 text-sm text-muted-foreground">{label}</span>
      </div>
      <div>
        <span className="text-3xl tabular-nums text-foreground">{status === "waiting" ? 0 : liveWpm}</span>
        <span className="ml-1.5 text-sm text-muted-foreground">wpm</span>
      </div>
      <div>
        <span className="text-3xl tabular-nums text-foreground">{status === "waiting" ? 100 : liveAccuracy}</span>
        <span className="ml-1.5 text-sm text-muted-foreground">% acc</span>
      </div>
    </div>
  );
}

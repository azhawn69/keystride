import { ArrowRight, Trophy } from "lucide-react";
import type { TestResult } from "@/lib/history";
import type { WpmSample } from "@/hooks/useTypingEngine";
import { WpmChart } from "./WpmChart";

interface ResultsPanelProps {
  result: TestResult;
  wpmHistory: WpmSample[];
  isPersonalBest: boolean;
  recentHistory: TestResult[];
  onNext: () => void;
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-mono text-4xl tabular-nums text-amber-400">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export function ResultsPanel({ result, wpmHistory, isPersonalBest, recentHistory, onNext }: ResultsPanelProps) {
  return (
    <div className="space-y-6 rounded-md border border-border bg-card/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex gap-10">
          <StatBlock label="wpm" value={result.wpm} />
          <StatBlock label="accuracy" value={`${result.accuracy}%`} />
          <StatBlock label="raw wpm" value={result.rawWpm} />
        </div>

        {isPersonalBest && (
          <div className="flex items-center gap-1.5 rounded bg-amber-400/10 px-3 py-1.5 text-sm text-amber-400">
            <Trophy className="h-4 w-4" />
            new personal best
          </div>
        )}
      </div>

      <WpmChart data={wpmHistory} />

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          {result.mode === "time" ? `${result.amount}s` : `${result.amount} words`}
          {result.punctuation && " · punctuation"}
          {result.numbers && " · numbers"}
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 rounded bg-amber-400 px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          next test
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {recentHistory.length > 1 && (
        <div className="border-t border-border pt-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">recent</div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm text-muted-foreground">
            {recentHistory.slice(1, 9).map((r, i) => (
              <span key={i}>
                <span className="text-foreground">{r.wpm}</span>wpm / {r.accuracy}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

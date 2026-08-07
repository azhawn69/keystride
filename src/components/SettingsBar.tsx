import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EngineSettings, TestMode } from "@/hooks/useTypingEngine";

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

interface SettingsBarProps {
  settings: EngineSettings;
  onChange: (settings: EngineSettings) => void;
  onRestart: () => void;
  disabled: boolean;
}

function Pill({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded px-2.5 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-amber-400/15 text-amber-400" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function SettingsBar({ settings, onChange, onRestart, disabled }: SettingsBarProps) {
  const setMode = (mode: TestMode) => onChange({ ...settings, mode });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card/40 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-1">
        <Pill active={settings.punctuation} onClick={() => onChange({ ...settings, punctuation: !settings.punctuation })} disabled={disabled}>
          @ punctuation
        </Pill>
        <Pill active={settings.numbers} onClick={() => onChange({ ...settings, numbers: !settings.numbers })} disabled={disabled}>
          # numbers
        </Pill>

        <span className="mx-1.5 h-4 w-px bg-border" />

        <Pill active={settings.mode === "time"} onClick={() => setMode("time")} disabled={disabled}>
          time
        </Pill>
        <Pill active={settings.mode === "words"} onClick={() => setMode("words")} disabled={disabled}>
          words
        </Pill>

        <span className="mx-1.5 h-4 w-px bg-border" />

        {(settings.mode === "time" ? TIME_OPTIONS : WORD_OPTIONS).map((n) => (
          <Pill
            key={n}
            active={settings.mode === "time" ? settings.timeLimit === n : settings.wordCount === n}
            onClick={() =>
              onChange(
                settings.mode === "time" ? { ...settings, timeLimit: n } : { ...settings, wordCount: n },
              )
            }
            disabled={disabled}
          >
            {n}
          </Pill>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-amber-400"
        title="Restart test"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        restart
      </button>
    </div>
  );
}

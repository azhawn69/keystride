import { cn } from "@/lib/utils";
import { FINGER_COLORS, HOME_BUMP_KEYS, HOME_ROW_KEYS, fingerForChar } from "@/lib/fingerMap";

interface FingerGuideKeyboardProps {
  nextChar: string | null;
  className?: string;
}

const ROWS: { keys: string[]; offset: string }[] = [
  { keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="], offset: "ml-0" },
  { keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"], offset: "ml-1 sm:ml-3" },
  { keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"], offset: "ml-2 sm:ml-5" },
  { keys: ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"], offset: "ml-3 sm:ml-8" },
];

const KEY_SIZE = "h-5 w-5 text-[10px] sm:h-7 sm:w-7 sm:text-xs";

export function FingerGuideKeyboard({ nextChar, className }: FingerGuideKeyboardProps) {
  const activeKey = nextChar ? nextChar.toLowerCase() : null;
  const activeFinger = nextChar ? fingerForChar(nextChar) : null;

  return (
    <div className={cn("select-none rounded-md border border-border bg-card/40 p-2.5 sm:p-4", className)}>
      <div className="overflow-x-auto">
        <div className="flex w-max min-w-full flex-col items-center gap-1 font-mono sm:gap-1.5">
          {ROWS.map((row, ri) => (
            <div key={ri} className={cn("flex gap-1 sm:gap-1.5", row.offset)}>
              {row.keys.map((k) => {
                const finger = fingerForChar(k);
                const colors = finger ? FINGER_COLORS[finger] : { bg: "bg-secondary", text: "text-foreground" };
                const isActive = activeKey === k;
                const isHome = HOME_ROW_KEYS.includes(k);
                const hasBump = HOME_BUMP_KEYS.includes(k);
                return (
                  <div
                    key={k}
                    className={cn(
                      "relative flex shrink-0 items-center justify-center rounded transition-all",
                      KEY_SIZE,
                      colors.bg,
                      colors.text,
                      isHome && "border-b-2 border-b-white/25",
                      isActive && "z-10 scale-125 bg-amber-400 text-black shadow-[0_0_14px_rgba(251,191,36,0.7)]",
                    )}
                  >
                    {k}
                    {hasBump && !isActive && (
                      <span className="absolute bottom-0.5 h-0.5 w-1.5 rounded-full bg-white/40 sm:bottom-1 sm:w-2" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="mt-1 flex justify-center">
            <div
              className={cn(
                "flex h-5 w-28 items-center justify-center rounded transition-all sm:h-7 sm:w-40",
                FINGER_COLORS.thumb.bg,
                FINGER_COLORS.thumb.text,
                activeKey === " " && "scale-105 bg-amber-400 text-black shadow-[0_0_14px_rgba(251,191,36,0.7)]",
              )}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {activeFinger ? (
          <>
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                FINGER_COLORS[activeFinger].bg.replace("/25", ""),
              )}
            />
            use your <span className="text-foreground">{activeFinger.replace("-", " ")}</span> finger
          </>
        ) : (
          <span>rest your fingers on the home row — left on ASDF, right on JKL;</span>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypingEngine, type EngineSettings } from "@/hooks/useTypingEngine";
import { loadHistory, personalBest, saveResult, type TestResult } from "@/lib/history";
import { loadArcadeHistory, type ArcadeResult } from "@/lib/arcadeHistory";
import { SettingsBar } from "@/components/SettingsBar";
import { LiveStats } from "@/components/LiveStats";
import { TypingArea } from "@/components/TypingArea";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ArcadeField } from "@/components/ArcadeField";
import { ProfileView } from "@/components/ProfileView";
import { FingerGuideKeyboard } from "@/components/FingerGuideKeyboard";
import { LessonsView } from "@/components/LessonsView";

const DEFAULT_SETTINGS: EngineSettings = {
  mode: "time",
  timeLimit: 30,
  wordCount: 25,
  punctuation: false,
  numbers: false,
};

type ViewMode = "practice" | "lessons" | "arcade" | "stats";

function App() {
  const [view, setView] = useState<ViewMode>("practice");
  const [settings, setSettings] = useState<EngineSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<TestResult[]>(() => loadHistory());
  const [arcadeHistory, setArcadeHistory] = useState<ArcadeResult[]>([]);
  const [session, setSession] = useState<{ result: TestResult; isPersonalBest: boolean } | null>(null);

  useEffect(() => {
    if (view === "stats") setArcadeHistory(loadArcadeHistory());
  }, [view]);

  const handleFinish = useCallback((result: TestResult) => {
    const priorBest = personalBest(history, result.mode, result.amount);
    const updated = saveResult(result);
    setHistory(updated);
    setSession({ result, isPersonalBest: result.wpm >= priorBest });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const engine = useTypingEngine(settings, handleFinish);

  const changeSettings = (next: EngineSettings) => {
    setSession(null);
    setSettings(next);
  };

  const handleRestart = () => {
    setSession(null);
    engine.restart();
  };

  const relevantHistory = useMemo(
    () => history.filter((h) => h.mode === settings.mode && h.amount === (settings.mode === "time" ? settings.timeLimit : settings.wordCount)),
    [history, settings],
  );

  const nextChar = useMemo(() => {
    const currentWord = engine.words[engine.currentWordIndex] ?? "";
    const currentTyped = engine.typedWords[engine.currentWordIndex] ?? "";
    if (engine.status === "finished") return null;
    return currentTyped.length < currentWord.length ? currentWord[currentTyped.length] : " ";
  }, [engine.words, engine.typedWords, engine.currentWordIndex, engine.status]);

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl font-semibold tracking-tight">keystride</h1>
            <span className="hidden text-sm text-muted-foreground sm:inline">— type faster, more accurately</span>
          </div>
          <div className="ml-auto flex rounded-md border border-border bg-card/40 p-0.5 text-sm">
            <button
              onClick={() => setView("practice")}
              className={cn(
                "rounded px-3 py-1 transition-colors",
                view === "practice" ? "bg-amber-400/15 text-amber-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              practice
            </button>
            <button
              onClick={() => setView("lessons")}
              className={cn(
                "rounded px-3 py-1 transition-colors",
                view === "lessons" ? "bg-amber-400/15 text-amber-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              lessons
            </button>
            <button
              onClick={() => setView("arcade")}
              className={cn(
                "rounded px-3 py-1 transition-colors",
                view === "arcade" ? "bg-amber-400/15 text-amber-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              arcade
            </button>
            <button
              onClick={() => setView("stats")}
              className={cn(
                "rounded px-3 py-1 transition-colors",
                view === "stats" ? "bg-amber-400/15 text-amber-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              stats
            </button>
          </div>
        </header>

        {view === "arcade" ? (
          <ArcadeField />
        ) : view === "stats" ? (
          <ProfileView practiceHistory={history} arcadeHistory={arcadeHistory} />
        ) : view === "lessons" ? (
          <LessonsView />
        ) : (
          <>
            <SettingsBar
              settings={settings}
              onChange={changeSettings}
              onRestart={handleRestart}
              disabled={engine.status === "running"}
            />

            {session ? (
              <ResultsPanel
                result={session.result}
                wpmHistory={engine.wpmHistory}
                isPersonalBest={session.isPersonalBest}
                recentHistory={relevantHistory}
                onNext={handleRestart}
              />
            ) : (
              <div className="space-y-4">
                <LiveStats
                  status={engine.status}
                  settings={settings}
                  timeLeft={engine.timeLeft}
                  elapsed={engine.elapsed}
                  liveWpm={engine.liveWpm}
                  liveAccuracy={engine.liveAccuracy}
                />
                <TypingArea
                  words={engine.words}
                  typedWords={engine.typedWords}
                  currentWordIndex={engine.currentWordIndex}
                  status={engine.status}
                  onKeyDown={engine.handleKeyDown}
                />
                <p className="text-xs text-muted-foreground">
                  start typing to begin · backspace to fix mistakes · space to move to the next word
                </p>
                <FingerGuideKeyboard nextChar={nextChar} />
              </div>
            )}

            {relevantHistory.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>personal best for this test:</span>
                <span className="font-mono text-amber-400">
                  {personalBest(history, settings.mode, settings.mode === "time" ? settings.timeLimit : settings.wordCount)}{" "}
                  wpm
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

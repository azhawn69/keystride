import { useCallback, useEffect, useRef, useState } from "react";
import { generateWords } from "@/lib/words";
import type { TestResult } from "@/lib/history";

export type TestMode = "time" | "words";
export type EngineStatus = "waiting" | "running" | "finished";

export interface EngineSettings {
  mode: TestMode;
  timeLimit: number; // seconds, used when mode === "time"
  wordCount: number; // used when mode === "words"
  punctuation: boolean;
  numbers: boolean;
}

export interface WpmSample {
  time: number; // seconds since start
  wpm: number;
}

interface Stats {
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
}

const INITIAL_WORD_BATCH = 60;
const REFILL_THRESHOLD = 20;
const REFILL_AMOUNT = 60;
const MAX_OVERFLOW = 15;

function computeStats(
  words: string[],
  typedWords: string[],
  currentWordIndex: number,
  currentInput: string,
): Stats {
  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;

  for (let i = 0; i <= currentWordIndex; i++) {
    const target = words[i] ?? "";
    const typed = i < currentWordIndex ? typedWords[i] ?? "" : currentInput;
    const maxLen = Math.max(target.length, typed.length);

    for (let j = 0; j < maxLen; j++) {
      if (j < target.length && j < typed.length) {
        if (typed[j] === target[j]) correctChars++;
        else incorrectChars++;
      } else if (j >= target.length && j < typed.length) {
        extraChars++;
      } else if (j < target.length && j >= typed.length) {
        if (i < currentWordIndex) missedChars++;
      }
    }

    // count the separating space as a correct keystroke for finalized words
    if (i < currentWordIndex) correctChars++;
  }

  return { correctChars, incorrectChars, extraChars, missedChars };
}

export function useTypingEngine(
  settings: EngineSettings,
  onFinish: (result: TestResult) => void,
) {
  const [words, setWords] = useState<string[]>(() =>
    generateWords(
      settings.mode === "words" ? settings.wordCount : INITIAL_WORD_BATCH,
      settings,
    ),
  );
  const [typedWords, setTypedWords] = useState<string[]>([""]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [status, setStatus] = useState<EngineStatus>("waiting");
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [elapsed, setElapsed] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<WpmSample[]>([]);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  const startTimeRef = useRef<number | null>(null);
  const totalKeystrokesRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  // mirror latest state into a ref so interval callbacks avoid stale closures
  const stateRef = useRef({ words, typedWords, currentWordIndex });
  stateRef.current = { words, typedWords, currentWordIndex };

  const reset = useCallback(() => {
    finishedRef.current = false;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    startTimeRef.current = null;
    totalKeystrokesRef.current = 0;
    setWords(
      generateWords(
        settings.mode === "words" ? settings.wordCount : INITIAL_WORD_BATCH,
        settings,
      ),
    );
    setTypedWords([""]);
    setCurrentWordIndex(0);
    setStatus("waiting");
    setTimeLeft(settings.timeLimit);
    setElapsed(0);
    setWpmHistory([]);
    setLiveWpm(0);
    setLiveAccuracy(100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode, settings.timeLimit, settings.wordCount, settings.punctuation, settings.numbers]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode, settings.timeLimit, settings.wordCount, settings.punctuation, settings.numbers]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;

    const { words, typedWords, currentWordIndex } = stateRef.current;
    const currentInput = typedWords[currentWordIndex] ?? "";
    const stats = computeStats(words, typedWords, currentWordIndex, currentInput);
    const elapsedMinutes = startTimeRef.current
      ? Math.max((Date.now() - startTimeRef.current) / 60000, 1 / 60)
      : 1 / 60;

    const wpm = Math.round(stats.correctChars / 5 / elapsedMinutes);
    const rawWpm = Math.round(totalKeystrokesRef.current / 5 / elapsedMinutes);
    const totalJudged = stats.correctChars + stats.incorrectChars;
    const accuracy = totalJudged > 0 ? Math.round((stats.correctChars / totalJudged) * 100) : 100;

    setStatus("finished");

    const result: TestResult = {
      date: new Date().toISOString(),
      mode: settings.mode,
      amount: settings.mode === "time" ? settings.timeLimit : settings.wordCount,
      wpm,
      rawWpm,
      accuracy,
      punctuation: settings.punctuation,
      numbers: settings.numbers,
    };
    onFinish(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, onFinish]);

  const sample = useCallback(() => {
    if (!startTimeRef.current) return;
    const { words, typedWords, currentWordIndex } = stateRef.current;
    const currentInput = typedWords[currentWordIndex] ?? "";
    const stats = computeStats(words, typedWords, currentWordIndex, currentInput);
    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    const elapsedMinutes = Math.max(elapsedSeconds / 60, 1 / 120);
    const wpm = Math.round(stats.correctChars / 5 / elapsedMinutes);
    const totalJudged = stats.correctChars + stats.incorrectChars;
    const accuracy = totalJudged > 0 ? Math.round((stats.correctChars / totalJudged) * 100) : 100;

    setLiveWpm(wpm);
    setLiveAccuracy(accuracy);
    setWpmHistory((prev) => [...prev, { time: Math.round(elapsedSeconds), wpm }]);
    setElapsed(Math.round(elapsedSeconds));

    if (settings.mode === "time") {
      const left = Math.max(settings.timeLimit - Math.round(elapsedSeconds), 0);
      setTimeLeft(left);
      if (left <= 0) finish();
    }
  }, [settings.mode, settings.timeLimit, finish]);

  const startTest = useCallback(() => {
    if (status !== "waiting") return;
    startTimeRef.current = Date.now();
    setStatus("running");
    intervalRef.current = window.setInterval(sample, 500);
  }, [status, sample]);

  const maybeRefillWords = useCallback(
    (idx: number) => {
      if (settings.mode !== "time") return;
      setWords((prev) => {
        if (prev.length - idx > REFILL_THRESHOLD) return prev;
        return [...prev, ...generateWords(REFILL_AMOUNT, settings)];
      });
    },
    [settings],
  );

  const addChar = useCallback(
    (char: string) => {
      const { words, currentWordIndex, typedWords } = stateRef.current;
      const target = words[currentWordIndex] ?? "";
      const current = typedWords[currentWordIndex] ?? "";
      if (current.length >= target.length + MAX_OVERFLOW) return;

      totalKeystrokesRef.current += 1;
      setTypedWords((prev) => {
        const copy = [...prev];
        copy[currentWordIndex] = current + char;
        return copy;
      });

      const isLastWord = currentWordIndex === words.length - 1 && settings.mode === "words";
      if (isLastWord && current.length + 1 >= target.length) {
        // allow finishing the last word without a trailing space
        window.setTimeout(() => finish(), 0);
      }
    },
    [settings.mode, finish],
  );

  const advanceWord = useCallback(() => {
    const { currentWordIndex, typedWords, words } = stateRef.current;
    const current = typedWords[currentWordIndex] ?? "";
    if (current.length === 0) return;

    totalKeystrokesRef.current += 1; // count the space keystroke
    const nextIndex = currentWordIndex + 1;
    setCurrentWordIndex(nextIndex);
    setTypedWords((prev) => {
      const copy = [...prev];
      if (copy[nextIndex] === undefined) copy[nextIndex] = "";
      return copy;
    });
    maybeRefillWords(nextIndex);

    if (settings.mode === "words" && nextIndex >= words.length) {
      window.setTimeout(() => finish(), 0);
    }
  }, [settings.mode, maybeRefillWords, finish]);

  const backspace = useCallback(() => {
    const { currentWordIndex, typedWords } = stateRef.current;
    const current = typedWords[currentWordIndex] ?? "";
    if (current.length > 0) {
      setTypedWords((prev) => {
        const copy = [...prev];
        copy[currentWordIndex] = current.slice(0, -1);
        return copy;
      });
    } else if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (status === "finished") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (status === "waiting") return;
        advanceWord();
        return;
      }
      if (e.key.length === 1) {
        e.preventDefault();
        if (status === "waiting") startTest();
        addChar(e.key);
      }
    },
    [status, backspace, advanceWord, addChar, startTest],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  return {
    words,
    typedWords,
    currentWordIndex,
    status,
    timeLeft,
    elapsed,
    wpmHistory,
    liveWpm,
    liveAccuracy,
    handleKeyDown,
    restart: reset,
  };
}

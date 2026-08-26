import { useCallback, useEffect, useRef, useState } from "react";
import { COMMON_WORDS } from "@/lib/words";
import { arcadeBestScore, loadArcadeHistory, saveArcadeResult, type ArcadeResult } from "@/lib/arcadeHistory";
import { pushArcadeResult } from "@/lib/cloudSync";

export type ArcadeStatus = "idle" | "playing" | "gameover";

export interface FallingWord {
  id: number;
  text: string;
  x: number; // percent across the field, 0-100
  y: number; // percent down the field, 0 (top) - 100 (bottom)
  speed: number; // percent per second
  typedLength: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
}

const INITIAL_LIVES = 3;
const BASE_SPEED = 5.5;
const SPEED_PER_LEVEL = 1.15;
const BASE_SPAWN_MS = 1900;
const SPAWN_DECREASE_PER_LEVEL = 110;
const MIN_SPAWN_MS = 550;
const LEVEL_UP_SECONDS = 15;
const MAX_CONCURRENT_WORDS = 9;
const MAX_DT = 0.05; // clamp to avoid huge jumps after a throttled/background tab

function randomWord(): string {
  return COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
}

interface LiveState {
  words: FallingWord[];
  activeWordId: number | null;
  lives: number;
  combo: number;
  bestCombo: number;
  score: number;
  wordsDestroyed: number;
  status: ArcadeStatus;
}

export function useArcadeGame() {
  const [words, setWords] = useState<FallingWord[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [status, setStatus] = useState<ArcadeStatus>("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);
  const [wordsDestroyed, setWordsDestroyed] = useState(0);
  const [history, setHistory] = useState<ArcadeResult[]>(() => loadArcadeHistory());
  const [lastResult, setLastResult] = useState<ArcadeResult | null>(null);
  const [hit, setHit] = useState(false); // brief life-lost flash

  const liveRef = useRef<LiveState>({
    words,
    activeWordId,
    lives,
    combo,
    bestCombo,
    score,
    wordsDestroyed,
    status,
  });
  liveRef.current = { words, activeWordId, lives, combo, bestCombo, score, wordsDestroyed, status };

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const nextIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastLevelRef = useRef(1);

  const start = useCallback(() => {
    nextIdRef.current = 0;
    particleIdRef.current = 0;
    elapsedRef.current = 0;
    spawnTimerRef.current = BASE_SPAWN_MS / 1000; // spawn the first word almost immediately
    lastTimeRef.current = null;
    lastLevelRef.current = 1;
    setWords([]);
    setParticles([]);
    setActiveWordId(null);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    setWordsDestroyed(0);
    setLastResult(null);
    setStatus("playing");
  }, []);

  const endGame = useCallback(() => {
    const { score, wordsDestroyed, bestCombo } = liveRef.current;
    setStatus("gameover");
    const result: ArcadeResult = {
      date: new Date().toISOString(),
      score,
      level: lastLevelRef.current,
      wordsDestroyed,
      bestCombo,
    };
    setLastResult(result);
    setHistory(saveArcadeResult(result));
    pushArcadeResult(result);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;

    const loop = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, MAX_DT);
      lastTimeRef.current = now;
      elapsedRef.current += dt;
      spawnTimerRef.current += dt;

      const level = 1 + Math.floor(elapsedRef.current / LEVEL_UP_SECONDS);
      if (level !== lastLevelRef.current) {
        lastLevelRef.current = level;
        setLevel(level);
      }

      const spawnIntervalMs = Math.max(BASE_SPAWN_MS - (level - 1) * SPAWN_DECREASE_PER_LEVEL, MIN_SPAWN_MS);
      const current = liveRef.current.words;
      const shouldSpawn = spawnTimerRef.current * 1000 >= spawnIntervalMs && current.length < MAX_CONCURRENT_WORDS;

      let nextWords = current.map((w) => ({ ...w, y: w.y + w.speed * dt }));

      if (shouldSpawn) {
        spawnTimerRef.current = 0;
        nextWords = [
          ...nextWords,
          {
            id: nextIdRef.current++,
            text: randomWord(),
            x: 8 + Math.random() * 84,
            y: 0,
            speed: BASE_SPEED + (level - 1) * SPEED_PER_LEVEL + (Math.random() * 0.8 - 0.4),
            typedLength: 0,
          },
        ];
      }

      const missed = nextWords.filter((w) => w.y >= 100);
      const alive = nextWords.filter((w) => w.y < 100);
      liveRef.current = { ...liveRef.current, words: alive };
      setWords(alive);

      if (missed.length > 0) {
        const newLives = liveRef.current.lives - missed.length;
        liveRef.current = { ...liveRef.current, lives: newLives, combo: 0 };
        setLives(newLives);
        setCombo(0);
        if (missed.some((w) => w.id === liveRef.current.activeWordId)) {
          setActiveWordId(null);
          liveRef.current = { ...liveRef.current, activeWordId: null };
        }
        setHit(true);
        window.setTimeout(() => setHit(false), 300);

        if (newLives <= 0) {
          endGame();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [status, endGame]);

  const spawnParticle = useCallback((x: number, y: number) => {
    const id = particleIdRef.current++;
    setParticles((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 400);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { status } = liveRef.current;
      if (status !== "playing") {
        if (e.key.length === 1) start();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      e.preventDefault();

      const key = e.key.toLowerCase();
      const { words, activeWordId } = liveRef.current;

      let active = activeWordId !== null ? words.find((w) => w.id === activeWordId) : undefined;

      if (!active) {
        const candidates = words.filter((w) => w.typedLength === 0 && w.text[0] === key);
        if (candidates.length === 0) return;
        active = candidates.reduce((a, b) => (a.y > b.y ? a : b));
        setActiveWordId(active.id);
        liveRef.current = { ...liveRef.current, activeWordId: active.id };
      }

      if (active.text[active.typedLength] !== key) return;

      const newTypedLength = active.typedLength + 1;

      if (newTypedLength >= active.text.length) {
        const { x, y } = active;
        const wordLength = active.text.length;
        setWords((prev) => prev.filter((w) => w.id !== active!.id));
        setActiveWordId(null);
        spawnParticle(x, y);

        const nextCombo = liveRef.current.combo + 1;
        const points = wordLength * 10 + Math.floor(nextCombo / 5) * 10;
        setCombo(nextCombo);
        setBestCombo((prev) => Math.max(prev, nextCombo));
        setScore((prev) => prev + points);
        setWordsDestroyed((prev) => prev + 1);
        liveRef.current = {
          ...liveRef.current,
          combo: nextCombo,
          bestCombo: Math.max(liveRef.current.bestCombo, nextCombo),
          score: liveRef.current.score + points,
          wordsDestroyed: liveRef.current.wordsDestroyed + 1,
          activeWordId: null,
        };
      } else {
        setWords((prev) => prev.map((w) => (w.id === active!.id ? { ...w, typedLength: newTypedLength } : w)));
      }
    },
    [start, spawnParticle],
  );

  return {
    words,
    particles,
    activeWordId,
    status,
    score,
    combo,
    bestCombo,
    lives,
    level,
    wordsDestroyed,
    history,
    lastResult,
    hit,
    bestScore: arcadeBestScore(history),
    start,
    handleKeyDown,
  };
}

export type Finger =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "thumb"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky";

// Base (unshifted) key -> finger, standard QWERTY touch-typing chart.
const KEY_FINGER: Record<string, Finger> = {
  "`": "left-pinky",
  "1": "left-pinky",
  "2": "left-ring",
  "3": "left-middle",
  "4": "left-index",
  "5": "left-index",
  "6": "right-index",
  "7": "right-index",
  "8": "right-middle",
  "9": "right-ring",
  "0": "right-pinky",
  "-": "right-pinky",
  "=": "right-pinky",

  q: "left-pinky",
  w: "left-ring",
  e: "left-middle",
  r: "left-index",
  t: "left-index",
  y: "right-index",
  u: "right-index",
  i: "right-middle",
  o: "right-ring",
  p: "right-pinky",
  "[": "right-pinky",
  "]": "right-pinky",

  a: "left-pinky",
  s: "left-ring",
  d: "left-middle",
  f: "left-index",
  g: "left-index",
  h: "right-index",
  j: "right-index",
  k: "right-middle",
  l: "right-ring",
  ";": "right-pinky",
  "'": "right-pinky",

  z: "left-pinky",
  x: "left-ring",
  c: "left-middle",
  v: "left-index",
  b: "left-index",
  n: "right-index",
  m: "right-index",
  ",": "right-middle",
  ".": "right-ring",
  "/": "right-pinky",

  " ": "thumb",
};

// Shifted characters map to the same finger as their base key.
const SHIFTED_TO_BASE: Record<string, string> = {
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  _: "-",
  "+": "=",
  "{": "[",
  "}": "]",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
};

export function fingerForChar(ch: string): Finger | null {
  const lower = ch.toLowerCase();
  if (KEY_FINGER[lower]) return KEY_FINGER[lower];
  const base = SHIFTED_TO_BASE[ch];
  if (base && KEY_FINGER[base]) return KEY_FINGER[base];
  return null;
}

export const FINGER_LABELS: Record<Finger, string> = {
  "left-pinky": "left pinky",
  "left-ring": "left ring",
  "left-middle": "left middle",
  "left-index": "left index",
  thumb: "thumb",
  "right-index": "right index",
  "right-middle": "right middle",
  "right-ring": "right ring",
  "right-pinky": "right pinky",
};

// Tailwind classes per finger — kept visually distinct but muted enough to
// coexist with the amber accent used for the "active key" highlight.
export const FINGER_COLORS: Record<Finger, { bg: string; text: string }> = {
  "left-pinky": { bg: "bg-rose-500/25", text: "text-rose-300" },
  "left-ring": { bg: "bg-orange-500/25", text: "text-orange-300" },
  "left-middle": { bg: "bg-lime-500/25", text: "text-lime-300" },
  "left-index": { bg: "bg-teal-500/25", text: "text-teal-300" },
  thumb: { bg: "bg-zinc-500/25", text: "text-zinc-300" },
  "right-index": { bg: "bg-sky-500/25", text: "text-sky-300" },
  "right-middle": { bg: "bg-violet-500/25", text: "text-violet-300" },
  "right-ring": { bg: "bg-fuchsia-500/25", text: "text-fuchsia-300" },
  "right-pinky": { bg: "bg-pink-500/25", text: "text-pink-300" },
};

export const HOME_ROW_KEYS = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"];
export const HOME_BUMP_KEYS = ["f", "j"];

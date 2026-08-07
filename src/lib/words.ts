// Common English words, weighted toward short/frequent ones for natural typing rhythm.
export const COMMON_WORDS = [
  "the", "of", "and", "to", "in", "a", "is", "that", "it", "on", "for", "was",
  "with", "as", "his", "he", "be", "at", "by", "have", "are", "not", "this",
  "but", "had", "they", "you", "which", "or", "her", "from", "she", "we",
  "an", "were", "there", "their", "been", "would", "will", "all", "if",
  "can", "said", "each", "who", "when", "up", "out", "them", "then", "she",
  "many", "some", "so", "these", "would", "other", "into", "has", "more",
  "her", "two", "like", "him", "see", "time", "could", "no", "make", "than",
  "first", "been", "its", "now", "find", "long", "down", "day", "did",
  "get", "come", "made", "may", "part", "over", "new", "sound", "take",
  "only", "little", "work", "know", "place", "year", "live", "back", "give",
  "most", "very", "after", "thing", "our", "just", "name", "good", "sentence",
  "man", "think", "say", "great", "where", "help", "through", "much", "before",
  "line", "right", "too", "mean", "old", "any", "same", "tell", "boy",
  "follow", "came", "want", "show", "also", "around", "form", "three", "small",
  "set", "put", "end", "why", "again", "turn", "here", "off", "went", "old",
  "number", "way", "even", "because", "does", "ask", "went", "men", "read",
  "need", "land", "different", "home", "us", "move", "try", "kind", "hand",
  "picture", "again", "change", "off", "play", "spell", "air", "away",
  "animal", "house", "point", "page", "letter", "mother", "answer", "found",
  "study", "still", "learn", "should", "world", "high", "every", "near",
  "add", "food", "between", "own", "below", "country", "plant", "last",
  "school", "father", "keep", "tree", "never", "start", "city", "earth",
  "eye", "light", "thought", "head", "under", "story", "saw", "left",
  "don't", "few", "while", "along", "might", "close", "something", "seem",
  "next", "hard", "open", "example", "begin", "life", "always", "those",
  "both", "paper", "together", "got", "group", "often", "run", "important",
  "until", "children", "side", "feet", "car", "mile", "night", "walk",
  "white", "sea", "began", "grow", "took", "river", "four", "carry",
  "state", "once", "book", "hear", "stop", "without", "second", "later",
  "miss", "idea", "enough", "eat", "face", "watch", "far", "indian",
  "really", "almost", "let", "above", "girl", "sometimes", "mountain",
  "cut", "young", "talk", "soon", "list", "song", "leave", "family", "body",
];

export const PUNCTUATION_MARKS = [".", ",", "!", "?", ";", ":"];

export interface GenerateOptions {
  punctuation: boolean;
  numbers: boolean;
}

function randomWord(): string {
  return COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
}

function randomNumber(): string {
  const digits = 1 + Math.floor(Math.random() * 3);
  let n = "";
  for (let i = 0; i < digits; i++) n += Math.floor(Math.random() * 10);
  return n;
}

export function generateWords(count: number, options: GenerateOptions): string[] {
  const out: string[] = [];
  let capitalizeNext = true;

  for (let i = 0; i < count; i++) {
    let word: string;

    if (options.numbers && Math.random() < 0.13) {
      word = randomNumber();
    } else {
      word = randomWord();
    }

    if (capitalizeNext && /^[a-z]/.test(word)) {
      word = word[0].toUpperCase() + word.slice(1);
    }
    capitalizeNext = false;

    if (options.punctuation && Math.random() < 0.15 && !/^\d/.test(word)) {
      const mark = PUNCTUATION_MARKS[Math.floor(Math.random() * PUNCTUATION_MARKS.length)];
      word += mark;
      if (mark === "." || mark === "!" || mark === "?") {
        capitalizeNext = true;
      }
    }

    out.push(word);
  }

  return out;
}

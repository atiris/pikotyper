import { Rng } from '../engine/rng';
import { DIACRITICS, SHIFT_KEY } from '../learning/lessons';

const VOWELS = new Set([...'aeiouyáéíóúýäô']);
const DIGITS = new Set([...'0123456789']);
/** Pseudo-words must not contain these (sk + en). */
const BLOCK = ['sex', 'fuck', 'shit', 'piss', 'kurv', 'pič', 'kokot', 'jeb', 'hovn', 'debil', 'srat', 'prd', 'ass', 'dick', 'cock', 'fag', 'nazi', 'kill', 'dead', 'hitl', 'nig', 'cum', 'tit', 'pis', 'kret', 'idiot', 'hnus', 'smrt'];

const cache = new Map<string, Promise<string[]>>();

/** Loads the word list of a language (`public/words/<lang>.json`). */
export function loadWords(lang: string): Promise<string[]> {
  if (!cache.has(lang)) {
    const p = fetch(`${import.meta.env.BASE_URL}words/${lang}.json`)
      .then((r) => (r.ok ? r.json() : { words: [] }))
      .then((d: { words?: string[] }) => (d.words ?? []).map((w) => w.normalize('NFC').toLowerCase()))
      .catch(() => [] as string[]);
    cache.set(lang, p);
  }
  return cache.get(lang)!;
}

export function isBlocked(word: string): boolean {
  const w = word.toLowerCase();
  return BLOCK.some((b) => w.includes(b));
}

export interface WordOptions {
  keys: string[];
  len: [number, number];
  noDiacritics: boolean;
  /** Per key weight; weak keys get more. */
  weights?: Record<string, number>;
  /** Keys that should appear in most words (newly introduced keys). */
  focus?: string[];
  /** Characters the layout can type (capitals need it). */
  canType?: (ch: string) => boolean;
  seed?: number;
}

export function letterKeys(keys: string[], noDiacritics: boolean): string[] {
  return keys.filter((k) => k.length === 1 && !DIGITS.has(k) && k !== ' ' && !(noDiacritics && DIACRITICS.has(k)));
}

export function filterWords(words: string[], letters: Set<string>, len: [number, number]): string[] {
  return words.filter((w) => w.length >= len[0] && w.length <= len[1] && [...w].every((c) => letters.has(c)));
}

/** Endless supply of practice words for a key set. */
export class WordSource {
  readonly rng: Rng;
  private letters: string[];
  private pool: string[];
  private digits: string[];
  private capitals: boolean;
  private recent: string[] = [];

  constructor(words: string[], private opts: WordOptions) {
    this.rng = new Rng(opts.seed);
    this.letters = letterKeys(opts.keys, opts.noDiacritics);
    if (!this.letters.length) this.letters = ['f', 'j'];
    const set = new Set(this.letters);
    const len: [number, number] = [Math.max(1, opts.len[0]), Math.max(opts.len[0], opts.len[1])];
    this.pool = filterWords(words, set, len);
    this.digits = opts.keys.filter((k) => DIGITS.has(k));
    this.capitals = opts.keys.includes(SHIFT_KEY);
  }

  /** Next word; tries to start with a letter not in `avoidFirst` (letters of words already on screen). */
  next(avoidFirst: Set<string> = new Set(), maxLen = this.opts.len[1]): string {
    let word = '';
    for (let attempt = 0; attempt < 12; attempt++) {
      word = this.candidate(maxLen);
      if (!avoidFirst.has(word[0].toLowerCase()) && !this.recent.includes(word)) break;
    }
    this.recent.push(word);
    if (this.recent.length > 12) this.recent.shift();
    return word;
  }

  private candidate(maxLen: number): string {
    const r = this.rng;
    if (this.digits.length && r.chance(0.15)) {
      return Array.from({ length: r.int(1, Math.min(3, maxLen)) }, () => r.pick(this.digits)).join('');
    }
    let word: string;
    const focusList = (this.opts.focus ?? []).filter((k) => this.letters.includes(k));
    const focus = focusList.length ? r.pick(focusList) : null;
    if (this.letters.length <= 4) word = this.drill(maxLen, focus);
    else if (this.pool.length >= 8 && r.chance(this.pool.length >= 40 ? 0.9 : 0.6)) word = this.pickReal(maxLen, focus);
    else word = this.pseudo(maxLen, focus);
    if (this.capitals && r.chance(0.25)) {
      const cap = word[0].toUpperCase() + word.slice(1);
      if (cap[0] !== word[0] && (!this.opts.canType || this.opts.canType(cap[0]))) word = cap;
    }
    return word;
  }

  /** Weighted pick from a random sample of real words. */
  private pickReal(maxLen: number, focus: string | null): string {
    const fits = (w: string) => w.length <= maxLen;
    const sample: string[] = [];
    for (let i = 0; i < 16; i++) {
      const w = this.rng.pick(this.pool);
      if (fits(w)) sample.push(w);
    }
    if (!sample.length) return this.pseudo(maxLen, focus);
    const weights = sample.map((w) => {
      let s = 0;
      for (const c of w) s += this.opts.weights?.[c] ?? 1;
      let score = s / w.length;
      if (focus && w.includes(focus)) score *= 3;
      if (this.recent.includes(w)) score *= 0.05;
      return score * score;
    });
    return sample[this.rng.weighted(weights)];
  }

  /** Letter patterns for tiny key sets, e.g. `fff jjj fj jf`. */
  drill(maxLen: number, focus: string | null = null): string {
    const r = this.rng;
    const pickKey = () => this.weightedLetter(focus);
    const a = pickKey();
    const b = pickKey();
    // Short rhythmic patterns: aaa, ab, aba, aab, abab, aabb.
    const patterns = [a.repeat(3), a + b, a + b + a, a + a + b, a + b + a + b, a + a + b + b];
    const w = patterns[r.int(0, patterns.length - 1)];
    return w.slice(0, Math.max(1, maxLen));
  }

  /** Pronounceable pseudo-word from the allowed letters (consonant / vowel alternation). */
  pseudo(maxLen: number, focus: string | null): string {
    const r = this.rng;
    const vowels = this.letters.filter((c) => VOWELS.has(c));
    const consonants = this.letters.filter((c) => !VOWELS.has(c));
    if (!vowels.length || !consonants.length) return this.drill(Math.min(maxLen, 4), focus);
    const [min, max] = this.opts.len;
    for (let attempt = 0; attempt < 20; attempt++) {
      const len = r.int(Math.max(2, min), Math.max(2, Math.min(max, maxLen, 6)));
      let w = '';
      let vowel = r.chance(0.35);
      while (w.length < len) {
        const set = vowel ? vowels : consonants;
        w += focus && set.includes(focus) && r.chance(0.4) ? focus : this.weightedFrom(set);
        vowel = !vowel;
      }
      if (!isBlocked(w)) return w;
    }
    return this.drill(maxLen, focus);
  }

  private weightedLetter(focus: string | null): string {
    if (focus && this.rng.chance(0.5)) return focus;
    return this.weightedFrom(this.letters);
  }

  private weightedFrom(set: string[]): string {
    return set[this.rng.weighted(set.map((c) => this.opts.weights?.[c] ?? 1))];
  }
}

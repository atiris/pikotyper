import { Rng } from '../engine/rng';
import { type Layout, canType } from '../keyboard/layouts';
import { DIACRITICS, SHIFT_L, SHIFT_R, SPACE, isLetterKey, shiftKeyOf } from '../learning/lessons';

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
  /** Keys that should appear in most targets (newly introduced keys, punctuation and Shifts too). */
  focus?: string[];
  /** The keyboard; capitals need it (which Shift, can it be typed). */
  layout?: Layout;
  /** Children's names of the language, for capitals at the start of a target. */
  names?: string[];
  /** 0..1 how well each Shift goes; capitals grow from 1 target in 6 to every phrase start. */
  shiftMastery?: Record<string, number>;
  seed?: number;
}

export function letterKeys(keys: string[], noDiacritics: boolean): string[] {
  return keys.filter((k) => isLetterKey(k) && !(noDiacritics && DIACRITICS.has(k)));
}

export function filterWords(words: string[], letters: Set<string>, len: [number, number]): string[] {
  return words.filter((w) => w.length >= len[0] && w.length <= len[1] && [...w].every((c) => letters.has(c)));
}

/** Rates of punctuation in phrases: normal, and while the key is the one being learned. */
const MARK_RATE: Record<string, [number, number]> = {
  '.': [1 / 3, 0.6], ',': [1 / 5, 0.6], '?': [1 / 8, 0.5], '!': [1 / 10, 0.5], ':': [1 / 10, 0.5], '-': [1 / 10, 0.5],
};
/** Capitals while a Shift is new, and while it is the one being learned. */
const CAPITAL_START = 1 / 6;
const CAPITAL_FOCUS = 0.6;
/** Story targets that fly or fall stay short: words of at most 5 letters, 12 characters in all. */
const SHORT_WORD = 5;
const SHORT_TOTAL = 12;

/** Endless supply of practice targets for a key set: words, and phrases once space is known. */
export class WordSource {
  readonly rng: Rng;
  private letters: string[];
  private pool: string[];
  private digits: string[];
  private names: string[];
  private space: boolean;
  private keys: Set<string>;
  private focus: Set<string>;
  private recent: string[] = [];

  constructor(words: string[], private opts: WordOptions) {
    this.rng = new Rng(opts.seed);
    this.letters = letterKeys(opts.keys, opts.noDiacritics);
    if (!this.letters.length) this.letters = ['f', 'j'];
    this.keys = new Set(opts.keys);
    this.focus = new Set(opts.focus ?? []);
    const set = new Set(this.letters);
    const len: [number, number] = [Math.max(1, opts.len[0]), Math.max(opts.len[0], opts.len[1])];
    this.names = (opts.names ?? []).map((n) => n.normalize('NFC').toLowerCase()).filter((n) => [...n].every((c) => set.has(c)));
    if (this.keys.has("'")) set.add("'");
    this.pool = filterWords(words, set, len);
    this.digits = opts.keys.filter((k) => DIGITS.has(k));
    this.space = this.keys.has(SPACE);
  }

  /**
   * Next target of at most `words` words (more than one only once space is known), each at
   * most `maxLen` letters; tries to start with a letter not in `avoidFirst` (targets already on screen).
   */
  next(avoidFirst: Set<string> = new Set(), maxLen = this.opts.len[1], words = 1): string {
    let target = '';
    for (let attempt = 0; attempt < 12; attempt++) {
      target = this.candidate(maxLen, words);
      if (!avoidFirst.has(target[0].toLowerCase()) && !this.recent.includes(target)) break;
    }
    this.recent.push(target);
    if (this.recent.length > 12) this.recent.shift();
    return target;
  }

  private candidate(maxLen: number, words: number): string {
    const r = this.rng;
    if (this.digits.length && r.chance(0.15)) {
      return Array.from({ length: r.int(1, Math.min(3, maxLen)) }, () => r.pick(this.digits)).join('');
    }
    const focusList = [...this.focus].filter((k) => this.letters.includes(k));
    const focus = focusList.length ? r.pick(focusList) : null;
    const n = this.phraseLength(words);
    const short = words <= 2;
    const perWord = n === 1 ? maxLen : Math.min(maxLen, short ? SHORT_WORD : this.opts.len[1]);
    let list = Array.from({ length: n }, () => this.word(perWord, focus, n > 1));
    if (short && n > 1 && list.join(' ').length > SHORT_TOTAL) list = list.slice(0, 1);
    list[0] = this.capitalize(list[0], perWord, focus, n > 1);
    if (words <= 1) return list[0];
    return this.punctuate(list);
  }

  /** How many words: one before space is known; story targets one or two, calm modes two to four. */
  private phraseLength(words: number): number {
    const r = this.rng;
    if (!this.space || words <= 1) return 1;
    const inner = [',', ':', '-'].some((k) => this.keys.has(k) && this.focus.has(k));
    if (words === 2) return this.focus.has(SPACE) || inner || r.chance(0.6) ? 2 : 1;
    return r.int(2, Math.max(2, Math.min(words, this.keys.has(',') ? 4 : 3)));
  }

  private word(maxLen: number, focus: string | null, inPhrase: boolean): string {
    const r = this.rng;
    // Chunk pairs like `fj jf` for the first keys.
    if (this.letters.length <= 4) return this.drill(inPhrase ? Math.min(2, maxLen) : maxLen, focus);
    if (this.focus.has("'") && this.keys.has("'") && r.chance(0.5)) {
      const own = this.pool.filter((w) => w.includes("'") && w.length <= maxLen);
      if (own.length) return r.pick(own);
    }
    if (this.pool.length >= 8 && r.chance(this.pool.length >= 40 ? 0.9 : 0.6)) return this.pickReal(maxLen, focus);
    return this.pseudo(maxLen, focus);
  }

  /** The Shift a capital of `ch` needs, when that Shift is known and the capital can be typed. */
  private shiftFor(ch: string): string | null {
    const lay = this.opts.layout;
    if (!lay) return null;
    const cap = ch.toUpperCase();
    const shift = shiftKeyOf(lay, cap);
    return shift && this.keys.has(shift) && canType(lay, cap) ? shift : null;
  }

  /** A capital only at the start: a name, or the first word; more often as the Shift gets better. */
  private capitalize(first: string, maxLen: number, focus: string | null, inPhrase: boolean): string {
    const r = this.rng;
    const learning = [SHIFT_L, SHIFT_R].filter((k) => this.focus.has(k) && this.keys.has(k));
    const serves = (w: string) => learning.includes(this.shiftFor(w[0]) ?? '');
    let word = first;
    // While a Shift is learned, look for a start it serves.
    for (let i = 0; learning.length && i < 6 && !serves(word); i++) word = this.word(maxLen, focus, inPhrase);
    if (!serves(word)) word = first;
    const shift = this.shiftFor(word[0]);
    if (!shift) return first;
    let rate = learning.includes(shift) ? CAPITAL_FOCUS : CAPITAL_START + (1 - CAPITAL_START) * (this.opts.shiftMastery?.[shift] ?? 0);
    if (DIACRITICS.has(word[0])) rate /= 4;
    if (!r.chance(rate)) return first;
    const names = this.names.filter((n) => n.length <= maxLen + 2 && this.shiftFor(n[0]) === shift && !DIACRITICS.has(n[0]));
    if (names.length && r.chance(0.35)) word = r.pick(names);
    return word[0].toUpperCase() + word.slice(1);
  }

  /** Joins words with spaces; maybe a comma, colon or hyphen inside and a period, question or exclamation mark at the end. */
  private punctuate(list: string[]): string {
    const r = this.rng;
    const rate = (k: string) => (this.keys.has(k) ? MARK_RATE[k][this.focus.has(k) ? 1 : 0] : 0);
    const joins = list.map(() => ' ');
    if (list.length > 1) {
      if (r.chance(rate(','))) joins[0] = ', ';
      else if (r.chance(rate(':'))) joins[0] = ': ';
      else if (r.chance(rate('-'))) joins[0] = '-';
    }
    let text = list.map((w, i) => (i ? joins[i - 1] : '') + w).join('');
    const end = ['?', '!', '.'].find((k) => r.chance(rate(k)));
    if (end) text += end;
    return text;
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

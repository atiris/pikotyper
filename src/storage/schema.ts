// Storage schema v7. These types are the data contract of `localStorage['pikotyper:v1']`
// and of exported `.json` files. Older shapes are upgraded by the migrations in store.ts.

export type Lang = 'sk' | 'en';
export type LayoutId = 'sk-qwertz' | 'sk-qwerty' | 'us-qwerty';
export type CompanionKind = 'fox' | 'cat' | 'bunny' | 'owl' | 'dog' | 'bear' | 'panda' | 'penguin' | 'lion';
export type FontChoice = 'lexend' | 'atkinson' | 'opendyslexic';

export const COMPANION_KINDS: CompanionKind[] = ['fox', 'cat', 'bunny', 'owl', 'dog', 'bear', 'panda', 'penguin', 'lion'];

/** One day of practice of a key. */
export interface KeyDay {
  /** Local date `YYYY-MM-DD`. */
  date: string;
  presses: number;
  errors: number;
  /** Sum and count of reaction times (ms) of correct presses. */
  rtSum: number;
  rtCount: number;
}

export interface KeyStat {
  /** All presses and errors ever (shown as totals only). */
  presses: number;
  errors: number;
  /** Last presses, newest last: reaction ms for a correct press, 0 for an error. */
  recent: number[];
  /** What was typed instead of this key lately, newest last. */
  recentWrong: string[];
  /** Days with practice, oldest first. */
  days: KeyDay[];
}

export interface SessionRecord {
  /** Local date `YYYY-MM-DD`. */
  date: string;
  /** Active play seconds. */
  seconds: number;
  chars: number;
  errors: number;
  /** Smoothed rhythm, correct characters per minute. */
  cpm: number;
}

/** Share of targets taken from the parent's own words and text. */
export type OwnMix = 'off' | 'some' | 'half' | 'most';

export interface Settings {
  activeKeysMode: 'auto' | 'manual';
  manualKeys: string[];
  wordLen: [number, number];
  difficulty: number;
  /** The app raises difficulty and word length step by step as the child gets better. */
  autoDifficulty: boolean;
  autoWordLen: boolean;
  noDiacritics: boolean;
  noTimePressure: boolean;
  sessionMinutes: number;
  guide: 'auto' | 'on' | 'off';
  /** The parent locked the guide visibility; the child cannot toggle it. */
  guideLocked: boolean;
  sfxVolume: number;
  musicVolume: number;
  font: FontChoice;
  largeText: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  /** Ask for fullscreen on the first key press or click after the app starts. */
  autoFullscreen: boolean;
  /** The parent's own words and text, mixed into the targets by `ownMix`. */
  ownWords: string[];
  ownText: string;
  ownMix: OwnMix;
  /** Read the target to type and Piko's lines aloud. */
  readAloud: boolean;
}

export interface RescuedDragon {
  name: string;
  hue: number;
  date: string;
}

export interface Progress {
  unlockedKeys: string[];
  /** Keys whose "new key" introduction was shown. */
  introducedKeys: string[];
  /** Level id -> best stars (1-3). */
  levels: Record<string, number>;
  worldsDone: number[];
  /** Unlocked reward ids: accessories (`acc:<id>`) and story rewards. */
  rewards: string[];
  dragons: RescuedDragon[];
  /** Ids of the last preparation tips shown, newest last. */
  lastTips: string[];
  /** Story scenes already seen (they stay skippable). */
  scenesSeen: string[];
  /** Automatic steps up in difficulty or word length earned so far (each one is a medal). */
  growth: number;
  /** Seconds of good play collected toward the next automatic step. */
  growthSeconds: number;
  /** Paw helps charged by mistake-free streaks (Piko types a few words). */
  pawHelp: number;
  /** The child chose that Piko helps by himself in hard moments. */
  pawAuto: boolean;
  /** Companion kinds the child may pick: the starting kind first, then the ones earned by stars. */
  companionsUnlocked: CompanionKind[];
  /** Teaser questions asked so far; every second one is the parent's own question. */
  teasersAsked: number;
  /** Index of the next own question to ask. */
  ownQuestionNext: number;
  /** Own question asked whose answer comes after the next story level. */
  pendingQuestion: number | null;
}

/** A parent's own question for the teaser, with its answer. */
export interface OwnQuestion {
  q: string;
  a: string;
}

/**
 * A real reward a parent hid: Piko asks `q` before the level at `place` and tells `a`
 * after it, once the child reached `minStars`.
 */
export interface Surprise {
  id: string;
  q: string;
  a: string;
  /** A story level id, `next` (next story level or rescue mission) or `practice` (free practice of a minute). */
  place: string;
  minStars: number;
  /** Local date the answer was shown; never asked again after it. */
  revealedAt?: string;
}

export interface Companion {
  name: string;
  kind: CompanionKind;
  /** Equipped accessory ids. */
  accessories: string[];
}

export interface Profile {
  id: string;
  name: string;
  avatar: CompanionKind;
  companion: Companion;
  customMessages: string[];
  ownQuestions: OwnQuestion[];
  surprises: Surprise[];
  layout: LayoutId;
  language: Lang;
  settings: Settings;
  progress: Progress;
  stats: { keys: Record<string, KeyStat>; sessions: SessionRecord[] };
  createdAt: number;
}

export interface StoreData {
  version: 7;
  profiles: Profile[];
  lastProfileId: string | null;
  language: Lang | null;
}

export const GUEST_ID = 'guest';
/** The temporary super player (see app/super.ts); never stored. */
export const SUPER_ID = 'super';

export function defaultSettings(): Settings {
  return {
    activeKeysMode: 'auto',
    manualKeys: [],
    wordLen: [2, 6],
    difficulty: 3,
    autoDifficulty: true,
    autoWordLen: true,
    noDiacritics: false,
    noTimePressure: false,
    sessionMinutes: 15,
    guide: 'auto',
    guideLocked: false,
    sfxVolume: 0.7,
    musicVolume: 0.5,
    font: 'lexend',
    largeText: false,
    reduceMotion: false,
    highContrast: false,
    autoFullscreen: false,
    ownWords: [],
    ownText: '',
    ownMix: 'some',
    readAloud: false,
  };
}

export function emptyKeyStat(): KeyStat {
  return { presses: 0, errors: 0, recent: [], recentWrong: [], days: [] };
}

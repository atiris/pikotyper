// Storage schema v1. These types are the data contract of `localStorage['pikotyper:v1']`
// and of exported `.json` files.

export type Lang = 'sk' | 'en';
export type LayoutId = 'sk-qwertz' | 'us-qwerty';
export type CompanionKind = 'fox' | 'cat' | 'bunny' | 'owl' | 'dog' | 'bear' | 'panda' | 'penguin' | 'lion';
export type FontChoice = 'lexend' | 'atkinson' | 'opendyslexic';

export const COMPANION_KINDS: CompanionKind[] = ['fox', 'cat', 'bunny', 'owl', 'dog', 'bear', 'panda', 'penguin', 'lion'];

export interface KeyStat {
  presses: number;
  errors: number;
  /** Sum and count of reaction times (ms) of correct presses. */
  rtSum: number;
  rtCount: number;
  /** Last presses, newest last: reaction ms for a correct press, 0 for an error. */
  recent: number[];
  /** What was typed instead of this key, with counts. */
  wrong: Record<string, number>;
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

export interface Settings {
  activeKeysMode: 'auto' | 'manual';
  manualKeys: string[];
  wordLen: [number, number];
  difficulty: number;
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
  postureSeen: boolean;
  /** Story scenes already seen (they stay skippable). */
  scenesSeen: string[];
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
  layout: LayoutId;
  language: Lang;
  settings: Settings;
  progress: Progress;
  stats: { keys: Record<string, KeyStat>; sessions: SessionRecord[] };
  createdAt: number;
}

export interface StoreData {
  version: 1;
  profiles: Profile[];
  lastProfileId: string | null;
  language: Lang | null;
}

export const GUEST_ID = 'guest';

export function defaultSettings(): Settings {
  return {
    activeKeysMode: 'auto',
    manualKeys: [],
    wordLen: [2, 6],
    difficulty: 3,
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
  };
}

export function emptyKeyStat(): KeyStat {
  return { presses: 0, errors: 0, rtSum: 0, rtCount: 0, recent: [], wrong: {} };
}

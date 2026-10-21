import type { KeyStat, LayoutId, Profile } from '../storage/schema';

/** Pseudo-key that stands for capital letters typed with Shift. */
export const SHIFT_KEY = 'Shift';

const SK_ORDER = [
  'f', 'j', 'd', 'k', 's', 'l', 'a', 'ô', 'g', 'h', 'e', 'i', 'r', 'u', 'o', 't', 'n', 'c', 'v', 'm', 'p',
  'b', 'z', 'y', 'w', 'x', 'q',
  'á', 'í', 'é', 'ý', 'ž', 'ť', 'č', 'š', 'ľ', 'ú', 'ä', 'ň', 'ó', 'ĺ', 'ŕ', 'ď',
  SHIFT_KEY,
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
];

const US_ORDER = [
  'f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'g', 'h', 'e', 'i', 'r', 'u', 'o', 't', 'n', 'c', 'v', 'm', 'p',
  'b', 'y', 'w', 'x', 'q', 'z',
  SHIFT_KEY,
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
];

export const DIACRITICS = new Set([...'áäčďéíĺľňóôŕšťúýž']);

export function lessonOrder(layout: LayoutId): string[] {
  return layout === 'sk-qwertz' ? SK_ORDER : US_ORDER;
}

export function firstKeys(layout: LayoutId): string[] {
  return lessonOrder(layout).slice(0, 2);
}

/** Recent presses window used by the mastery rule. */
export const MASTERY_WINDOW = 40;

/** Median reaction limit: 1600 ms at difficulty 1 down to 800 ms at 10. */
export function reactionLimit(difficulty: number): number {
  const d = Math.min(10, Math.max(1, difficulty));
  return 1600 - ((d - 1) * 800) / 9;
}

export function median(values: number[]): number {
  if (!values.length) return Infinity;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function recentAccuracy(stat: KeyStat | undefined): number {
  if (!stat || !stat.recent.length) return 0;
  return stat.recent.filter((v) => v > 0).length / stat.recent.length;
}

export function isMastered(stat: KeyStat | undefined, difficulty: number): boolean {
  if (!stat || stat.recent.length < MASTERY_WINDOW) return false;
  const window = stat.recent.slice(-MASTERY_WINDOW);
  const ok = window.filter((v) => v > 0);
  return ok.length / window.length >= 0.92 && median(ok) <= reactionLimit(difficulty);
}

/** 0 (new) .. 1 (mastered) used to fade the finger guide. */
export function masteryLevel(stat: KeyStat | undefined, difficulty: number): number {
  if (!stat || !stat.recent.length) return 0;
  if (isMastered(stat, difficulty)) return 1;
  const fill = Math.min(1, stat.recent.length / MASTERY_WINDOW);
  return Math.min(0.9, fill * recentAccuracy(stat));
}

/** The stat entry that measures a key: Shift is measured on capital letters. */
export function statFor(profile: Profile, key: string): KeyStat | undefined {
  return profile.stats.keys[key];
}

/**
 * Unlocks the next key when the newest unlocked key is mastered.
 * Returns the newly unlocked key or null.
 */
export function advanceLesson(profile: Profile): string | null {
  const order = lessonOrder(profile.layout);
  const unlocked = profile.progress.unlockedKeys;
  const newest = [...order].reverse().find((key) => unlocked.includes(key));
  if (newest && !isMastered(statFor(profile, newest), profile.settings.difficulty)) return null;
  const next = order.find((key) => !unlocked.includes(key) && !(profile.settings.noDiacritics && DIACRITICS.has(key)));
  if (!next) return null;
  unlocked.push(next);
  return next;
}

/** Keys used for words right now: the parent's pick or the unlocked lesson keys. */
export function activeKeys(profile: Profile): string[] {
  if (profile.settings.activeKeysMode === 'manual' && profile.settings.manualKeys.length) return profile.settings.manualKeys;
  return profile.progress.unlockedKeys;
}

/** Unlocked keys that were not introduced yet, in lesson order (each is shown alone first). */
export function keysToIntroduce(profile: Profile): string[] {
  if (profile.settings.activeKeysMode === 'manual') return [];
  return profile.progress.unlockedKeys.filter((k) => !profile.progress.introducedKeys.includes(k));
}

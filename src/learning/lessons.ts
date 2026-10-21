import type { KeyStat, LayoutId, Profile } from '../storage/schema';

/** Pseudo-key that stands for capital letters typed with Shift. */
export const SHIFT_KEY = 'Shift';

/**
 * Lesson groups: keys that unlock together. The home row and the first reaches
 * come in mirrored pairs (same finger, other hand), the rest one by one.
 */
const SK_GROUPS = [
  ['f', 'j'], ['d', 'k'], ['s', 'l'], ['a', 'ô'], ['g', 'h'], ['e', 'i'], ['r', 'u'], ['o'], ['t'], ['n'], ['c'], ['v'], ['m'], ['p'],
  ['b'], ['z'], ['y'], ['w'], ['x'], ['q'],
  ['á'], ['í'], ['é'], ['ý'], ['ž'], ['ť'], ['č'], ['š'], ['ľ'], ['ú'], ['ä'], ['ň'], ['ó'], ['ĺ'], ['ŕ'], ['ď'],
  [SHIFT_KEY],
  ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'],
];

const US_GROUPS = [
  ['f', 'j'], ['d', 'k'], ['s', 'l'], ['a', ';'], ['g', 'h'], ['e', 'i'], ['r', 'u'], ['o'], ['t'], ['n'], ['c'], ['v'], ['m'], ['p'],
  ['b'], ['y'], ['w'], ['x'], ['q'], ['z'],
  [SHIFT_KEY],
  ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'],
];

export const DIACRITICS = new Set([...'áäčďéíĺľňóôŕšťúýž']);

export function lessonGroups(layout: LayoutId): string[][] {
  return layout === 'sk-qwertz' ? SK_GROUPS : US_GROUPS;
}

export function lessonOrder(layout: LayoutId): string[] {
  return lessonGroups(layout).flat();
}

export function firstKeys(layout: LayoutId): string[] {
  return [...lessonGroups(layout)[0]];
}

/** Recent presses window used by the mastery rule. */
export const MASTERY_WINDOW = 40;
/** A key is ready for the next one after fewer presses than full mastery. */
export const READY_WINDOW = 25;

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

/** Accurate and steady enough to move on: the last 25 presses, 90 % right, calm rhythm. */
export function isReady(stat: KeyStat | undefined, difficulty: number): boolean {
  if (!stat || stat.recent.length < READY_WINDOW) return false;
  const window = stat.recent.slice(-READY_WINDOW);
  const ok = window.filter((v) => v > 0);
  return ok.length / window.length >= 0.9 && median(ok) <= reactionLimit(difficulty);
}

/**
 * Unlocks the next lesson group when every key of the newest unlocked group is
 * ready. Returns the newly unlocked keys (empty when nothing changed).
 */
export function advanceLesson(profile: Profile): string[] {
  const groups = lessonGroups(profile.layout);
  const unlocked = profile.progress.unlockedKeys;
  const newest = [...groups].reverse().find((g) => g.some((k) => unlocked.includes(k)));
  if (newest && !newest.every((k) => isReady(statFor(profile, k), profile.settings.difficulty))) return [];
  const skip = (k: string) => profile.settings.noDiacritics && DIACRITICS.has(k);
  const next = groups.find((g) => g.some((k) => !unlocked.includes(k) && !skip(k)));
  if (!next) return [];
  const fresh = next.filter((k) => !unlocked.includes(k) && !skip(k));
  unlocked.push(...fresh);
  return fresh;
}

/** The most recently unlocked lesson group (the keys being learned now). */
export function newestGroup(profile: Profile): string[] {
  if (profile.settings.activeKeysMode === 'manual') return [];
  const unlocked = profile.progress.unlockedKeys;
  const group = [...lessonGroups(profile.layout)].reverse().find((g) => g.some((k) => unlocked.includes(k)));
  return group ? group.filter((k) => unlocked.includes(k)) : [];
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

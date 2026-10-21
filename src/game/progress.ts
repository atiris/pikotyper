import { advanceLesson } from '../learning/lessons';
import type { Profile } from '../storage/schema';
import { type LevelDef, starsFor } from './levels';
import { grantAccessories } from './rewards';

export interface LevelResult {
  stars: number;
  accuracy: number;
  chars: number;
  errors: number;
  cpm: number;
  seconds: number;
  newKeys: string[];
  newAccessories: string[];
  /** The world finished with this level (super-obstacle), else null. */
  worldDone: number | null;
  /** Rhythm compared with the sessions of a week ago, as a ratio (null = no data). */
  trend: number | null;
  /** An automatic step up earned with this level (a new medal), else null. */
  growth: GrowthStep | null;
  /** The child typed too few keys; Piko's paws did most of the level. */
  byPiko: boolean;
}

export interface GrowthStep {
  kind: 'difficulty' | 'wordLen';
  /** New difficulty, or the new longest word. */
  value: number;
  /** Medal number (1 = first step). */
  medal: number;
}

/** Automatic steps stop here; higher values stay a parent's choice. */
export const AUTO_DIFFICULTY_MAX = 8;
export const AUTO_WORD_MAX = 9;
/** Accuracy a level needs for its time to count toward the next step. */
const GROWTH_ACCURACY = 0.9;
/** Fewer keys of the child's own in a story level: Piko did most of it. */
export const MIN_OWN_KEYS = 5;

/** Seconds of good play for the next step: 4 minutes, then one more for each step. */
export function growthNeed(step: number): number {
  return 240 + step * 60;
}

/**
 * Automatic difficulty and word length: good play time collects, and when there
 * is enough, one setting goes up by one step (they take turns).
 */
export function grow(p: Profile, seconds: number, accuracy: number): GrowthStep | null {
  const s = p.settings;
  const options: GrowthStep['kind'][] = [];
  if (s.autoDifficulty && s.difficulty < AUTO_DIFFICULTY_MAX) options.push('difficulty');
  if (s.autoWordLen && s.wordLen[1] < AUTO_WORD_MAX) options.push('wordLen');
  if (!options.length || accuracy < GROWTH_ACCURACY) return null;
  p.progress.growthSeconds += Math.round(seconds);
  if (p.progress.growthSeconds < growthNeed(p.progress.growth)) return null;
  const kind = options[p.progress.growth % options.length];
  p.progress.growthSeconds = 0;
  p.progress.growth++;
  let value: number;
  if (kind === 'difficulty') value = ++s.difficulty;
  else {
    value = s.wordLen[1] + 1;
    // The shortest words grow slowly too, so long words really appear.
    s.wordLen = [Math.max(s.wordLen[0], Math.min(4, value - 4)), value];
  }
  return { kind, value, medal: p.progress.growth };
}

/** Applies a finished level to the profile. Unlocks keys, worlds and accessories. */
export function completeLevel(p: Profile, def: LevelDef, r: Omit<LevelResult, 'stars' | 'newKeys' | 'newAccessories' | 'worldDone' | 'trend' | 'growth' | 'byPiko'>): LevelResult {
  // Accuracy of a handful of keys says nothing; such a level earns one star and no growth time.
  const byPiko = def.kind !== 'practice' && r.chars + r.errors < MIN_OWN_KEYS;
  const stars = byPiko ? 1 : starsFor(r.accuracy);
  let worldDone: number | null = null;
  if (def.index >= 0 && def.kind !== 'practice') {
    p.progress.levels[def.id] = Math.max(p.progress.levels[def.id] ?? 0, stars);
    if (def.isSuper && !p.progress.worldsDone.includes(def.world)) {
      p.progress.worldsDone.push(def.world);
      worldDone = def.world;
    }
  }
  const newKeys = advanceLesson(p);
  const newAccessories = grantAccessories(p);
  const growth = byPiko ? null : grow(p, r.seconds, r.accuracy);
  return { ...r, stars, newKeys, newAccessories, worldDone, trend: rhythmTrend(p), growth, byPiko };
}

/** Current rhythm vs. a week ago (only positive framing is shown). */
export function rhythmTrend(p: Profile): number | null {
  const s = p.stats.sessions;
  if (s.length < 2) return null;
  const now = s[s.length - 1];
  const weekAgo = new Date(now.date);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const old = s.filter((x) => new Date(x.date) <= weekAgo && x.cpm > 0);
  const ref = old.length ? old[old.length - 1] : s[0] !== now && s[0].cpm > 0 ? s[0] : null;
  if (!ref || !now.cpm) return null;
  return now.cpm / ref.cpm;
}


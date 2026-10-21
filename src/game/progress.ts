import { advanceLesson } from '../learning/lessons';
import type { Profile } from '../storage/schema';
import { type LevelDef, WORLDS, starsFor } from './levels';
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
  firstTime: boolean;
  /** Rhythm compared with the sessions of a week ago, as a ratio (null = no data). */
  trend: number | null;
}

/** Applies a finished level to the profile. Unlocks keys, worlds and accessories. */
export function completeLevel(p: Profile, def: LevelDef, r: Omit<LevelResult, 'stars' | 'newKeys' | 'newAccessories' | 'worldDone' | 'firstTime' | 'trend'>): LevelResult {
  const stars = starsFor(r.accuracy);
  let firstTime = false;
  let worldDone: number | null = null;
  if (def.index >= 0 && def.kind !== 'practice') {
    firstTime = !p.progress.levels[def.id];
    p.progress.levels[def.id] = Math.max(p.progress.levels[def.id] ?? 0, stars);
    if (def.isSuper && !p.progress.worldsDone.includes(def.world)) {
      p.progress.worldsDone.push(def.world);
      worldDone = def.world;
    }
  }
  const newKeys: string[] = [];
  for (let i = 0; i < 2; i++) {
    const k = advanceLesson(p);
    if (!k) break;
    newKeys.push(k);
  }
  const newAccessories = grantAccessories(p);
  return { ...r, stars, newKeys, newAccessories, worldDone, firstTime, trend: rhythmTrend(p) };
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

export const worldName = (w: number) => WORLDS[w];

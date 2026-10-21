import type { Profile } from '../storage/schema';

export type WorldId = 'meadow' | 'space' | 'planet' | 'dragons' | 'egg';
export const WORLDS: WorldId[] = ['meadow', 'space', 'planet', 'dragons', 'egg'];

export type LevelKind =
  | 'meadow' | 'web'
  | 'space' | 'asteroid'
  | 'swamp' | 'signs' | 'boulder'
  | 'shield' | 'wave'
  | 'slope' | 'mole'
  | 'practice';

export interface LevelDef {
  id: string;
  /** 0-4, index into WORLDS. */
  world: number;
  /** 0-4 inside the world; 4 is the super-obstacle. */
  index: number;
  kind: LevelKind;
  /** Number of words (targets) in the level. */
  count: number;
  /** Creature / object mix. */
  variant: string;
  isSuper: boolean;
}

const def = (world: number, index: number, kind: LevelKind, count: number, variant = ''): LevelDef =>
  ({ id: `w${world + 1}-${index + 1}`, world, index, kind, count, variant, isSuper: index === 4 });

export const LEVELS: LevelDef[] = [
  def(0, 0, 'meadow', 12, 'flyers'), def(0, 1, 'meadow', 14, 'bugs'), def(0, 2, 'meadow', 14, 'runners'), def(0, 3, 'meadow', 16, 'mix'), def(0, 4, 'web', 6),
  def(1, 0, 'space', 12, 'asteroids'), def(1, 1, 'space', 14, 'planets'), def(1, 2, 'space', 16, 'mix'), def(1, 3, 'space', 18, 'mix'), def(1, 4, 'asteroid', 4),
  def(2, 0, 'swamp', 12), def(2, 1, 'signs', 10), def(2, 2, 'swamp', 14), def(2, 3, 'signs', 12), def(2, 4, 'boulder', 6),
  def(3, 0, 'shield', 12, '1'), def(3, 1, 'shield', 14, '2'), def(3, 2, 'shield', 16, '3'), def(3, 3, 'shield', 18, '3'), def(3, 4, 'wave', 14),
  def(4, 0, 'slope', 12, 'rocks'), def(4, 1, 'slope', 14, 'stumps'), def(4, 2, 'slope', 16, 'mix'), def(4, 3, 'slope', 18, 'mix'), def(4, 4, 'mole', 14),
];

export function levelById(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function worldLevels(world: number): LevelDef[] {
  return LEVELS.filter((l) => l.world === world);
}

export function isWorldUnlocked(p: Profile, world: number): boolean {
  return world === 0 || p.progress.worldsDone.includes(world - 1);
}

export function isLevelUnlocked(p: Profile, l: LevelDef): boolean {
  if (!isWorldUnlocked(p, l.world)) return false;
  if (l.index === 0) return true;
  const prev = worldLevels(l.world)[l.index - 1];
  return (p.progress.levels[prev.id] ?? 0) > 0;
}

/** The next level to play: the first unlocked level without stars, else the last unlocked one. */
export function nextLevel(p: Profile): LevelDef {
  const open = LEVELS.filter((l) => isLevelUnlocked(p, l));
  return open.find((l) => !p.progress.levels[l.id]) ?? open[open.length - 1];
}

export function rescueUnlocked(p: Profile): boolean {
  return p.progress.worldsDone.includes(4);
}

/** Stars from accuracy: 3 >= 95 %, 2 >= 85 %, else 1 (finishing always gives one). */
export function starsFor(accuracy: number): number {
  return accuracy >= 0.95 ? 3 : accuracy >= 0.85 ? 2 : 1;
}

const RESCUE_KINDS: { kind: LevelKind; world: number; variant: string }[] = [
  { kind: 'meadow', world: 0, variant: 'mix' }, { kind: 'space', world: 1, variant: 'mix' }, { kind: 'swamp', world: 2, variant: '' },
  { kind: 'signs', world: 2, variant: '' }, { kind: 'shield', world: 3, variant: '3' }, { kind: 'slope', world: 4, variant: 'mix' },
];

/** Endless rescue missions: a level kind from any world. */
export function rescueLevel(seed: number): LevelDef {
  const r = RESCUE_KINDS[Math.abs(seed) % RESCUE_KINDS.length];
  return { id: 'rescue', world: r.world, index: -1, kind: r.kind, count: 14, variant: r.variant, isSuper: false };
}

export function practiceLevel(seconds: number | null): LevelDef & { seconds: number | null } {
  return { id: 'practice', world: 0, index: -1, kind: 'practice', count: 0, variant: '', isSuper: false, seconds };
}

import { type Profile, SUPER_ID } from '../storage/schema';

export type WorldId = 'meadow' | 'space' | 'planet' | 'dragons' | 'egg' | 'junkyard' | 'workshop' | 'raintown' | 'robocity' | 'robohome';
export const WORLDS: WorldId[] = ['meadow', 'space', 'planet', 'dragons', 'egg', 'junkyard', 'workshop', 'raintown', 'robocity', 'robohome'];

export interface StoryDef {
  id: 'dragon' | 'robot';
  /** i18n key of the story title. */
  title: string;
  /** World indexes of the story, in order. */
  worlds: number[];
  /** The story opens when this world (of another story) is done; null = open from the start. */
  opensAfter: number | null;
}

/** Story rows on the map; each story goes on independently once it is open. */
export const STORIES: StoryDef[] = [
  { id: 'dragon', title: 'map.storyName', worlds: [0, 1, 2, 3, 4], opensAfter: null },
  { id: 'robot', title: 'map.storyRobot', worlds: [5, 6, 7, 8, 9], opensAfter: 1 },
];

export function storyOf(world: number): StoryDef {
  return STORIES.find((s) => s.worlds.includes(world)) ?? STORIES[0];
}

/** Every world of the story is done. */
export function storyDone(p: Profile, story: StoryDef): boolean {
  return story.worlds.every((w) => p.progress.worldsDone.includes(w));
}

export type LevelKind =
  | 'meadow' | 'hedgehog'
  | 'space' | 'asteroid'
  | 'swamp' | 'signs' | 'boulder'
  | 'shield' | 'wave'
  | 'slope' | 'mole'
  | 'junk' | 'knot'
  | 'belt' | 'battery'
  | 'rain' | 'storm'
  | 'doors' | 'gate'
  | 'rooms' | 'welcome'
  | 'practice';

export interface LevelDef {
  id: string;
  /** Index into WORLDS. */
  world: number;
  /** 0-4 inside the world; 4 is the super-obstacle. */
  index: number;
  kind: LevelKind;
  /** Number of words (targets) in the level. */
  count: number;
  /** Creature / object mix. */
  variant: string;
  isSuper: boolean;
  /** Free practice of the parent's own text: these targets in order, then the end. */
  phrases?: string[];
}

const def = (world: number, index: number, kind: LevelKind, count: number, variant = ''): LevelDef =>
  ({ id: `w${world + 1}-${index + 1}`, world, index, kind, count, variant, isSuper: index === 4 });

export const LEVELS: LevelDef[] = [
  def(0, 0, 'meadow', 12, 'flyers'), def(0, 1, 'meadow', 14, 'bugs'), def(0, 2, 'meadow', 14, 'runners'), def(0, 3, 'meadow', 16, 'mix'), def(0, 4, 'hedgehog', 6),
  def(1, 0, 'space', 12, 'asteroids'), def(1, 1, 'space', 14, 'planets'), def(1, 2, 'space', 16, 'mix'), def(1, 3, 'space', 18, 'mix'), def(1, 4, 'asteroid', 4),
  def(2, 0, 'swamp', 12), def(2, 1, 'signs', 10), def(2, 2, 'swamp', 14), def(2, 3, 'signs', 12), def(2, 4, 'boulder', 6),
  def(3, 0, 'shield', 12, '1'), def(3, 1, 'shield', 14, '2'), def(3, 2, 'shield', 16, '3'), def(3, 3, 'shield', 18, '3'), def(3, 4, 'wave', 14),
  def(4, 0, 'slope', 12, 'rocks'), def(4, 1, 'slope', 14, 'stumps'), def(4, 2, 'slope', 16, 'mix'), def(4, 3, 'slope', 18, 'mix'), def(4, 4, 'mole', 14),
  def(5, 0, 'junk', 12, 'tires'), def(5, 1, 'junk', 14, 'crates'), def(5, 2, 'junk', 14, 'mix'), def(5, 3, 'junk', 16, 'mix'), def(5, 4, 'knot', 6),
  def(6, 0, 'belt', 12, 'gears'), def(6, 1, 'belt', 14, 'bolts'), def(6, 2, 'belt', 16, 'mix'), def(6, 3, 'belt', 18, 'mix'), def(6, 4, 'battery', 12),
  def(7, 0, 'rain', 12), def(7, 1, 'rain', 14), def(7, 2, 'rain', 16), def(7, 3, 'rain', 18), def(7, 4, 'storm', 14),
  def(8, 0, 'doors', 10, '1'), def(8, 1, 'doors', 12, '2'), def(8, 2, 'doors', 14, '2'), def(8, 3, 'doors', 16, '3'), def(8, 4, 'gate', 8),
  def(9, 0, 'rooms', 10), def(9, 1, 'rooms', 12), def(9, 2, 'rooms', 14), def(9, 3, 'rooms', 16), def(9, 4, 'welcome', 14),
];

export function levelById(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function worldLevels(world: number): LevelDef[] {
  return LEVELS.filter((l) => l.world === world);
}

/** The first world of a story opens with the story, every other one after the world before it. */
export function isWorldUnlocked(p: Profile, world: number): boolean {
  const story = storyOf(world);
  if (world !== story.worlds[0]) return p.progress.worldsDone.includes(world - 1);
  return story.opensAfter === null || p.progress.worldsDone.includes(story.opensAfter);
}

export function isLevelUnlocked(p: Profile, l: LevelDef): boolean {
  if (p.id === SUPER_ID) return true;
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

/** Rescue missions (and the little friends) open with the first finished story. */
export function rescueUnlocked(p: Profile): boolean {
  return STORIES.some((s) => storyDone(p, s));
}

/** Stars from accuracy: 3 >= 95 %, 2 >= 85 %, else 1 (finishing always gives one). */
export function starsFor(accuracy: number): number {
  return accuracy >= 0.95 ? 3 : accuracy >= 0.85 ? 2 : 1;
}

const RESCUE_KINDS: { kind: LevelKind; world: number; variant: string }[] = [
  { kind: 'meadow', world: 0, variant: 'mix' }, { kind: 'space', world: 1, variant: 'mix' }, { kind: 'swamp', world: 2, variant: '' },
  { kind: 'signs', world: 2, variant: '' }, { kind: 'shield', world: 3, variant: '3' }, { kind: 'slope', world: 4, variant: 'mix' },
  { kind: 'junk', world: 5, variant: 'mix' }, { kind: 'belt', world: 6, variant: 'mix' }, { kind: 'rain', world: 7, variant: '' },
  { kind: 'doors', world: 8, variant: '2' }, { kind: 'rooms', world: 9, variant: '' },
];

/** Endless rescue missions: a level kind from any world of a finished story; the friend helped follows the story. */
export function rescueLevel(p: Profile, seed: number): LevelDef {
  const open = RESCUE_KINDS.filter((r) => storyDone(p, storyOf(r.world)));
  const pool = open.length ? open : RESCUE_KINDS.filter((r) => STORIES[0].worlds.includes(r.world));
  const r = pool[Math.abs(seed) % pool.length];
  return { id: 'rescue', world: r.world, index: -1, kind: r.kind, count: 14, variant: r.variant, isSuper: false };
}

export function practiceLevel(seconds: number | null, phrases?: string[]): LevelDef & { seconds: number | null } {
  return { id: 'practice', world: 0, index: -1, kind: 'practice', count: 0, variant: '', isSuper: false, seconds, phrases };
}

import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { SUPER_ID } from '../storage/schema';
import { lessonOrder } from '../learning/lessons';
import { LEVELS, STORIES, isLevelUnlocked, isWorldUnlocked, keysNeeded, levelById, nextLevel, rescueLevel, rescueUnlocked, worldLevels, worldLock } from './levels';

const KEYS = ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'g', 'h', 'r', 'u', 'e', 'i', 't', 'y', 'w', 'o', 'q', 'p', 'v', 'm', 'c', ',', 'x', '.'];

describe('story unlocks', () => {
  it('opens the robot story when the child knows ten keys', () => {
    const p = newProfile('Ema', 'sk');
    expect(isWorldUnlocked(p, 0)).toBe(true);
    expect(isWorldUnlocked(p, 5)).toBe(false);
    p.progress.unlockedKeys = KEYS.slice(0, 9);
    p.progress.worldsDone = [0, 1];
    expect(isWorldUnlocked(p, 5)).toBe(false);
    p.progress.unlockedKeys = KEYS.slice(0, 10);
    p.progress.worldsDone = [];
    expect(isWorldUnlocked(p, 5)).toBe(true);
    expect(isWorldUnlocked(p, 6)).toBe(false);
  });

  it('opens the fairy story at twenty keys', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.unlockedKeys = lessonOrder(p.layout).slice(0, 19);
    expect(isWorldUnlocked(p, 10)).toBe(false);
    p.progress.unlockedKeys = lessonOrder(p.layout).slice(0, 20);
    expect(isWorldUnlocked(p, 10)).toBe(true);
    expect(isWorldUnlocked(p, 11)).toBe(false);
  });

  it('lets both stories go on independently', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.unlockedKeys = KEYS.slice(0, 10);
    p.progress.worldsDone = [0, 1, 5, 6];
    expect(isWorldUnlocked(p, 2)).toBe(true);
    expect(isWorldUnlocked(p, 3)).toBe(false);
    expect(isWorldUnlocked(p, 7)).toBe(true);
    expect(isWorldUnlocked(p, 8)).toBe(false);
  });

  it('plays the dragon story first, then the robot story', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.unlockedKeys = KEYS;
    p.progress.worldsDone = [0, 1];
    for (const l of LEVELS.filter((x) => x.world < 2)) p.progress.levels[l.id] = 3;
    expect(nextLevel(p)?.id).toBe('w3-1');
    for (const l of LEVELS.filter((x) => x.world < 5)) p.progress.levels[l.id] = 3;
    p.progress.worldsDone = [0, 1, 2, 3, 4];
    expect(nextLevel(p)?.id).toBe('w6-1');
  });

  it('has five levels with a super-obstacle in every world', () => {
    for (const s of STORIES) for (const w of s.worlds) {
      expect(levelById(`w${w + 1}-5`)?.isSuper).toBe(true);
      expect(LEVELS.filter((l) => l.world === w)).toHaveLength(5);
    }
  });
});

describe('keys needed per level', () => {
  /** A profile with every level of world 2 reached (world 1 done, earlier levels with stars) and `n` keys. */
  const withKeys = (n: number) => {
    const p = newProfile('Ema', 'sk');
    p.progress.worldsDone = [0];
    for (const l of LEVELS.filter((x) => x.world <= 1)) p.progress.levels[l.id] = 2;
    p.progress.unlockedKeys = KEYS.slice(0, n);
    return p;
  };
  const open = (p: ReturnType<typeof withKeys>) => worldLevels(1).map((l) => isLevelUnlocked(p, l));

  it('opens the first three levels of a world with six keys', () => {
    expect(open(withKeys(6))).toEqual([true, true, true, false, false]);
  });

  it('opens every level with ten keys', () => {
    expect(open(withKeys(10))).toEqual([true, true, true, true, true]);
  });

  it("counts the parent's manual keys", () => {
    const p = withKeys(2);
    p.settings.activeKeysMode = 'manual';
    p.settings.manualKeys = KEYS.slice(0, 8);
    expect(open(p)).toEqual([true, true, true, true, false]);
  });

  it('needs 10 / 14 / 18 / 22 / 26 keys in the robot story', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.worldsDone = [5];
    for (const l of LEVELS.filter((x) => x.world === 6)) p.progress.levels[l.id] = 2;
    const robot = () => worldLevels(6).map((l) => isLevelUnlocked(p, l));
    p.progress.unlockedKeys = KEYS.slice(0, 10);
    expect(robot()).toEqual([true, false, false, false, false]);
    p.progress.unlockedKeys = KEYS.slice(0, 18);
    expect(robot()).toEqual([true, true, true, false, false]);
    p.progress.unlockedKeys = KEYS.slice(0, 26);
    expect(robot()).toEqual([true, true, true, true, true]);
  });

  it('needs 20 / 25 / 30 / 35 / 40 keys in the fairy story, never more than the whole lesson path', () => {
    const p = newProfile('Ema', 'sk');
    expect(worldLevels(12).map((l) => keysNeeded(p, l))).toEqual([20, 25, 30, 35, 40]);
    p.layout = 'us-qwerty';
    const path = lessonOrder('us-qwerty').length;
    expect(Math.max(...LEVELS.map((l) => keysNeeded(p, l)))).toBeLessThanOrEqual(path);
    p.progress.worldsDone = [10];
    for (const l of worldLevels(11)) p.progress.levels[l.id] = 2;
    p.progress.unlockedKeys = lessonOrder('us-qwerty');
    expect(worldLevels(11).every((l) => isLevelUnlocked(p, l))).toBe(true);
  });

  it('does not gate the super profile', () => {
    const p = withKeys(2);
    p.id = SUPER_ID;
    expect(open(p)).toEqual([true, true, true, true, true]);
  });

  it('skips key-locked levels for the next level, and offers none when nothing is open', () => {
    const p = withKeys(4);
    expect(nextLevel(p)?.id).toBe('w2-2');
    p.progress.levels['w2-2'] = 3;
    expect(nextLevel(p)?.id).toBe('w2-2');
    p.progress.unlockedKeys = ['f'];
    expect(nextLevel(p)).toBeNull();
  });
});

describe('rescue missions', () => {
  it('open with either finished story and come from finished stories only', () => {
    const p = newProfile('Ema', 'sk');
    expect(rescueUnlocked(p)).toBe(false);
    p.progress.worldsDone = [0, 1, 5, 6, 7, 8, 9];
    expect(rescueUnlocked(p)).toBe(true);
    for (let seed = 0; seed < 20; seed++) expect(rescueLevel(p, seed).world).toBeGreaterThanOrEqual(5);
    p.progress.worldsDone.push(2, 3, 4);
    const worlds = new Set(Array.from({ length: 20 }, (_, seed) => rescueLevel(p, seed).world >= 5));
    expect(worlds).toEqual(new Set([true, false]));
  });

  it('listen and remember once the fairy story is done', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.worldsDone = [0, 1, 2, 3, 4];
    const styles = () => new Set(Array.from({ length: 40 }, (_, seed) => rescueLevel(p, seed).style ?? 'copy'));
    expect(styles()).toEqual(new Set(['copy']));
    p.progress.worldsDone.push(10, 11, 12, 13, 14);
    expect(styles()).toEqual(new Set(['copy', 'dictation', 'memory', 'mixed']));
  });
});

describe('first level', () => {
  it('asks for single chunks; only the second level may need the space bar', () => {
    expect(levelById('w1-1')?.noSpace).toBe(true);
    expect(LEVELS.filter((l) => l.noSpace).map((l) => l.id)).toEqual(['w1-1']);
  });
});

describe('world locks', () => {
  it('names the world before it that is not done', () => {
    const p = newProfile('Ema', 'sk');
    expect(worldLock(p, 0)).toBeNull();
    expect(worldLock(p, 1)).toEqual({ kind: 'world', prev: 0 });
    p.progress.worldsDone = [0];
    expect(worldLock(p, 1)).toBeNull();
  });

  it('counts the keys a closed story still needs', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.unlockedKeys = KEYS.slice(0, 7);
    expect(worldLock(p, 5)).toEqual({ kind: 'keys', need: 10, have: 7 });
    p.progress.unlockedKeys = KEYS.slice(0, 10);
    expect(worldLock(p, 5)).toBeNull();
  });
});

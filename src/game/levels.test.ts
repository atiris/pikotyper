import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { SUPER_ID } from '../storage/schema';
import { LEVELS, STORIES, isLevelUnlocked, isWorldUnlocked, levelById, nextLevel, rescueLevel, rescueUnlocked, worldLevels } from './levels';

describe('story unlocks', () => {
  it('opens the robot story after world 2 of the dragon story', () => {
    const p = newProfile('Ema', 'sk');
    expect(isWorldUnlocked(p, 0)).toBe(true);
    expect(isWorldUnlocked(p, 5)).toBe(false);
    p.progress.worldsDone = [0];
    expect(isWorldUnlocked(p, 5)).toBe(false);
    p.progress.worldsDone = [0, 1];
    expect(isWorldUnlocked(p, 5)).toBe(true);
    expect(isWorldUnlocked(p, 6)).toBe(false);
  });

  it('lets both stories go on independently', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.worldsDone = [0, 1, 5, 6];
    expect(isWorldUnlocked(p, 2)).toBe(true);
    expect(isWorldUnlocked(p, 3)).toBe(false);
    expect(isWorldUnlocked(p, 7)).toBe(true);
    expect(isWorldUnlocked(p, 8)).toBe(false);
  });

  it('plays the dragon story first, then the robot story', () => {
    const p = newProfile('Ema', 'sk');
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
  const KEYS = ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'g', 'h'];
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
});

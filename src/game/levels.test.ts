import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { LEVELS, STORIES, isWorldUnlocked, levelById, nextLevel, rescueLevel, rescueUnlocked } from './levels';

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
    expect(nextLevel(p).id).toBe('w3-1');
    for (const l of LEVELS.filter((x) => x.world < 5)) p.progress.levels[l.id] = 3;
    p.progress.worldsDone = [0, 1, 2, 3, 4];
    expect(nextLevel(p).id).toBe('w6-1');
  });

  it('has five levels with a super-obstacle in every world', () => {
    for (const s of STORIES) for (const w of s.worlds) {
      expect(levelById(`w${w + 1}-5`)?.isSuper).toBe(true);
      expect(LEVELS.filter((l) => l.world === w)).toHaveLength(5);
    }
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

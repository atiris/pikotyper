import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { LEVELS } from './levels';
import { AUTO_DIFFICULTY_MAX, MIN_OWN_KEYS, completeLevel, grow, growthNeed } from './progress';

describe('automatic growth', () => {
  it('steps up after enough good play, difficulty and word length in turn', () => {
    const p = newProfile('Ema', 'sk');
    expect(grow(p, growthNeed(0) - 1, 1)).toBeNull();
    expect(grow(p, 1, 1)).toEqual({ kind: 'difficulty', value: 4, medal: 1 });
    expect(grow(p, growthNeed(1), 0.95)).toEqual({ kind: 'wordLen', value: 7, medal: 2 });
    expect(p.settings.wordLen).toEqual([3, 7]);
  });

  it('ignores inaccurate play and settings a parent fixed', () => {
    const p = newProfile('Ema', 'sk');
    expect(grow(p, 999, 0.7)).toBeNull();
    expect(p.progress.growthSeconds).toBe(0);
    p.settings.autoDifficulty = false;
    expect(grow(p, 999, 1)?.kind).toBe('wordLen');
    expect(p.settings.difficulty).toBe(3);
  });

  it('stops at the automatic maximum', () => {
    const p = newProfile('Ema', 'sk');
    p.settings.autoWordLen = false;
    p.settings.difficulty = AUTO_DIFFICULTY_MAX;
    expect(grow(p, 9999, 1)).toBeNull();
  });
});

describe('a level Piko typed for the child', () => {
  const run = { accuracy: 1, errors: 0, cpm: 60, seconds: 120 };

  it('earns one star, keeps a better best and adds no growth time', () => {
    const p = newProfile('Ema', 'sk');
    p.progress.levels['w1-1'] = 3;
    const r = completeLevel(p, LEVELS[0], { ...run, chars: MIN_OWN_KEYS - 1 });
    expect(r).toMatchObject({ byPiko: true, stars: 1, growth: null });
    expect(p.progress.levels['w1-1']).toBe(3);
    expect(p.progress.growthSeconds).toBe(0);
  });

  it('counts the level normally once the child typed enough keys', () => {
    const p = newProfile('Ema', 'sk');
    const r = completeLevel(p, LEVELS[0], { ...run, chars: MIN_OWN_KEYS });
    expect(r).toMatchObject({ byPiko: false, stars: 3 });
    expect(p.progress.levels['w1-1']).toBe(3);
    expect(p.progress.growthSeconds).toBe(120);
  });
});

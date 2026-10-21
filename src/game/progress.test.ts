import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { AUTO_DIFFICULTY_MAX, grow, growthNeed } from './progress';

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

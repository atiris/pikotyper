import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import type { Surprise } from '../storage/schema';
import { levelById, practiceLevel, rescueLevel } from './levels';
import type { LevelResult } from './progress';
import { surpriseFor, surpriseReached, teaserLines } from './own-content';

const result = (stars: number, accuracy: number, seconds = 90) => ({ stars, accuracy, seconds }) as LevelResult;

describe('own questions', () => {
  it('take every second teaser, in order, and are answered after the next level', () => {
    const p = newProfile('Ema', 'sk');
    p.ownQuestions = [{ q: 'Q1', a: 'A1' }, { q: 'Q2', a: 'A2' }];
    const asked = Array.from({ length: 6 }, (_, i) => teaserLines(p, { q: `b${i}`, a: `ba${i}` }));
    expect(asked.map((x) => x.question)).toEqual(['b0', 'Q1', 'b2', 'Q2', 'b4', 'Q1']);
    expect(asked.map((x) => x.answer)).toEqual(['ba0', 'ba1', 'A1', 'ba3', 'A2', 'ba5']);
    expect(p.progress.pendingQuestion).toBe(0);
  });

  it('keep the built-in teasers when the parent has none', () => {
    const p = newProfile('Ema', 'sk');
    expect([teaserLines(p, { q: 'b0' }), teaserLines(p, { q: 'b1' })].map((x) => x.question)).toEqual(['b0', 'b1']);
  });

  it('do not count a level without a question', () => {
    const p = newProfile('Ema', 'sk');
    p.ownQuestions = [{ q: 'Q1', a: 'A1' }];
    teaserLines(p, { q: 'b0' });
    teaserLines(p, { a: 'last' });
    expect(teaserLines(p, { q: 'b1' }).question).toBe('Q1');
  });
});

describe('surprises', () => {
  const surprise = (id: string, place: string, minStars = 2): Surprise => ({ id, q: `q${id}`, a: `a${id}`, place, minStars });
  const w12 = levelById('w1-2')!;

  it('wait at their place, the oldest first', () => {
    const p = newProfile('Ema', 'sk');
    p.surprises = [surprise('1', 'w1-3'), surprise('2', 'next'), surprise('3', 'next'), surprise('4', 'practice')];
    expect(surpriseFor(p, w12, false)?.id).toBe('2');
    expect(surpriseFor(p, levelById('w1-3')!, false)?.id).toBe('1');
    expect(surpriseFor(p, rescueLevel(1), false)?.id).toBe('2');
    expect(surpriseFor(p, practiceLevel(null), false)?.id).toBe('4');
    expect(surpriseFor(p, practiceLevel(60), true)).toBeNull();
  });

  it('are revealed only with enough stars, and never shown again after', () => {
    const p = newProfile('Ema', 'sk');
    p.surprises = [surprise('1', 'next', 3), surprise('2', 'next')];
    const s = surpriseFor(p, w12, false)!;
    expect(surpriseReached(s, w12, result(2, 0.9))).toBe(false);
    expect(surpriseFor(p, w12, false)?.id).toBe('1');
    expect(surpriseReached(s, w12, result(3, 0.97))).toBe(true);
    s.revealedAt = '2026-10-21';
    expect(surpriseFor(p, w12, false)?.id).toBe('2');
  });

  it('need a minute of accurate free practice', () => {
    const s = surprise('1', 'practice');
    const practice = practiceLevel(null);
    expect(surpriseReached(s, practice, result(0, 0.9, 50))).toBe(false);
    expect(surpriseReached(s, practice, result(0, 0.8, 120))).toBe(false);
    expect(surpriseReached(s, practice, result(0, 0.9, 61))).toBe(true);
  });
});

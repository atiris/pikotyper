import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { LAYOUTS } from '../keyboard/layouts';
import { advanceLesson, firstKeys, isMastered, keysToIntroduce, lessonOrder, reactionLimit, shiftKeyOf } from './lessons';
import { STATS_WINDOW, keyReport, recordPress, weakKeys } from './stats';

describe('lesson order', () => {
  it('starts on the home row with the index fingers', () => {
    expect(firstKeys('sk-qwertz')).toEqual(['f', 'j', ' ']);
    expect(lessonOrder('sk-qwertz').slice(0, 9)).toEqual(['f', 'j', ' ', 'd', 'k', 's', 'l', 'a', 'ô']);
    expect(lessonOrder('us-qwerty')[8]).toBe(';');
  });

  it('brings punctuation in with the letters and each Shift in the middle', () => {
    const sk = lessonOrder('sk-qwertz');
    const after = (key: string, prev: string) => expect(sk.indexOf(key)).toBe(sk.indexOf(prev) + 1);
    after('.', 'u');
    after(',', 'n');
    after('ShiftL', 'p');
    after('ShiftR', 'z');
    after('?', 'q');
    after('!', 'á');
    expect(sk.indexOf('ShiftR')).toBeLessThan(sk.indexOf('á'));
    expect(sk).not.toContain('Shift');
    const us = lessonOrder('us-qwerty');
    expect(us.indexOf('ShiftR')).toBe(us.indexOf('y') + 1);
    expect(us.indexOf("'")).toBe(us.indexOf(',') + 1);
    expect(us.indexOf('!')).toBeGreaterThan(us.indexOf('1'));
  });

  it('measures a capital on the Shift of the other hand', () => {
    expect(shiftKeyOf(LAYOUTS['sk-qwertz'], 'J')).toBe('ShiftL');
    expect(shiftKeyOf(LAYOUTS['sk-qwertz'], 'A')).toBe('ShiftR');
    expect(shiftKeyOf(LAYOUTS['sk-qwertz'], 'Č')).toBe('ShiftR');
    expect(shiftKeyOf(LAYOUTS['sk-qwertz'], 'j')).toBeNull();
    expect(shiftKeyOf(LAYOUTS['sk-qwertz'], '?')).toBeNull();
  });

  it('teaches Slovak diacritics but not on the US layout', () => {
    expect(lessonOrder('sk-qwertz')).toContain('ľ');
    expect(lessonOrder('us-qwerty')).not.toContain('ľ');
  });

  it('scales the reaction limit with difficulty', () => {
    expect(reactionLimit(1)).toBe(1600);
    expect(reactionLimit(10)).toBe(800);
  });
});

describe('mastery and unlocking', () => {
  it('needs 40 accurate, quick presses', () => {
    const p = newProfile('Ema', 'sk');
    for (let i = 0; i < 39; i++) recordPress(p, 'j', 'j', 500);
    expect(isMastered(p.stats.keys.j, 5)).toBe(false);
    recordPress(p, 'j', 'j', 500);
    expect(isMastered(p.stats.keys.j, 5)).toBe(true);
  });

  it('is not mastered with too many errors or slow presses', () => {
    const p = newProfile('Ema', 'sk');
    for (let i = 0; i < 40; i++) recordPress(p, 'f', i % 8 === 0 ? 'g' : 'f', 500);
    expect(isMastered(p.stats.keys.f, 5)).toBe(false);
    const q = newProfile('Ema', 'sk');
    for (let i = 0; i < 40; i++) recordPress(q, 'f', 'f', 2500);
    expect(isMastered(q.stats.keys.f, 5)).toBe(false);
  });

  it('unlocks the next mirrored pair only when both newest keys are ready', () => {
    const p = newProfile('Ema', 'sk');
    expect(advanceLesson(p)).toEqual([]);
    for (let i = 0; i < 25; i++) recordPress(p, 'j', 'j', 400);
    expect(advanceLesson(p)).toEqual([]);
    for (let i = 0; i < 25; i++) recordPress(p, 'f', 'f', 400);
    expect(advanceLesson(p)).toEqual([]);
    for (let i = 0; i < 12; i++) recordPress(p, ' ', ' ', 400);
    expect(advanceLesson(p)).toEqual(['d', 'k']);
    expect(p.progress.unlockedKeys).toEqual(['f', 'j', ' ', 'd', 'k']);
  });

  it('skips diacritics when the parent turned them off', () => {
    const p = newProfile('Ema', 'sk');
    p.settings.noDiacritics = true;
    p.progress.unlockedKeys = lessonOrder('sk-qwertz').slice(0, lessonOrder('sk-qwertz').indexOf('q') + 1);
    for (let i = 0; i < 40; i++) recordPress(p, 'q', 'q', 400);
    expect(advanceLesson(p)).toEqual(['?']);
    p.progress.unlockedKeys.push('-');
    for (let i = 0; i < 12; i++) recordPress(p, '-', '-', 400);
    expect(advanceLesson(p)).toEqual(['!']);
  });

  it('introduces every unlocked key once, in order', () => {
    const p = newProfile('Ema', 'sk');
    expect(keysToIntroduce(p)).toEqual(['f', 'j', ' ']);
    p.progress.introducedKeys.push('f');
    expect(keysToIntroduce(p)).toEqual(['j', ' ']);
  });
});

describe('statistics', () => {
  it('records the wrong key typed instead and capitals under Shift', () => {
    const p = newProfile('Ema', 'sk');
    recordPress(p, 'f', 'g', 300);
    recordPress(p, 'F', 'F', 300);
    recordPress(p, 'J', 'j', 300);
    expect(p.stats.keys.f.recentWrong).toEqual(['g']);
    expect(p.stats.keys.f.presses).toBe(2);
    expect(p.stats.keys.f.days).toHaveLength(1);
    expect(p.stats.keys.f.days[0]).toMatchObject({ presses: 2, errors: 1, rtCount: 1 });
    expect(p.stats.keys.ShiftR.presses).toBe(1);
    expect(p.stats.keys.ShiftL.errors).toBe(1);
  });

  it('lists the weakest keys first', () => {
    const p = newProfile('Ema', 'sk');
    for (let i = 0; i < 10; i++) {
      recordPress(p, 'f', 'f', 400);
      recordPress(p, 'j', i % 2 ? 'h' : 'j', 400);
    }
    expect(weakKeys(p, ['f', 'j'])[0].key).toBe('j');
  });

  it('counts only the last presses, so old mistakes fade out', () => {
    const p = newProfile('Ema', 'sk');
    for (let i = 0; i < 30; i++) recordPress(p, 'f', 'g', 400);
    for (let i = 0; i < STATS_WINDOW; i++) recordPress(p, 'f', 'f', 400);
    const r = keyReport(p, 'f')!;
    expect(r.accuracy).toBe(1);
    expect(r.presses).toBe(30 + STATS_WINDOW);
    expect(r.confusions).toEqual([{ ch: 'g', n: 30 }]);
  });
});

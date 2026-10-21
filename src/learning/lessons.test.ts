import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { advanceLesson, firstKeys, isMastered, keysToIntroduce, lessonOrder, reactionLimit } from './lessons';
import { recordPress, weakKeys } from './stats';

describe('lesson order', () => {
  it('starts on the home row with the index fingers', () => {
    expect(firstKeys('sk-qwertz')).toEqual(['f', 'j']);
    expect(lessonOrder('sk-qwertz').slice(0, 8)).toEqual(['f', 'j', 'd', 'k', 's', 'l', 'a', 'ô']);
    expect(lessonOrder('us-qwerty')[7]).toBe(';');
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

  it('unlocks the next key only after the newest one is mastered', () => {
    const p = newProfile('Ema', 'sk');
    expect(advanceLesson(p)).toBeNull();
    for (let i = 0; i < 40; i++) recordPress(p, 'j', 'j', 400);
    expect(advanceLesson(p)).toBe('d');
    expect(p.progress.unlockedKeys).toEqual(['f', 'j', 'd']);
  });

  it('skips diacritics when the parent turned them off', () => {
    const p = newProfile('Ema', 'sk');
    p.settings.noDiacritics = true;
    p.progress.unlockedKeys = lessonOrder('sk-qwertz').slice(0, 27);
    for (let i = 0; i < 40; i++) recordPress(p, 'q', 'q', 400);
    expect(advanceLesson(p)).toBe('Shift');
  });

  it('introduces every unlocked key once, in order', () => {
    const p = newProfile('Ema', 'sk');
    expect(keysToIntroduce(p)).toEqual(['f', 'j']);
    p.progress.introducedKeys.push('f');
    expect(keysToIntroduce(p)).toEqual(['j']);
  });
});

describe('statistics', () => {
  it('records the wrong key typed instead and capitals under Shift', () => {
    const p = newProfile('Ema', 'sk');
    recordPress(p, 'f', 'g', 300);
    recordPress(p, 'F', 'F', 300);
    expect(p.stats.keys.f.wrong).toEqual({ g: 1 });
    expect(p.stats.keys.f.presses).toBe(2);
    expect(p.stats.keys.Shift.presses).toBe(1);
  });

  it('lists the weakest keys first', () => {
    const p = newProfile('Ema', 'sk');
    for (let i = 0; i < 10; i++) {
      recordPress(p, 'f', 'f', 400);
      recordPress(p, 'j', i % 2 ? 'h' : 'j', 400);
    }
    expect(weakKeys(p, ['f', 'j'])[0].key).toBe('j');
  });
});

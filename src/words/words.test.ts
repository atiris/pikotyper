import { describe, expect, it } from 'vitest';
import { WordSource, filterWords, isBlocked } from './words';

const WORDS = ['sad', 'lak', 'las', 'les', 'kde', 'ide', 'šaty', 'ruka', 'noha', 'dom', 'kôň', 'ja', 'aha', 'jeseň', 'slnko'];

describe('word filter', () => {
  it('keeps only words made of allowed keys and in the length range', () => {
    expect(filterWords(WORDS, new Set([...'asdfjkl']), [2, 5])).toEqual(['sad', 'lak', 'las', 'ja']);
  });
});

describe('WordSource', () => {
  it('uses letter drills for tiny key sets', () => {
    const src = new WordSource(WORDS, { keys: ['f', 'j'], len: [2, 6], noDiacritics: false, seed: 1 });
    for (let i = 0; i < 50; i++) expect(src.next()).toMatch(/^[fj]+$/);
  });

  it('never uses keys outside the set', () => {
    const keys = [...'fjdksla'];
    const src = new WordSource(WORDS, { keys, len: [2, 5], noDiacritics: false, seed: 2 });
    for (let i = 0; i < 200; i++) expect([...src.next()].every((c) => keys.includes(c))).toBe(true);
  });

  it('respects the length range', () => {
    const src = new WordSource(WORDS, { keys: [...'fjdkslaeiruotnhô'], len: [3, 4], noDiacritics: false, seed: 3 });
    for (let i = 0; i < 200; i++) {
      const w = src.next();
      expect(w.length).toBeGreaterThanOrEqual(1);
      expect(w.length).toBeLessThanOrEqual(4);
    }
  });

  it('drops diacritics when asked', () => {
    const src = new WordSource(WORDS, { keys: [...'fjdkslaeiruotnhôšň'], len: [2, 6], noDiacritics: true, seed: 4 });
    for (let i = 0; i < 200; i++) expect(src.next()).not.toMatch(/[ôšň]/);
  });

  it('makes pronounceable pseudo-words when few real words match', () => {
    const src = new WordSource([], { keys: [...'fjdkslae'], len: [3, 5], noDiacritics: false, seed: 5 });
    const w = src.next();
    expect(w).toMatch(/^[fjdkslae]+$/);
  });

  it('avoids first letters already on screen when it can', () => {
    const src = new WordSource(WORDS, { keys: [...'fjdkslaeiruotnh'], len: [2, 6], noDiacritics: false, seed: 6 });
    let clashes = 0;
    for (let i = 0; i < 100; i++) if (src.next(new Set(['s', 'l']))[0].match(/[sl]/)) clashes++;
    expect(clashes).toBeLessThan(5);
  });

  it('capitalizes some words once Shift is learned', () => {
    const src = new WordSource(WORDS, { keys: [...'fjdkslaeiruotnh', 'Shift'], len: [2, 6], noDiacritics: false, seed: 7 });
    const caps = Array.from({ length: 200 }, () => src.next()).filter((w) => w[0] !== w[0].toLowerCase());
    expect(caps.length).toBeGreaterThan(10);
  });
});

describe('block list', () => {
  it('blocks rude fragments', () => {
    expect(isBlocked('kokot')).toBe(true);
    expect(isBlocked('lesik')).toBe(false);
  });
});

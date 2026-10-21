import { describe, expect, it } from 'vitest';
import { TypingCore } from './typing';
import { starsFor } from './levels';

describe('TypingCore', () => {
  it('locks on the first letter and finishes the word', () => {
    const c = new TypingCore();
    const t = c.add('jas');
    expect(c.type('j').kind).toBe('ok');
    expect(c.locked).toBe(t);
    c.type('a');
    expect(c.type('s').kind).toBe('done');
    expect(t.done).toBe(true);
    expect(c.locked).toBeNull();
  });

  it('a wrong letter never unlocks or resets the word', () => {
    const c = new TypingCore();
    const t = c.add('fjf');
    c.type('f');
    const r = c.type('d');
    expect(r.kind).toBe('wrong');
    expect(c.locked).toBe(t);
    expect(t.typed).toBe(1);
    expect(t.errors).toBe(1);
  });

  it('picks the most urgent target when first letters match', () => {
    const c = new TypingCore();
    const far = c.add('ja');
    const near = c.add('jo');
    far.urgency = 1;
    near.urgency = 5;
    c.type('j');
    expect(c.locked).toBe(near);
    expect(c.expectedChar()).toBe('o');
  });

  it('ignores targets that are not selectable', () => {
    const c = new TypingCore();
    c.add('kk', {}, false);
    expect(c.type('k').kind).toBe('wrong');
    expect(c.expectedChar()).toBeNull();
  });

  it('lets a target go without penalty', () => {
    const c = new TypingCore();
    const t = c.add('dom');
    c.type('d');
    c.release(t);
    expect(c.locked).toBeNull();
    expect(c.active).toHaveLength(0);
  });
});

describe('stars', () => {
  it('rewards accuracy and always gives at least one', () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(0.9)).toBe(2);
    expect(starsFor(0.2)).toBe(1);
  });
});

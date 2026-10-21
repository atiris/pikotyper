import { describe, expect, it } from 'vitest';
import { Web } from './web';

const inside = (web: Web, x: number, y: number, r: number) =>
  web.pieces().filter((p) => Math.hypot((p.x1 + p.x2) / 2 - x, (p.y1 + p.y2) / 2 - y) < r).length;

describe('procedural web', () => {
  it('a hole hides the lines inside it and keeps the others', () => {
    const web = new Web(300);
    const before = web.pieces().length;
    const r = 300 * 0.18;
    expect(inside(web, 60, 20, r)).toBeGreaterThan(0);
    web.hole(60, 20);
    web.update(0.3);
    expect(inside(web, 60, 20, r)).toBe(0);
    const after = web.pieces().length;
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(before / 2);
    expect(inside(web, -60, -20, r)).toBeGreaterThan(0);
  });

  it('opens a hole gradually', () => {
    const web = new Web(300);
    const r = 300 * 0.18;
    web.hole(0, 0);
    web.update(0.1);
    expect(inside(web, 0, 0, r)).toBeGreaterThan(0);
    expect(inside(web, 0, 0, r * 0.3)).toBe(0);
  });

  it('loosening ends with alpha 0', () => {
    const web = new Web(230);
    web.loosen();
    web.update(0.5);
    expect(web.alpha).toBeGreaterThan(0);
    for (let i = 0; i < 10; i++) web.update(0.1);
    expect(web.alpha).toBe(0);
    expect(web.gone).toBe(true);
  });
});

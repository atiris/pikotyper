import { Rng } from '../engine/rng';
import type { G } from './draw';

/** One short straight part of a web line, in web-local coordinates (centre = 0, 0). */
export interface Piece {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A loose curled end hanging from a hole's rim. */
interface LooseEnd {
  a: number;
  len: number;
  curl: number;
  phase: number;
}

interface Hole {
  x: number;
  y: number;
  r: number;
  /** 0..1, grows as the lines snap. */
  open: number;
  ends: LooseEnd[];
}

const SPOKES = 8;
const RINGS = 7;
/** Length of one piece; a hole hides whole pieces, so this is its edge resolution. */
const STEP = 8;
const OPEN_TIME = 0.25;
const LOOSEN_TIME = 1;

/**
 * A spider web drawn in code: radial spokes, an octagonal spiral and threads to two
 * side anchors. Creatures tear holes into it; nothing is ever caught.
 */
export class Web {
  readonly holes: Hole[] = [];
  alpha = 1;
  private all: Piece[] = [];
  private rng: Rng;
  private t = 0;
  /** 0..1 while the whole web droops and fades after `loosen`. */
  private droop = 0;
  private loosening = false;

  constructor(readonly size: number, seed = 1) {
    this.rng = new Rng(seed);
    const R = size / 2;
    const tip = (i: number, r: number): [number, number] => {
      const a = (i / SPOKES) * Math.PI * 2;
      return [Math.cos(a) * r, Math.sin(a) * r];
    };
    for (let i = 0; i < SPOKES; i++) this.line([0, 0], tip(i, R), 0);
    for (let k = 1; k <= RINGS; k++) {
      const r = (R * k) / (RINGS + 0.4);
      for (let i = 0; i < SPOKES; i++) this.line(tip(i, r), tip(i + 1, r), r * 0.06);
    }
    // Threads to the flowers on both sides.
    const side = size * 0.62;
    this.line([R, 0], [side, 0], 0);
    this.line([-R, 0], [-side, 0], 0);
    this.line(tip(SPOKES * 0.625, R), [-side, -R * 0.9], 0);
    this.line(tip(SPOKES * 0.875, R), [side, -R * 0.9], 0);
  }

  /** Splits a line (sagging toward the centre by `sag`) into short pieces. */
  private line([ax, ay]: [number, number], [bx, by]: [number, number], sag: number): void {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / STEP));
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const ml = Math.hypot(mx, my) || 1;
    const at = (k: number): [number, number] => {
      const s = Math.sin(Math.PI * k) * sag;
      return [ax + (bx - ax) * k - (mx / ml) * s, ay + (by - ay) * k - (my / ml) * s];
    };
    let [px, py] = at(0);
    for (let j = 1; j <= n; j++) {
      const [qx, qy] = at(j / n);
      this.all.push({ x1: px, y1: py, x2: qx, y2: qy });
      px = qx;
      py = qy;
    }
  }

  /** Tears a hole at (x, y) in web-local coordinates. */
  hole(x: number, y: number): void {
    const r = this.rng;
    const ends: LooseEnd[] = [];
    for (let i = r.int(2, 4); i > 0; i--) ends.push({ a: r.range(0, Math.PI * 2), len: r.range(12, 24), curl: r.chance(0.5) ? 1 : -1, phase: r.range(0, 6) });
    this.holes.push({ x, y, r: this.size * 0.18, open: 0, ends });
  }

  /** The rest of the web droops and fades away. */
  loosen(): void {
    this.loosening = true;
  }

  get gone(): boolean {
    return this.alpha <= 0;
  }

  update(dt: number): void {
    this.t += dt;
    for (const h of this.holes) h.open = Math.min(1, h.open + dt / OPEN_TIME);
    if (this.loosening) {
      this.droop = Math.min(1, this.droop + dt / LOOSEN_TIME);
      this.alpha = 1 - this.droop;
    }
  }

  /** Pieces not hidden by an open hole. */
  pieces(): Piece[] {
    return this.all.filter((p) => {
      const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
      return !this.holes.some((h) => h.open > 0 && Math.hypot(mx - h.x, my - h.y) < h.r * h.open);
    });
  }

  draw(g: G, cx: number, cy: number, alpha = 1): void {
    const a = alpha * this.alpha;
    if (a <= 0) return;
    const side = this.size * 0.62;
    // Loosened lines sag most in the middle, away from the anchors.
    const sagY = (x: number, y: number) => y + this.droop * this.droop * 70 * (1 - Math.min(1, Math.abs(x) / side));
    g.save();
    g.translate(cx, cy);
    g.rotate(Math.sin(this.t * 0.8) * 0.015);
    g.globalAlpha *= a;
    g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.shadowColor = 'rgba(60, 80, 60, 0.35)';
    g.shadowBlur = 2;
    g.beginPath();
    let lx = NaN, ly = NaN;
    for (const p of this.pieces()) {
      if (p.x1 !== lx || p.y1 !== ly) g.moveTo(p.x1, sagY(p.x1, p.y1));
      g.lineTo(p.x2, sagY(p.x2, p.y2));
      lx = p.x2;
      ly = p.y2;
    }
    for (const h of this.holes) {
      for (const e of h.ends) {
        const sx = h.x + Math.cos(e.a) * h.r * h.open, sy = h.y + Math.sin(e.a) * h.r * h.open;
        const len = e.len * h.open;
        const sway = Math.sin(this.t * 2.2 + e.phase) * 4;
        g.moveTo(sx, sagY(sx, sy));
        g.quadraticCurveTo(sx - Math.cos(e.a) * len * 0.6 + sway, sagY(sx, sy) + len * 0.4, sx + e.curl * len * 0.35 + sway, sagY(sx, sy) + len);
      }
    }
    g.stroke();
    g.restore();
  }
}

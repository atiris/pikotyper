import { pickLine } from '../../app/app';
import { VH } from '../../engine/loop';
import { ease } from '../../engine/tween';
import { blob, drawSprite, type G } from '../../gfx/draw';
import { Web } from '../../gfx/web';
import { Mode } from '../mode';
import type { LevelRuntime } from '../runtime';
import type { Target } from '../typing';
import { ApproachMode, type Mover, groundY } from './approach';

const FLYERS = ['obj-bee', 'obj-butterfly'];
const BUGS = ['obj-ladybug', 'obj-fly'];
const COLORS: Record<string, string> = {
  'obj-bee': '#f5c542', 'obj-butterfly': '#8fc5ef', 'obj-ladybug': '#e5534b', 'obj-fly': '#9aa7b4', 'obj-mouse': '#b8b8c4', 'obj-spider': '#b49be0',
};
const STEM = 110;

const fallback = (sprite: string) => blob(COLORS[sprite] ?? '#9ccf7a');

/** Piko's dandelion; on a finished word it tilts toward the creature and blows seeds at it. */
class Dandelion {
  private tilt = 0;
  private bob = 0;
  constructor(private L: LevelRuntime, private x: number, private y: number) {}

  /** The puffball, where the seeds start. */
  private head(): [number, number] {
    return [this.x + Math.sin(this.tilt) * STEM, this.y + this.bob - Math.cos(this.tilt) * STEM];
  }

  blow(tx: number, ty: number, done: () => void): void {
    const L = this.L;
    const [hx, hy] = this.head();
    const to = Math.max(-0.4, Math.min(0.7, (Math.atan2(ty - hy, tx - hx) + Math.PI / 2) * 0.5));
    const from = this.tilt;
    L.tweens.add(0.15, (k) => (this.tilt = from + (to - from) * k), ease.outQuad, () => {
      const [sx, sy] = this.head();
      let next = 0;
      L.tweens.add(0.3, (k) => {
        // A stream of seed puffs from the puffball to the creature.
        for (; next <= k; next += 0.1) {
          const x = sx + (tx - sx) * next, y = sy + (ty - sy) * next;
          L.particles.emit(x, y, 2, 'puff', ['#ffffff', '#f4f8ff'], 40, 9, 0.6);
          L.particles.emit(x, y, 1, 'dot', ['#ffffff', '#efe8d8'], 60, 4, 0.8);
        }
      }, ease.linear, () => {
        done();
        L.tweens.add(0.4, (k) => (this.tilt = to * (1 - k)), ease.inOutQuad);
      });
    });
  }

  draw(g: G, t: number): void {
    // It joins Piko when the game starts, not during the preparation cards.
    if (!this.L.started) return;
    this.bob = Math.sin(t * 2) * 4;
    const [hx, hy] = this.head();
    const seeds = 22;
    const angle = (i: number) => (i / seeds) * Math.PI * 2 + Math.sin(t * 1.5 + i) * 0.05;
    g.save();
    g.lineCap = 'round';
    g.strokeStyle = '#5f9e3f';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(this.x, this.y + this.bob);
    g.quadraticCurveTo(this.x - 8 + Math.sin(this.tilt) * STEM * 0.4, this.y + this.bob - STEM * 0.5, hx, hy);
    g.stroke();
    g.fillStyle = 'rgba(255, 255, 255, 0.45)';
    g.beginPath();
    g.arc(hx, hy, 28, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    g.fillStyle = '#ffffff';
    g.lineWidth = 1.5;
    g.shadowColor = 'rgba(60, 80, 60, 0.4)';
    g.shadowBlur = 2;
    g.beginPath();
    for (let i = 0; i < seeds; i++) {
      g.moveTo(hx + Math.cos(angle(i)) * 6, hy + Math.sin(angle(i)) * 6);
      g.lineTo(hx + Math.cos(angle(i)) * 25, hy + Math.sin(angle(i)) * 25);
    }
    g.stroke();
    for (let i = 0; i < seeds; i++) {
      g.beginPath();
      g.arc(hx + Math.cos(angle(i)) * 26, hy + Math.sin(angle(i)) * 26, 2.5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#c9b98a';
    g.beginPath();
    g.arc(hx, hy, 6, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

/** Two tall flowers that hold the web between their stems. */
function drawFlowers(g: G, cx: number, cy: number, size: number, t: number): void {
  const top = cy - size / 2 - 30;
  const ground = groundY();
  for (const [side, petal] of [[-1, '#ff9fc0'], [1, '#ffd25a']] as const) {
    const x = cx + side * size * 0.62;
    const sway = Math.sin(t * 0.9 + side) * 4;
    g.save();
    g.lineCap = 'round';
    g.strokeStyle = '#5f9e3f';
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(x, ground + 20);
    g.quadraticCurveTo(x - side * 10, (top + ground) / 2, x + sway, top);
    g.stroke();
    g.fillStyle = '#7cbf55';
    g.beginPath();
    g.ellipse(x - side * 18, ground - 50, 20, 8, side * 0.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = petal;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.beginPath();
      g.arc(x + sway + Math.cos(a) * 16, top + Math.sin(a) * 16, 13, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#f5a623';
    g.beginPath();
    g.arc(x + sway, top, 11, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

/** Web size per level: bigger in level 2, across the meadow in level 4. */
const webSize = (index: number) => (index === 1 ? 300 : index === 3 ? 360 : 230);

/** World 1: creatures come toward a web; a typed word lets Piko's dandelion blow them over it. */
export class MeadowMode extends ApproachMode {
  readonly world = 'meadow';
  private dandelion: Dandelion;
  private web: Web;
  private webY: number;
  private holes = 0;

  constructor(L: LevelRuntime) {
    super(L);
    // The web hangs where the creatures used to reach Piko.
    this.playerX = 410;
    this.web = new Web(webSize(L.def.index), L.rng.int(1, 1e6));
    this.webY = Math.min(VH * 0.55, groundY() - this.web.size / 2 + 20);
    this.dandelion = new Dandelion(L, 185, VH - 75);
  }

  start(): void {
    this.L.say(pickLine('story.meadowStart'), 3);
  }

  private pickSprite(): string {
    const v = this.L.def.variant;
    const r = this.L.rng;
    if (v === 'flyers') return r.pick(FLYERS);
    if (v === 'bugs') return r.pick(BUGS);
    if (v === 'runners') return r.chance(0.75) ? 'obj-mouse' : r.pick(FLYERS);
    return r.pick([...FLYERS, ...BUGS, 'obj-mouse']);
  }

  makeMover(word: string): Mover {
    const sprite = this.pickSprite();
    const ground = sprite === 'obj-mouse';
    const x = this.L.vw + 90;
    // Flyers come at the web's height, so they would reach it.
    const R = this.web.size / 2;
    const y = ground ? groundY() - 10 : this.L.rng.range(Math.max(150, this.webY - R * 0.8), Math.min(VH * 0.62, this.webY + R * 0.55));
    return { x, y, vx: this.speedFor(word, x), vy: 0, rot: 0, vr: 0, age: 0, state: 'come', fade: 0, sprite, size: ground ? 100 : 110, ground, phase: this.L.rng.range(0, 6) };
  }

  protected moveComing(m: Mover, dt: number, tg: Target): void {
    super.moveComing(m, dt, tg);
    if (!m.ground) m.y += Math.sin(m.age * 2.2 + m.phase) * 22 * dt;
  }

  drawMover(g: G, m: Mover): void {
    const flap = m.ground ? Math.abs(Math.sin(m.age * 10)) * 0.05 : Math.sin(m.age * 14) * 0.04;
    const hop = m.ground && m.state === 'come' ? -Math.abs(Math.sin(m.age * 8)) * 6 : 0;
    drawSprite(g, m.sprite, m.x, m.y + hop, m.size, { flip: true, rot: m.rot, sy: 1 + flap, sx: 1 - flap }, fallback(m.sprite));
  }

  protected onLeave(m: Mover): void {
    const L = this.L;
    m.vx = 0;
    m.vy = 0;
    this.dandelion.blow(m.x - 30, m.y, () => {
      L.particles.emit(m.x, m.y - 20, 4, 'heart', ['#ff8fab', '#ffb3c6'], 90, 9, 1.2);
      L.sfx('whoosh');
      const x1 = this.playerX - 150;
      m.arc = { x0: m.x, y0: m.y, x1, k: 0, dur: Math.max(0.9, Math.min(2.2, (m.x - x1) / 380)) };
    });
  }

  /** Lifted by the wind: flyers arc over the web, mice hop under it; then on to the left. */
  protected moveGone(m: Mover, dt: number): void {
    if (m.state !== 'leave') return super.moveGone(m, dt);
    const a = m.arc;
    // Still waiting for the seeds.
    if (!a) return;
    if (a.k >= 1) {
      m.x -= 200 * dt;
      m.fade = Math.min(1, m.fade + dt * 1.4);
      return;
    }
    a.k = Math.min(1, a.k + dt / a.dur);
    m.x = a.x0 + (a.x1 - a.x0) * a.k;
    if (m.ground) {
      m.y = a.y0 - Math.abs(Math.sin(a.k * Math.PI * 4)) * 18;
      return;
    }
    const top = this.webY - this.web.size / 2 - 50;
    const peak = (a.x0 - this.playerX) / (a.x0 - a.x1);
    m.y = a.k < peak
      ? a.y0 + (top - a.y0) * Math.sin((Math.PI / 2) * (a.k / peak))
      : top + 60 * (1 - Math.cos((Math.PI / 2) * ((a.k - peak) / (1 - peak))));
  }

  /** Not typed in time: it tears a hole in the web and goes on through it. */
  protected onPass(m: Mover): void {
    const L = this.L;
    const R = this.web.size / 2;
    const hy = Math.max(-R * 0.8, Math.min(R * 0.8, m.y - this.webY));
    this.web.hole(L.rng.range(-0.25, 0.25) * R, hy);
    L.particles.emit(m.x, this.webY + hy, 6, 'sparkle', ['#ffffff', '#dfe9f5'], 90, 6);
    L.sfx('twang');
    if (this.holes++ === 0 || L.rng.chance(0.25)) L.say(pickLine('story.webHole'), 2.5);
  }

  update(dt: number): void {
    super.update(dt);
    this.web.update(dt);
  }

  render(g: G): void {
    drawFlowers(g, this.playerX, this.webY, this.web.size, this.t);
    this.web.draw(g, this.playerX, this.webY);
    super.render(g);
    this.dandelion.draw(g, this.t);
  }
}

/** World 1 super-obstacle: open the web strand by strand, then help the ladybugs behind it fly home. */
export class WebMode extends Mode {
  readonly world = 'meadow';
  private strands: Target[] = [];
  private friends: Target[] = [];
  private cleared = 0;
  private freed = 0;
  private cx = 0;
  private cy = VH * 0.46;
  private web = new Web(400);
  private dandelion: Dandelion;
  private doneTimer = 0;

  constructor(L: LevelRuntime) {
    super(L);
    this.dandelion = new Dandelion(L, 185, VH - 75);
  }

  start(): void {
    const L = this.L;
    const size = this.web.size;
    this.cx = L.vw * 0.6;
    const half = Math.ceil(L.def.count / 2);
    const spots = [[-0.28, -0.3], [0.3, -0.12], [-0.12, 0.3]];
    for (let i = 0; i < half; i++) {
      const [dx, dy] = spots[i % spots.length];
      this.strands.push(L.core.add(L.word(), { dx: dx * size, dy: dy * size, strand: true }));
    }
    for (let i = 0; i < L.def.count - half; i++) {
      const word = L.word();
      const tg = L.core.add(word, { x: this.cx + (i - (L.def.count - half - 1) / 2) * 150, y: this.cy + (i % 2 ? 40 : -50), vx: 0, vy: 0, gone: 0, phase: i }, false);
      this.friends.push(tg);
    }
  }

  update(dt: number): void {
    this.web.update(dt);
    for (const f of this.friends) {
      if (f.done) {
        f.data.x += f.data.vx * dt;
        f.data.y += f.data.vy * dt;
        f.data.gone = Math.min(1, f.data.gone + dt * 0.7);
      }
    }
    this.scroll += dt * 8;
    if (this.freed >= this.friends.length) this.doneTimer += dt;
  }

  onDone(tg: Target): void {
    const L = this.L;
    if (this.strands.includes(tg)) {
      this.cleared++;
      this.web.hole(tg.data.dx, tg.data.dy);
      L.particles.emit(this.cx + tg.data.dx, this.cy + tg.data.dy, 16, 'sparkle', ['#ffffff', '#dfe9f5'], 160, 8);
      L.sfx('twang');
      if (this.cleared >= this.strands.length) {
        this.web.loosen();
        for (const f of this.friends) f.selectable = true;
        L.sfx('whoosh');
        L.say(pickLine('story.webCleared'), 3);
      }
      return;
    }
    this.freed++;
    this.dandelion.blow(tg.data.x - 40, tg.data.y, () => {
      L.particles.emit(tg.data.x, tg.data.y, 6, 'heart', ['#ff8fab', '#ffb3c6'], 100, 9, 1.2);
      tg.data.vx = 180;
      tg.data.vy = -220;
    });
  }

  render(g: G): void {
    const size = this.web.size;
    drawFlowers(g, this.cx, this.cy, size, this.t);
    for (const f of this.friends) {
      g.save();
      g.globalAlpha = 1 - f.data.gone;
      const bob = Math.sin(this.t * 2 + f.data.phase) * 6;
      drawSprite(g, 'obj-ladybug', f.data.x, f.data.y + bob, 105, { flip: !f.done }, fallback('obj-ladybug'));
      g.restore();
    }
    this.web.draw(g, this.cx, this.cy);
    // The little spider just sits at the corner and waves when the web is gone.
    const wave = this.web.gone ? Math.sin(this.t * 6) * 0.25 : 0;
    drawSprite(g, 'obj-spider', this.cx + size * 0.5, this.cy - size * 0.45 + Math.sin(this.t) * 3, 80, { rot: wave }, fallback('obj-spider'));
    for (const s of this.strands) if (!s.done) this.L.label(g, s, this.cx + s.data.dx, this.cy + s.data.dy, 38);
    for (const f of this.friends) if (!f.done) this.L.label(g, f, f.data.x, f.data.y - 80, 36);
    this.dandelion.draw(g, this.t);
  }

  progress(): number {
    return (this.cleared + this.freed) / (this.strands.length + this.friends.length);
  }

  get finished(): boolean {
    return this.freed >= this.friends.length && this.doneTimer > 1.2;
  }
}

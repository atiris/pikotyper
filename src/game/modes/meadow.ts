import { pickLine } from '../../app/app';
import { VH } from '../../engine/loop';
import { ease } from '../../engine/tween';
import { blob, drawSprite, type G } from '../../gfx/draw';
import { Mode } from '../mode';
import type { LevelRuntime } from '../runtime';
import type { Target } from '../typing';
import { ApproachMode, type Mover, groundY } from './approach';

const FLYERS = ['obj-bee', 'obj-butterfly'];
const BUGS = ['obj-ladybug', 'obj-fly'];
const COLORS: Record<string, string> = {
  'obj-bee': '#f5c542', 'obj-butterfly': '#8fc5ef', 'obj-ladybug': '#e5534b', 'obj-fly': '#9aa7b4', 'obj-mouse': '#b8b8c4', 'obj-spider': '#b49be0',
};

const fallback = (sprite: string) => blob(COLORS[sprite] ?? '#9ccf7a');

/** Swatter at the player's side; swings to a target on a finished word. */
class Swatter {
  x = 0;
  y = 0;
  swing = 0;
  tx = 0;
  ty = 0;
  constructor(private L: LevelRuntime, private homeX: number, private homeY: number) {}

  hit(x: number, y: number, done: () => void): void {
    this.tx = x;
    this.ty = y;
    this.L.tweens.add(0.16, (k) => (this.swing = k), ease.outQuad, () => {
      done();
      this.L.tweens.add(0.3, (k) => (this.swing = 1 - k), ease.inOutQuad);
    });
  }

  draw(g: G, t: number): void {
    // It joins Piko when the game starts, not during the preparation cards.
    if (!this.L.started) return;
    const bob = Math.sin(t * 2) * 4;
    const x = this.homeX + (this.tx - this.homeX) * this.swing;
    const y = this.homeY + bob + (this.ty - this.homeY) * this.swing;
    drawSprite(g, 'obj-swatter', x, y, 150, { rot: -0.5 + this.swing * 0.9, ay: 0.3 }, (g2, w, h) => {
      g2.fillStyle = '#a0703c';
      g2.fillRect(-6, 0, 12, h * 0.6);
      g2.fillStyle = '#ffd25a';
      g2.beginPath();
      g2.arc(0, -h * 0.15, w * 0.3, 0, Math.PI * 2);
      g2.fill();
    });
  }
}

/** World 1: creatures approach; a soft swatter puff shoos them away happily. */
export class MeadowMode extends ApproachMode {
  readonly world = 'meadow';
  private swatter: Swatter;

  constructor(L: LevelRuntime) {
    super(L);
    this.playerX = 250;
    this.swatter = new Swatter(L, 170, VH * 0.45);
  }

  private pickSprite(): string {
    const v = this.L.def.variant;
    const r = this.L.rng;
    if (v === 'flyers') return r.pick(FLYERS);
    if (v === 'bugs') return r.pick(BUGS);
    if (v === 'runners') return r.chance(0.75) ? 'obj-mouse' : r.pick(FLYERS);
    return r.pick([...FLYERS, ...BUGS, 'obj-mouse', 'obj-spider']);
  }

  makeMover(word: string): Mover {
    const sprite = this.pickSprite();
    const ground = sprite === 'obj-mouse' || sprite === 'obj-spider';
    const x = this.L.vw + 90;
    const y = ground ? groundY() - 10 : this.L.rng.range(190, VH * 0.6);
    return { x, y, vx: this.speedFor(word, x), vy: 0, rot: 0, vr: 0, age: 0, state: 'come', fade: 0, sprite, size: ground ? 100 : 110, ground, phase: this.L.rng.range(0, 6) };
  }

  protected moveComing(m: Mover, dt: number, tg: Target): void {
    super.moveComing(m, dt, tg);
    if (!m.ground) m.y += Math.sin(m.age * 2.2 + m.phase) * 22 * dt;
  }

  drawMover(g: G, m: Mover): void {
    const flap = m.ground ? Math.abs(Math.sin(m.age * 10)) * 0.05 : Math.sin(m.age * 14) * 0.04;
    const hop = m.ground && m.state === 'come' ? -Math.abs(Math.sin(m.age * 8)) * 6 : 0;
    drawSprite(g, m.sprite, m.x, m.y + hop, m.size, { flip: m.state !== 'leave', rot: m.rot, sy: 1 + flap, sx: 1 - flap }, fallback(m.sprite));
  }

  protected onLeave(m: Mover): void {
    const L = this.L;
    m.state = 'leave';
    m.vx = 0;
    m.vy = 0;
    this.swatter.hit(m.x - 40, m.y, () => {
      L.particles.emit(m.x, m.y, 14, 'puff', ['#ffffff', '#fff6d6', '#e8f7ff'], 160, 16);
      L.particles.emit(m.x, m.y - 20, 4, 'heart', ['#ff8fab', '#ffb3c6'], 90, 9, 1.2);
      L.sfx('pop');
      m.vx = 240 + L.rng.range(0, 80);
      m.vy = m.ground ? -60 : -230;
      m.vr = m.ground ? 0 : 0.6;
    });
  }

  render(g: G): void {
    super.render(g);
    this.swatter.draw(g, this.t);
  }
}

/** World 1 super-obstacle: clear the web strand by strand, then help the ladybugs behind it fly home. */
export class WebMode extends Mode {
  readonly world = 'meadow';
  private strands: Target[] = [];
  private friends: Target[] = [];
  private webAlpha = 1;
  private cleared = 0;
  private freed = 0;
  private cx = 0;
  private cy = VH * 0.46;
  private webH = 470;
  private swatter: Swatter;
  private letters = 0;
  private totalLetters = 1;
  private doneTimer = 0;

  constructor(L: LevelRuntime) {
    super(L);
    this.swatter = new Swatter(L, 170, VH * 0.45);
  }

  start(): void {
    const L = this.L;
    this.cx = L.vw * 0.6;
    const half = Math.ceil(L.def.count / 2);
    const spots = [[-0.28, -0.3], [0.3, -0.12], [-0.12, 0.3]];
    for (let i = 0; i < half; i++) {
      const word = L.word();
      const [dx, dy] = spots[i % spots.length];
      this.strands.push(L.core.add(word, { dx: dx * this.webH, dy: dy * this.webH, strand: true }));
      this.totalLetters += word.length;
    }
    for (let i = 0; i < L.def.count - half; i++) {
      const word = L.word();
      const tg = L.core.add(word, { x: this.cx + (i - (L.def.count - half - 1) / 2) * 150, y: this.cy + (i % 2 ? 40 : -50), vx: 0, vy: 0, gone: 0, phase: i }, false);
      this.friends.push(tg);
    }
  }

  update(dt: number): void {
    const target = 1 - this.letters / this.totalLetters;
    this.webAlpha += (target - this.webAlpha) * Math.min(1, dt * 6);
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

  onCorrect(tg: Target): void {
    if (this.strands.includes(tg)) this.letters++;
  }

  onDone(tg: Target): void {
    const L = this.L;
    if (this.strands.includes(tg)) {
      this.letters++;
      this.cleared++;
      L.particles.emit(this.cx + tg.data.dx, this.cy + tg.data.dy, 16, 'sparkle', ['#ffffff', '#dfe9f5'], 160, 8);
      if (this.cleared >= this.strands.length) {
        this.letters = this.totalLetters;
        for (const f of this.friends) f.selectable = true;
        L.sfx('whoosh');
        L.say(pickLine('story.webCleared'), 3);
      }
      return;
    }
    this.freed++;
    this.swatter.hit(tg.data.x - 40, tg.data.y, () => {
      L.particles.emit(tg.data.x, tg.data.y, 6, 'heart', ['#ff8fab', '#ffb3c6'], 100, 9, 1.2);
      tg.data.vx = 180;
      tg.data.vy = -220;
    });
  }

  render(g: G): void {
    for (const f of this.friends) {
      g.save();
      g.globalAlpha = 1 - f.data.gone;
      const bob = Math.sin(this.t * 2 + f.data.phase) * 6;
      drawSprite(g, 'obj-ladybug', f.data.x, f.data.y + bob, 105, { flip: !f.done }, fallback('obj-ladybug'));
      g.restore();
    }
    if (this.webAlpha > 0.02) {
      g.save();
      g.globalAlpha = this.webAlpha;
      drawSprite(g, 'obj-spider-web', this.cx, this.cy, this.webH, { rot: Math.sin(this.t * 0.8) * 0.02 }, (g2, w) => {
        g2.strokeStyle = '#eef3f8';
        g2.lineWidth = 3;
        for (let r = 0.1; r < 0.5; r += 0.1) {
          g2.beginPath();
          g2.arc(0, 0, w * r, 0, Math.PI * 2);
          g2.stroke();
        }
      });
      g.restore();
      drawSprite(g, 'obj-spider', this.cx + this.webH * 0.38, this.cy - this.webH * 0.42 + Math.sin(this.t) * 10, 90, {}, fallback('obj-spider'));
    }
    for (const s of this.strands) if (!s.done) this.L.label(g, s, this.cx + s.data.dx, this.cy + s.data.dy, 38);
    for (const f of this.friends) if (!f.done) this.L.label(g, f, f.data.x, f.data.y - 80, 36);
    this.swatter.draw(g, this.t);
  }

  progress(): number {
    return (this.cleared + this.freed) / (this.strands.length + this.friends.length);
  }

  get finished(): boolean {
    return this.freed >= this.friends.length && this.doneTimer > 1.2;
  }
}


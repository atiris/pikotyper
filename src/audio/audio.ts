import { assetUrl, hasMusic } from '../gfx/assets';

export type Sfx = 'key' | 'wrong' | 'word' | 'reward' | 'click' | 'whoosh' | 'pop' | 'beat';

const MUTE_KEY = 'pikotyper:mute';
const FADE = 1.2;

/**
 * Sound effects are synthesized; music plays the generated tracks when present,
 * otherwise a calm pentatonic loop. Nothing plays before the first user gesture.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private sfxVolume = 0.7;
  private musicVolume = 0.5;
  muted = false;
  private track: string | null = null;
  private current: { el?: HTMLAudioElement; gain: GainNode; stop: () => void } | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    try { this.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { this.muted = false; }
    const unlock = () => {
      this.ensure();
      if (this.ctx?.state === 'suspended') void this.ctx.resume();
    };
    for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { capture: true });
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor() as AudioContext;
    this.sfxGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain.connect(this.ctx.destination);
    this.musicGain.connect(this.ctx.destination);
    this.applyVolumes();
    if (this.track) {
      const t = this.track;
      this.track = null;
      this.music(t);
    }
    return this.ctx;
  }

  setVolumes(sfx: number, music: number): void {
    this.sfxVolume = sfx;
    this.musicVolume = music;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(this.muted ? 0 : this.sfxVolume * 0.6, now, 0.05);
    this.musicGain.gain.setTargetAtTime(this.muted ? 0 : this.musicVolume * 0.55, now, 0.2);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* private mode */ }
    this.applyVolumes();
    this.listeners.forEach((l) => l());
    return this.muted;
  }

  onMuteChange(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((l) => l !== fn));
  }

  /** Crossfades to a music track (`music-<name>`); null stops the music. */
  music(name: string | null): void {
    if (name === this.track) return;
    this.track = name;
    const ctx = this.ctx;
    if (!ctx) return;
    const old = this.current;
    if (old) {
      old.gain.gain.setTargetAtTime(0, ctx.currentTime, FADE / 3);
      setTimeout(() => old.stop(), FADE * 1000 + 200);
    }
    this.current = null;
    if (!name) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.musicGain);
    gain.gain.setTargetAtTime(1, ctx.currentTime, FADE / 3);
    if (hasMusic(`music-${name}`)) {
      const el = new Audio(assetUrl(`music-${name}.mp3`));
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(el);
      src.connect(gain);
      void el.play().catch(() => undefined);
      this.current = { el, gain, stop: () => { el.pause(); el.src = ''; src.disconnect(); gain.disconnect(); } };
    } else {
      const stop = synthLoop(ctx, gain, name);
      this.current = { gain, stop: () => { stop(); gain.disconnect(); } };
    }
  }

  sfx(kind: Sfx): void {
    const ctx = this.ctx;
    if (!ctx || this.muted || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, slide?: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t + start);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + start + dur);
      g.gain.setValueAtTime(0, t + start);
      g.gain.linearRampToValueAtTime(vol, t + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
      o.connect(g).connect(this.sfxGain);
      o.start(t + start);
      o.stop(t + start + dur + 0.05);
    };
    switch (kind) {
      case 'key': tone(880 + Math.random() * 60, 0, 0.07, 'triangle', 0.12); break;
      case 'wrong': tone(300, 0, 0.18, 'sine', 0.12, 240); break;
      case 'word': tone(660, 0, 0.12, 'triangle', 0.2); tone(990, 0.08, 0.18, 'triangle', 0.18); break;
      case 'pop': tone(520, 0, 0.12, 'sine', 0.25, 1040); break;
      case 'whoosh': tone(200, 0, 0.35, 'sine', 0.12, 900); break;
      case 'beat': tone(440, 0, 0.08, 'sine', 0.12); break;
      case 'click': tone(700, 0, 0.05, 'square', 0.05); break;
      case 'reward': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle', 0.18)); break;
    }
  }
}

/** A calm pentatonic sequencer: soft pad + plucks, 70-90 BPM. */
function synthLoop(ctx: AudioContext, out: GainNode, name: string): () => void {
  const roots: Record<string, number> = { menu: 261.6, meadow: 196, space: 146.8, planet: 174.6, dragons: 155.6, egg: 220, break: 130.8, relaxing: 130.8 };
  const root = roots[name] ?? 220;
  const bpm = name === 'break' || name === 'relaxing' ? 62 : name === 'egg' ? 90 : 78;
  const scale = [0, 2, 4, 7, 9, 12, 14, 16];
  const beat = 60 / bpm;
  let step = 0;
  let next = ctx.currentTime + 0.1;
  const note = (freq: number, at: number, dur: number, vol: number, type: OscillatorType) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + Math.min(0.4, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + dur + 0.1);
  };
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.5) {
      if (step % 8 === 0) {
        const chord = [0, 4, 7].map((i) => root * 2 ** ((i + (step % 32 >= 16 ? 5 : 0)) / 12) / 2);
        chord.forEach((f) => note(f, next, beat * 8, 0.05, 'sine'));
      }
      if ((step * 7) % 3 !== 1) {
        const deg = scale[(step * 5 + Math.floor(step / 8)) % scale.length];
        note(root * 2 ** (deg / 12), next, beat * 1.5, 0.08, 'triangle');
      }
      next += beat / 2;
      step++;
    }
  }, 120);
  return () => clearInterval(timer);
}

export const audio = new AudioEngine();

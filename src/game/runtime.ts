import { app, layout, pickLine, reduceMotion, saveProfile } from '../app/app';
import { audio, type Sfx } from '../audio/audio';
import { Loop, Stage } from '../engine/loop';
import { Particles } from '../engine/particles';
import { Rng } from '../engine/rng';
import { Tweens } from '../engine/tween';
import { drawBackground, drawWord, type G } from '../gfx/draw';
import { type Mood, pikoElement, renderPikoInto } from '../gfx/piko';
import { preload } from '../gfx/assets';
import { t } from '../i18n/i18n';
import { KeyInput, type TypedChar } from '../input/input';
import { LAYOUTS, LayoutMismatchDetector, canType, fingerFor, stepsFor } from '../keyboard/layouts';
import { activeKeys, keysToIntroduce, masteryLevel } from '../learning/lessons';
import { keyWeights, recordPress, recordSession } from '../learning/stats';
import { FINGER_KEYS, KeyboardGuide } from '../ui/keyboard-guide';
import { button, h, icon } from '../ui/dom';
import { WordSource } from '../words/words';
import type { LevelDef } from './levels';
import { WORLDS } from './levels';
import type { Mode } from './mode';
import { createMode } from './modes';
import { type LevelResult, completeLevel } from './progress';
import { type Target, TypingCore } from './typing';
import { showCard, showDrill, showNewKey, showPosture, showTip } from './cards';

export interface RuntimeOptions {
  /** Practice: only these keys (drills), else the profile's active keys. */
  keys?: string[];
  /** Practice length in seconds; null = until the child stops. */
  seconds?: number | null;
  onFinish(result: LevelResult | null): void;
  onExit(): void;
}

/** Runs one level: input, typing state, mode, HUD, guide, Piko, stats. */
export class LevelRuntime {
  readonly core = new TypingCore();
  readonly tweens = new Tweens();
  readonly particles = new Particles();
  readonly rng = new Rng();
  readonly stage: Stage;
  readonly mode: Mode;
  readonly words: WordSource;
  readonly difficulty: number;
  readonly noPressure: boolean;
  readonly highContrast: boolean;
  readonly reduceMotion: boolean;
  readonly el: HTMLElement;

  private loop: Loop;
  private input: KeyInput | null = null;
  private guide: KeyboardGuide;
  private guideOn: boolean;
  private piko: HTMLElement;
  private bubble: HTMLElement;
  private bubbleTimer = 0;
  private progressFill: HTMLElement;
  private meter: HTMLElement;
  private pauseEl: HTMLElement | null = null;
  private paused = false;
  private started = false;
  private finished = false;
  private deadPending = false;
  private mismatch: LayoutMismatchDetector;
  private mismatchShown = false;

  /** Stats of this level. */
  chars = 0;
  errors = 0;
  private elapsed = 0;
  private lastKey = 0;
  private readySince = 0;
  /** Smoothed rhythm, correct characters per second. */
  ema: number;
  private wrongStreak = { ch: '', n: 0 };
  private wordStreak = 0;
  private lastCheer = 0;
  private moodTimer = 0;
  private hadKeydown = false;

  constructor(root: HTMLElement, readonly def: LevelDef, private opts: RuntimeOptions) {
    const p = app.profile!;
    this.difficulty = p.settings.difficulty;
    this.noPressure = p.settings.noTimePressure;
    this.highContrast = p.settings.highContrast;
    this.reduceMotion = reduceMotion();
    this.tweens.speed = this.reduceMotion ? 0.5 : 1;
    this.particles.enabled = !this.reduceMotion;
    const lastCpm = p.stats.sessions[p.stats.sessions.length - 1]?.cpm ?? 0;
    this.ema = lastCpm ? lastCpm / 60 : 1;
    this.mismatch = new LayoutMismatchDetector(p.layout);

    const keys = opts.keys ?? activeKeys(p);
    const lay = LAYOUTS[p.layout];
    this.words = new WordSource(app.words, {
      keys,
      len: p.settings.wordLen,
      noDiacritics: p.settings.noDiacritics,
      weights: keyWeights(p, keys),
      focus: opts.keys ? null : keysToIntroduce(p).pop() ?? p.progress.unlockedKeys[p.progress.unlockedKeys.length - 1],
      canType: (ch) => canType(lay, ch),
    });

    // DOM: HUD, stage, Piko, bubble, guide.
    this.el = h('div', { class: `level-screen world-${WORLDS[def.world]}` });
    this.progressFill = h('div', { class: 'progress-fill' });
    this.meter = h('div', { class: 'meter-fill' });
    const title = def.kind === 'practice' ? t('level.practice') : def.id === 'rescue' ? t('level.rescue') : t('level.title', { world: def.world + 1, level: def.index + 1 });
    const guideBtn = button('', () => this.toggleGuide(), 'icon-btn', 'keyboard');
    guideBtn.title = t('level.guide');
    guideBtn.setAttribute('aria-label', t('level.guide'));
    if (p.settings.guideLocked) guideBtn.disabled = true;
    const muteBtn = button('', () => { audio.toggleMute(); muteBtn.replaceChildren(icon(audio.muted ? 'mute' : 'sound')); }, 'icon-btn', audio.muted ? 'mute' : 'sound');
    muteBtn.setAttribute('aria-label', t('common.sound'));
    const pauseBtn = button('', () => this.pause(), 'icon-btn', 'pause');
    pauseBtn.setAttribute('aria-label', t('level.pause'));
    const hud = h('div', { class: 'hud' },
      pauseBtn,
      h('div', { class: 'hud-title' }, title),
      h('div', { class: 'progress', title: t('level.progress') }, this.progressFill),
      h('div', { class: 'meter', title: t('level.rhythm') }, h('span', { class: 'meter-label' }, t('level.rhythm')), h('div', { class: 'meter-bar' }, this.meter)),
      guideBtn, muteBtn);
    const stageWrap = h('div', { class: 'stage-wrap' });
    this.piko = pikoElement(p.companion, 'idle', 150);
    this.piko.classList.add('level-piko');
    this.piko.title = t('piko.statsHint');
    this.bubble = h('div', { class: 'bubble hidden', role: 'status', 'aria-live': 'polite' });
    stageWrap.append(this.piko, this.bubble);
    this.guide = new KeyboardGuide(lay);
    this.guideOn = p.settings.guide !== 'off';
    this.guide.setVisible(this.guideOn);
    this.el.append(hud, stageWrap, this.guide.el);
    root.append(this.el);

    this.stage = new Stage(stageWrap);
    this.mode = createMode(def, this);
    this.piko.classList.toggle('hidden', this.pikoOnStage);
    this.loop = new Loop((dt) => this.update(dt), () => this.render());
    this.loop.start();
    this.onVisibility = this.onVisibility.bind(this);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.onTouch = this.onTouch.bind(this);
    window.addEventListener('pointerdown', this.onTouch);
    void this.prepare();
  }

  get pikoOnStage(): boolean {
    return ['swamp', 'signs', 'boulder'].includes(this.def.kind);
  }

  /** Preparation: assets, tip, posture card, new key, then play. */
  private async prepare(): Promise<void> {
    const p = app.profile!;
    await preload([`bg-${this.mode.world}-far`, `bg-${this.mode.world}-mid`, `bg-${this.mode.world}-near`]);
    if (this.disposed) return;
    audio.music(this.def.kind === 'practice' ? app.menuTrack : this.mode.world);
    const host = this.el.querySelector<HTMLElement>('.stage-wrap')!;
    if (!app.tipShown && !this.opts.keys) {
      app.tipShown = true;
      await showTip(host, p);
    }
    if (!p.progress.postureSeen && !this.opts.keys) {
      await showPosture(host);
      p.progress.postureSeen = true;
      saveProfile();
    }
    for (const key of this.opts.keys ? [] : keysToIntroduce(p)) {
      if (this.disposed) return;
      await showNewKey(host, key, layout(), this.guide);
      p.progress.introducedKeys.push(key);
      saveProfile();
    }
    if (this.disposed) return;
    this.mode.start();
    this.started = true;
    this.readySince = performance.now();
    this.input = new KeyInput(window, {
      onChar: (c) => this.onChar(c),
      onDead: () => { this.deadPending = true; this.updateGuide(); },
      onEscape: () => (this.paused ? this.resume() : this.pause()),
      onRaw: (code, key, shift) => this.onRaw(code, key, shift),
    });
    this.updateGuide();
  }

  private disposed = false;

  dispose(): void {
    this.disposed = true;
    this.loop.stop();
    this.input?.dispose();
    this.stage.dispose();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointerdown', this.onTouch);
  }

  // ---- words and pacing ------------------------------------------------------

  /** Next word for a new target; avoids first letters already on screen. */
  word(maxLen?: number): string {
    const avoid = new Set(this.core.active.map((t) => t.word[0].toLowerCase()));
    return this.words.next(avoid, maxLen);
  }

  /** Seconds a target takes to reach the player, from difficulty and the child's rhythm. */
  travelTime(word: string): number {
    const d = this.difficulty;
    const cps = Math.max(0.5, this.ema * 0.85);
    const perChar = Math.min(2.2, Math.max(0.4, 1 / cps));
    return (9 - d * 0.5) * 0.55 + word.length * perChar + 2;
  }

  /** How many targets may be on screen at once. */
  get maxActive(): number {
    const d = this.difficulty;
    return d <= 2 ? 1 : d <= 5 ? 2 : d <= 8 ? 3 : 4;
  }

  /** Seconds between spawns. */
  get spawnGap(): number {
    return Math.max(0.8, 3.2 - this.difficulty * 0.25);
  }

  get vw(): number {
    return this.stage.vw;
  }

  sfx(s: Sfx): void {
    audio.sfx(s);
  }

  // ---- input -------------------------------------------------------------------

  private onRaw(code: string, key: string, shift: boolean): void {
    this.hadKeydown = true;
    if (this.mismatchShown) return;
    const other = this.mismatch.observe(code, key, shift);
    if (other) {
      this.mismatchShown = true;
      this.say(t('level.layoutHint', { layout: t(`layouts.${other}`) }), 7);
    }
  }

  private onChar(c: TypedChar): void {
    if (!this.started || this.paused || this.finished) return;
    if (c.ch === ' ') return;
    this.deadPending = false;
    const res = this.core.type(c.ch);
    const p = app.profile!;
    const since = Math.max(this.lastKey, this.readySince);
    const rt = since ? c.time - since : 1000;
    this.lastKey = c.time;
    if (res.kind === 'wrong') {
      if (res.expected) {
        recordPress(p, res.expected, c.ch, rt);
        this.errors++;
        this.trackWrong(res.expected);
      }
      this.sfx('wrong');
      this.setMood('thinking', 1.2);
      this.mode.onWrong(res.target);
    } else {
      recordPress(p, res.expected, c.ch, rt);
      this.chars++;
      this.wrongStreak.n = 0;
      const interval = Math.min(3, Math.max(0.12, rt / 1000));
      this.ema = this.ema * 0.85 + (1 / interval) * 0.15;
      if (res.kind === 'done') {
        this.sfx('word');
        this.wordStreak++;
        this.setMood('happy', 1.4);
        this.mode.onDone(res.target);
        this.cheer();
      } else {
        this.sfx('key');
        this.mode.onCorrect(res.target);
      }
    }
    this.updateGuide();
  }

  private trackWrong(expected: string): void {
    this.wordStreak = 0;
    if (this.wrongStreak.ch === expected) this.wrongStreak.n++;
    else this.wrongStreak = { ch: expected, n: 1 };
    if (this.wrongStreak.n === 3) this.offerDrill(expected);
  }

  private cheer(): void {
    const now = this.elapsed;
    if (this.wordStreak > 0 && this.wordStreak % 5 === 0 && now - this.lastCheer > 12) {
      this.lastCheer = now;
      const p = app.profile!;
      this.say(pickLine('piko.correct_streak', { name: p.name }, p.customMessages), 3);
    }
  }

  private offerDrill(ch: string): void {
    const finger = fingerFor(layout(), ch);
    const fingerName = finger != null ? t(`fingers.${FINGER_KEYS[finger]}`) : '';
    const hint = pickLine('piko.hint', { key: ch, finger: fingerName });
    if (this.opts.keys) {
      this.say(hint, 5);
      return;
    }
    const key = ch.toLowerCase();
    this.say(h('div', {},
      h('p', {}, hint),
      h('div', { class: 'bubble-actions' },
        button(t('piko.drillYes', { key }), () => { this.hideBubble(); void this.runDrill(key); }, 'btn small'),
        button(t('piko.drillNo'), () => this.hideBubble(), 'btn small ghost'))), 9);
  }

  private async runDrill(key: string): Promise<void> {
    this.paused = true;
    this.input?.dispose();
    await showDrill(this.el.querySelector<HTMLElement>('.stage-wrap')!, [key], 20, this.guide);
    if (this.disposed) return;
    this.input = new KeyInput(window, {
      onChar: (c) => this.onChar(c),
      onDead: () => { this.deadPending = true; this.updateGuide(); },
      onEscape: () => (this.paused ? this.resume() : this.pause()),
      onRaw: (code, k, shift) => this.onRaw(code, k, shift),
    });
    this.paused = false;
    this.wrongStreak.n = 0;
    this.readySince = performance.now();
    this.updateGuide();
  }

  updateGuide(): void {
    const ch = this.core.expectedChar();
    const p = app.profile!;
    let fade = 0;
    if (ch && p.settings.guide === 'auto') {
      const stat = p.stats.keys[ch.toLowerCase()];
      fade = masteryLevel(stat, p.settings.difficulty) >= 1 ? 0.65 : 0;
    }
    this.guide.show(ch, this.deadPending && stepsFor(layout(), ch ?? '').length > 1, fade);
  }

  private toggleGuide(): void {
    this.guideOn = !this.guideOn;
    this.guide.setVisible(this.guideOn);
    this.stage.resize();
  }

  // ---- Piko --------------------------------------------------------------------

  say(content: string | HTMLElement, seconds = 3.5): void {
    this.bubble.replaceChildren(typeof content === 'string' ? h('p', {}, content) : content);
    this.bubble.classList.remove('hidden');
    this.bubbleTimer = seconds;
  }

  hideBubble(): void {
    this.bubble.classList.add('hidden');
    this.bubbleTimer = 0;
  }

  setMood(mood: Mood, seconds: number): void {
    renderPikoInto(this.piko, app.profile!.companion, mood);
    this.piko.classList.remove('jump');
    if (mood === 'happy' && !this.reduceMotion) {
      void this.piko.offsetWidth;
      this.piko.classList.add('jump');
    }
    this.moodTimer = seconds;
  }

  // ---- pause -------------------------------------------------------------------

  pause(): void {
    if (this.paused || this.finished || !this.started) return;
    this.paused = true;
    this.pauseEl = h('div', { class: 'overlay pause-overlay' },
      h('div', { class: 'card' },
        h('h2', {}, t('level.paused')),
        h('div', { class: 'row' },
          button(t('level.resume'), () => this.resume(), 'btn primary', 'play'),
          button(t('level.toMap'), () => this.exit(), 'btn', 'map'))));
    this.el.append(this.pauseEl);
    (this.pauseEl.querySelector('button') as HTMLButtonElement).focus();
  }

  resume(): void {
    if (!this.paused || !this.pauseEl) return;
    this.pauseEl.remove();
    this.pauseEl = null;
    this.paused = false;
    this.lastKey = 0;
    this.readySince = performance.now();
  }

  private exit(): void {
    this.flushSession();
    this.opts.onExit();
  }

  private onVisibility(): void {
    if (document.hidden) this.pause();
  }

  private onTouch(e: PointerEvent): void {
    if (e.pointerType !== 'touch' || this.hadKeydown || document.querySelector('.touch-notice')) return;
    void showCard(this.el, h('div', { class: 'touch-notice' }, h('h2', {}, t('touch.title')), h('p', {}, t('touch.text'))), { button: t('common.ok') });
  }

  // ---- loop --------------------------------------------------------------------

  private update(dt: number): void {
    if (this.paused || !this.started) {
      this.tweens.update(this.paused ? 0 : dt);
      return;
    }
    this.elapsed += dt;
    if (!this.finished) app.sessionSeconds += dt;
    this.core.update(dt);
    this.tweens.update(dt);
    this.particles.update(dt);
    const hadFocus = !!this.core.focus();
    this.mode.t += dt;
    this.mode.update(dt);
    if (!hadFocus && this.core.focus()) this.readySince = performance.now();
    if (this.bubbleTimer > 0 && (this.bubbleTimer -= dt) <= 0) this.hideBubble();
    if (this.moodTimer > 0 && (this.moodTimer -= dt) <= 0) renderPikoInto(this.piko, app.profile!.companion, 'idle');
    this.progressFill.style.width = `${Math.round(this.mode.progress() * 100)}%`;
    const target = 0.9 + this.difficulty * 0.35;
    this.meter.style.width = `${Math.round(Math.min(1, this.ema / target) * 100)}%`;
    // Drift the rhythm down slowly while idle, so the meter is honest.
    if (performance.now() - this.lastKey > 2500) this.ema = Math.max(0.4, this.ema - dt * 0.05);
    if (this.core.expectedChar() !== this.lastExpected) {
      this.lastExpected = this.core.expectedChar();
      this.updateGuide();
    }
    if (this.mode.finished && !this.finished) this.finish();
  }

  private lastExpected: string | null = null;

  private render(): void {
    const g = this.stage.begin();
    drawBackground(g, this.mode.world, this.stage.vw, this.mode.scroll, !this.reduceMotion);
    this.mode.render(g);
    this.particles.render(g);
  }

  /** Word label above a target (helper for modes). */
  label(g: G, tg: Target, x: number, y: number, size = 40): void {
    drawWord(g, tg.word, tg.typed, x, y, tg.wobble, {
      size,
      highContrast: this.highContrast,
      dim: !tg.selectable,
      locked: this.core.locked === tg,
    });
  }

  // ---- end ---------------------------------------------------------------------

  private flushSession(): void {
    const p = app.profile!;
    if (this.chars + this.errors > 0) recordSession(p, this.elapsed, this.chars, this.errors, Math.round(this.ema * 60));
    this.elapsed = 0;
    this.chars = 0;
    this.errors = 0;
    saveProfile();
  }

  private finish(): void {
    this.finished = true;
    this.input?.dispose();
    this.input = null;
    this.guide.show(null);
    const p = app.profile!;
    const total = this.chars + this.errors;
    const accuracy = total ? this.chars / total : 1;
    const seconds = this.elapsed;
    const cpm = Math.round(this.ema * 60);
    const chars = this.chars, errors = this.errors;
    this.flushSession();
    if (this.def.kind === 'practice' && !this.def.count && total === 0) {
      this.opts.onFinish(null);
      return;
    }
    const result = completeLevel(p, this.def, { accuracy, chars, errors, cpm, seconds });
    saveProfile();
    this.sfx('reward');
    setTimeout(() => this.opts.onFinish(result), this.reduceMotion ? 300 : 900);
  }

  /** Ends an untimed practice on request. */
  endPractice(): void {
    if (!this.finished) this.finish();
  }
}

import { app, layout, pickLine, reduceMotion, saveProfile } from '../app/app';
import { audio, type Sfx } from '../audio/audio';
import { speech } from '../audio/speech';
import { Loop, Stage, VH } from '../engine/loop';
import { Particles } from '../engine/particles';
import { Rng } from '../engine/rng';
import { Tweens } from '../engine/tween';
import { drawBackground, drawWord, type G, wordBox } from '../gfx/draw';
import { type Mood, pawColors, pikoElement, renderPikoInto } from '../gfx/piko';
import { preload } from '../gfx/assets';
import { type RobotMood, type RobotState, drawRobot, robotFor } from '../gfx/robot';
import { t, tList } from '../i18n/i18n';
import { type InputHandlers, KeyInput, type TypedChar } from '../input/input';
import { LAYOUTS, LayoutMismatchDetector, fingerFor, stepsFor } from '../keyboard/layouts';
import { SHIFT_L, SHIFT_R, SPACE, activeKeys, isLetterKey, keysToIntroduce, masteryLevel, newestGroup, shiftKeyOf } from '../learning/lessons';
import { keyWeights, recordPress, recordSession } from '../learning/stats';
import { FINGER_KEYS, KeyboardGuide, keyLabel } from '../ui/keyboard-guide';
import { button, h } from '../ui/dom';
import { fullscreenButton, soundButton } from '../ui/chrome';
import { pawRingSvg, rhythmGauge } from '../ui/hud';
import { OWN_SHARE, WordSource, type WordSourceOwn } from '../words/words';
import type { Profile, Surprise } from '../storage/schema';
import type { LevelDef } from './levels';
import { WORLDS, storyOf } from './levels';
import type { Mode } from './mode';
import { PAW_MAX, PAW_STREAK, PAW_WORDS, isHardMoment } from './paw';
import { createMode } from './modes';
import { PressureValve, perChar } from './pace';
import { type LevelResult, completeLevel } from './progress';
import { type Target, TypingCore } from './typing';
import { pickTip, showCard, showNewKey, showPosture } from './cards';
import { surpriseFor } from './own-content';

/** A word label a mode asked for in this frame, at its object's anchor. */
interface PendingLabel {
  tg: Target;
  x: number;
  y: number;
  size: number;
}

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Space kept between two labels, and the move from which a line points back to the object. */
const LABEL_GAP = 6;
const LABEL_LINE_FROM = 30;
/** A long label shrinks to fit, down to this font size. */
const LABEL_MIN_SIZE = 28;
/** Seconds every target gets to be read. */
const READ_TIME = 3;
/** Extra seconds a target with a capital letter gets (the Shift chord is hard). */
const CAPITAL_EXTRA = 1.5;
/** Bolt's place next to the DOM Piko, in CSS pixels from the left, and his height in game units. */
const BOLT_CSS_X = 200;
const BOLT_SIZE = 150;

/**
 * The targets of a profile: its active keys (or a drill's, or the keys chosen for free practice),
 * weak keys more often, the newest group in focus, and the parent's own words and text mixed
 * in (not in drills or chosen keys, their words would bring other letters), or a task's.
 */
export function wordSource(p: Profile, drill?: string[], own?: WordSourceOwn, chosen?: string[]): WordSource {
  // Practice of space, punctuation or a Shift needs letters around it: the known ones.
  const keys = chosen ?? (!drill ? activeKeys(p) : drill.every(isLetterKey) ? drill : [...new Set([...activeKeys(p), ...drill])]);
  const s = p.settings;
  return new WordSource(app.words, {
    keys,
    len: s.wordLen,
    noDiacritics: s.noDiacritics,
    weights: keyWeights(p, keys),
    focus: drill ?? newestGroup(p).filter((k) => keys.includes(k)),
    layout: LAYOUTS[p.layout],
    names: tList('names'),
    shiftMastery: Object.fromEntries([SHIFT_L, SHIFT_R].map((k) => [k, masteryLevel(p.stats.keys[k], s.difficulty)])),
    own: drill || chosen ? undefined : own ?? { words: s.ownWords, text: s.ownText, share: OWN_SHARE[s.ownMix] },
  });
}

export interface RuntimeOptions {
  /** Practice: only these keys (drills), else the profile's active keys. */
  keys?: string[];
  /** Free practice: words only from these keys, chosen in the key picker. */
  chosen?: string[];
  /** Practice length in seconds; null = until the child stops. */
  seconds?: number | null;
  /** Own words and text instead of the parent's (a task's). */
  own?: WordSourceOwn;
  onFinish(result: LevelResult | null): void;
  onExit(): void;
  /** A click on Piko during play (the level pauses first). */
  onPiko(): void;
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
  /** The parent's surprise rule asked on the get-ready card of this run, when one waits. */
  readonly surprise: Surprise | null;
  /** The profile's difficulty; "Slower" in the pause lowers it during the level. */
  difficulty: number;
  readonly noPressure: boolean;
  readonly highContrast: boolean;
  readonly reduceMotion: boolean;
  readonly el: HTMLElement;
  /** Bolt walks with Piko in story 2 levels and its rescue missions (with his final look); null elsewhere. */
  readonly robot: RobotState | null;
  private robotMood: RobotMood = 'idle';
  private robotMoodT = 0;

  private loop: Loop;
  private input: KeyInput | null = null;
  private guide: KeyboardGuide;
  private guideOn: boolean;
  private piko: HTMLElement;
  private bubble: HTMLElement;
  private bubbleTimer = 0;
  private progressFill: HTMLElement;
  private gauge = rhythmGauge();
  /** Seconds until the gauge's spoken label may change again. */
  private gaugeLabelIn = 0;
  private pauseEl: HTMLElement | null = null;
  private paused = false;
  /** Play began (the preparation cards are done). */
  started = false;
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
  /** Rhythm of the last session (characters per second), the pace before the child's own words. */
  private readonly lastCps: number;
  /** Seconds per character of each target the child finished, reading and the first key included. */
  private paceSamples: number[] = [];
  /** Level time when each visible target became selectable. */
  private shownAt = new Map<number, number>();
  private valve = new PressureValve();
  /** Targets the child typed, and the misses already given to the valve. */
  private typedTargets = 0;
  private missesSeen = 0;

  /** Paw help: the HUD button, words Piko still types, seconds to his next key. */
  private pawBtn: HTMLButtonElement | null = null;
  private pawWords = 0;
  private pawTimer = 0;
  private pawIdle = 0;
  /** Piko started the current paw help by himself (auto mode), so the button pulses. */
  private pawSelf = false;
  private guideBeforePaws = true;
  /** Seconds each visible word has been on screen (for the automatic help). */
  private seen = new Map<number, number>();

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
    this.lastCps = this.ema;
    this.mismatch = new LayoutMismatchDetector(p.layout);

    const lay = LAYOUTS[p.layout];
    this.words = wordSource(p, opts.keys, opts.own, opts.chosen);
    this.surprise = surpriseFor(p, def, !!opts.keys);

    // DOM: HUD, stage, Piko, bubble, guide.
    this.el = h('div', { class: `level-screen world-${WORLDS[def.world]}` });
    this.robot = def.kind !== 'practice' && storyOf(def.world).id === 'robot' ? robotFor(def.id === 'rescue' ? WORLDS.length - 1 : def.world) : null;
    if (this.robot) this.el.dataset.bolt = this.robot.look;
    this.progressFill = h('div', { class: 'progress-fill' });
    const title = def.kind === 'practice' ? t(def.phrases ? 'level.ownText' : 'level.practice') : def.id === 'rescue' ? t('level.rescue') : t('level.title', { world: def.world + 1, level: def.index + 1 });
    const guideBtn = button('', () => this.toggleGuide(), 'icon-btn', 'keyboard');
    guideBtn.title = t('level.guide');
    guideBtn.setAttribute('aria-label', t('level.guide'));
    if (p.settings.guideLocked) guideBtn.disabled = true;
    this.readBtn = button('', () => this.toggleRead(), 'icon-btn read-btn', 'read');
    this.readBtn.title = t('level.read');
    this.readBtn.setAttribute('aria-label', t('level.read'));
    this.paintRead();
    this.offVoices = speech.onVoices(() => this.paintRead());
    const pauseBtn = button('', () => this.pause(), 'icon-btn', 'pause');
    pauseBtn.setAttribute('aria-label', t('level.pause'));
    if (this.pawsAllowed) {
      this.pawBtn = h('button', { class: 'icon-btn paw-btn', type: 'button', onClick: () => this.startPaws() });
      this.pawBtn.title = t('paw.title', { n: PAW_STREAK, words: PAW_WORDS, piko: p.companion.name });
      this.renderPawBtn();
    }
    const hud = h('div', { class: 'hud' },
      pauseBtn,
      this.pawBtn,
      h('div', { class: 'hud-title' }, title),
      h('div', { class: 'progress', title: t('level.progress') }, this.progressFill),
      this.gauge.el,
      this.readBtn, guideBtn, soundButton(), fullscreenButton());
    const stageWrap = h('div', { class: 'stage-wrap' });
    this.piko = pikoElement(p.companion, 'idle', 150);
    // Piko joins the stage when play starts; the preparation cards show him themselves.
    this.piko.classList.add('level-piko', 'waiting');
    this.piko.title = t('piko.statsHint');
    this.piko.addEventListener('click', () => {
      if (this.finished || !this.started) return;
      this.pause();
      this.opts.onPiko();
    });
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

  /** Story levels and rescue missions; free practice and drills count every key. */
  get pawsAllowed(): boolean {
    return this.def.kind !== 'practice' && !this.opts.keys;
  }

  get pikoOnStage(): boolean {
    return ['swamp', 'signs', 'boulder', 'doors', 'gate', 'rooms'].includes(this.def.kind);
  }

  /** Preparation: assets, new keys, the get-ready card with the tip and its password, then play. */
  private async prepare(): Promise<void> {
    const p = app.profile!;
    await preload([`bg-${this.mode.world}-far`, `bg-${this.mode.world}-mid`, `bg-${this.mode.world}-near`]);
    if (this.disposed) return;
    audio.music(this.def.kind === 'practice' ? app.menuTrack : this.mode.world);
    const host = this.el.querySelector<HTMLElement>('.stage-wrap')!;
    let tip: string | undefined;
    if (!app.tipShown && !this.opts.keys) {
      app.tipShown = true;
      tip = pickTip(p)?.text;
      saveProfile();
    }
    for (const key of this.opts.keys ? [] : keysToIntroduce(p)) {
      if (this.disposed) return;
      await showNewKey(host, key, layout(), this.guide, p);
      p.progress.introducedKeys.push(key);
      saveProfile();
    }
    if (this.disposed) return;
    if (!this.opts.keys && await showPosture(host, p, tip, this.surprise) === 'cancel') return this.exit();
    if (this.disposed) return;
    this.mode.start();
    this.started = true;
    this.piko.classList.remove('waiting');
    this.readySince = performance.now();
    this.input = new KeyInput(window, this.handlers());
    this.updateGuide();
  }

  private handlers(): InputHandlers {
    return {
      onChar: (c) => this.onChar(c),
      onDead: () => { this.deadPending = true; this.updateGuide(); },
      onEscape: () => (this.paused ? this.resume() : this.pause()),
      onRaw: (code, key, shift) => this.onRaw(code, key, shift),
      onEnter: () => this.startPaws(),
      onBackspace: () => this.togglePawAuto(),
    };
  }

  private disposed = false;

  dispose(): void {
    // Leaving by the browser's back button still keeps the time and keys typed.
    if (this.started && !this.finished) this.flushSession();
    this.disposed = true;
    speech.stop();
    this.offVoices();
    this.loop.stop();
    this.input?.dispose();
    this.stage.dispose();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointerdown', this.onTouch);
  }

  // ---- words and pacing ------------------------------------------------------

  /** Next target (a word, or a phrase of up to `words` words); avoids first letters already on screen. */
  word(maxLen?: number, words = this.mode.phraseWords): string {
    const avoid = new Set(this.core.active.map((t) => t.word[0].toLowerCase()));
    return this.words.next(avoid, maxLen, words);
  }

  /**
   * Seconds a target takes to reach the player: difficulty, the child's word pace (reading
   * included) and time to read it; a capital gets more, and the pressure valve slows it down.
   */
  travelTime(word: string): number {
    const base = (9 - this.difficulty * 0.5) * 0.55;
    const read = READ_TIME + (/\p{Lu}/u.test(word) ? CAPITAL_EXTRA : 0);
    return (base + word.length * perChar(this.paceSamples, this.lastCps) + read) * this.valve.factor;
  }

  /** How many targets may be on screen at once. */
  get maxActive(): number {
    const d = this.difficulty;
    return d <= 3 ? 1 : d <= 6 ? 2 : d <= 9 ? 3 : 4;
  }

  /** Seconds between spawns. */
  get spawnGap(): number {
    return Math.max(1.2, 3.6 - this.difficulty * 0.25);
  }

  /** Word pace and valve: visible targets get their start time, misses slow the level down. */
  private trackPace(): void {
    const shown = new Map<number, number>();
    for (const tg of this.core.active) if (tg.selectable) shown.set(tg.id, this.shownAt.get(tg.id) ?? this.elapsed);
    this.shownAt = shown;
    for (; this.missesSeen < this.core.missed; this.missesSeen++) this.valve.miss();
  }

  /** A target the child typed (not Piko's paws). */
  private targetTyped(tg: Target): void {
    const since = this.shownAt.get(tg.id);
    if (since != null) this.paceSamples.push((this.elapsed - since) / tg.word.length);
    this.typedTargets++;
    this.valve.hit();
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
    if (!this.started || this.paused || this.finished || this.pawWords) return;
    // A space between targets is a habit, not a mistake.
    if (c.ch === SPACE && !this.core.locked) return;
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
      this.setRobotMood('worried', 1);
      this.mode.onWrong(res.target);
    } else {
      recordPress(p, res.expected, c.ch, rt);
      this.checkShiftHand(res.expected, c.shiftCode);
      this.chars++;
      this.wrongStreak.n = 0;
      const interval = Math.min(3, Math.max(0.12, rt / 1000));
      this.ema = this.ema * 0.85 + (1 / interval) * 0.15;
      if (res.kind === 'done') {
        this.sfx('word');
        this.targetTyped(res.target);
        this.wordStreak++;
        this.setMood('happy', 1.4);
        this.setRobotMood('happy', 1.2);
        this.mode.onDone(res.target);
        this.cheer();
        if (this.pawsAllowed && this.wordStreak % PAW_STREAK === 0) this.chargePaw();
      } else {
        this.sfx('key');
        this.mode.onCorrect(res.target);
      }
    }
    this.updateGuide();
  }

  /** Once per level: a capital typed with the Shift of its own hand gets a short tip. */
  private checkShiftHand(ch: string, shiftCode: string | null): void {
    const need = shiftKeyOf(layout(), ch);
    if (!need || !shiftCode || this.shiftTipShown) return;
    if (shiftCode === (need === SHIFT_L ? 'ShiftLeft' : 'ShiftRight')) return;
    this.shiftTipShown = true;
    this.say(t('level.shiftOtherHand'), 4);
  }

  private shiftTipShown = false;

  private trackWrong(expected: string): void {
    this.wordStreak = 0;
    if (this.wrongStreak.ch === expected) this.wrongStreak.n++;
    else this.wrongStreak = { ch: expected, n: 1 };
    if (this.wrongStreak.n === 2) this.say(pickLine('piko.mistake'), 2);
    if (this.wrongStreak.n === 3) this.showHint(expected);
  }

  private cheer(): void {
    const now = this.elapsed;
    if (this.wordStreak > 0 && this.wordStreak % 5 === 0 && now - this.lastCheer > 12) {
      this.lastCheer = now;
      const p = app.profile!;
      this.say(pickLine('piko.correct_streak', { name: p.name }, p.customMessages), 3);
    }
  }

  /** After three misses of one key Piko shows which key and finger it is. */
  private showHint(ch: string): void {
    const finger = fingerFor(layout(), ch);
    const fingerName = finger != null ? t(`fingers.${FINGER_KEYS[finger]}`) : '';
    this.say(pickLine('piko.hint', { key: keyLabel(ch), finger: fingerName }), 5);
  }

  updateGuide(): void {
    const ch = this.core.expectedChar();
    const p = app.profile!;
    let fade = 0;
    if (ch && p.settings.guide === 'auto') {
      const stat = p.stats.keys[ch.toLowerCase()];
      fade = masteryLevel(stat, p.settings.difficulty) >= 1 ? 0.5 : 0;
    }
    this.guide.show(ch, this.deadPending && stepsFor(layout(), ch ?? '').length > 1, fade);
  }

  private toggleGuide(): void {
    this.guideOn = !this.guideOn;
    this.guide.setVisible(this.guideOn);
    this.stage.resize();
  }

  // ---- reading aloud -----------------------------------------------------------

  private readBtn: HTMLButtonElement;
  private offVoices: () => void;
  /** The target read last, so each one is read once, when it becomes the focus. */
  private readId = 0;

  private get reading(): boolean {
    const p = app.profile!;
    return p.settings.readAloud && speech.available(p.language);
  }

  /** The button shows only when the browser has a voice of the profile's language. */
  private paintRead(): void {
    const p = app.profile!;
    this.readBtn.hidden = !speech.available(p.language);
    this.readBtn.setAttribute('aria-pressed', String(p.settings.readAloud));
  }

  private toggleRead(): void {
    const p = app.profile!;
    p.settings.readAloud = !p.settings.readAloud;
    saveProfile();
    this.paintRead();
    this.readId = 0;
    if (!p.settings.readAloud) speech.stop();
    else this.readFocus();
  }

  private readFocus(): void {
    const tg = this.core.focus();
    if (!tg || tg.id === this.readId || this.pawWords || !this.started || this.paused) return;
    this.readId = tg.id;
    if (this.reading) speech.say(tg.word, app.profile!.language);
  }

  // ---- Piko --------------------------------------------------------------------

  /** Piko's line in the bubble; only screen readers hear it, the voice reads the targets alone. */
  say(text: string, seconds = 3.5): void {
    this.bubble.replaceChildren(h('p', {}, text));
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

  // ---- Bolt --------------------------------------------------------------------

  setRobotMood(mood: RobotMood, seconds: number): void {
    this.robotMood = mood;
    this.robotMoodT = seconds;
  }

  /** Bolt's feet: where the mode puts him, else next to Piko. */
  boltSpot(): { x: number; y: number } {
    return this.mode.boltSpot() ?? { x: BOLT_CSS_X / this.stage.scale, y: VH - 6 };
  }

  /** Bolt on the canvas, under the mode's objects; he runs off with Piko at the end. */
  private drawBolt(g: G): void {
    const { x, y } = this.boltSpot();
    const run = this.exitRun;
    if (run == null) return drawRobot(g, this.robot!, this.robotMood, x, y, BOLT_SIZE, this.mode.t);
    if (this.reduceMotion) return drawRobot(g, this.robot!, 'happy', x, y, BOLT_SIZE, this.mode.t, 1 - run);
    drawRobot(g, this.robot!, 'happy', x + (this.vw + 150 - x) * run * run, y - Math.abs(Math.sin(run * Math.PI * 4)) * 20, BOLT_SIZE, this.mode.t);
  }

  // ---- paw help ------------------------------------------------------------------

  private renderPawBtn(): void {
    if (!this.pawBtn) return;
    const p = app.profile!;
    const { pawHelp } = p.progress;
    this.pawBtn.classList.toggle('empty', pawHelp === 0);
    this.pawBtn.classList.toggle('auto-helping', this.pawSelf && this.pawWords > 0);
    this.pawBtn.dataset.charged = String(pawHelp);
    this.pawBtn.setAttribute('aria-label', t('paw.aria', { n: pawHelp }));
    this.pawBtn.innerHTML = pawRingSvg(pawHelp, PAW_MAX, pawColors(p.companion.kind)[0]);
  }

  /** A mistake-free streak charges one paw help. */
  private chargePaw(): void {
    const p = app.profile!;
    if (p.progress.pawHelp >= PAW_MAX) return;
    p.progress.pawHelp++;
    saveProfile();
    this.say(t(p.progress.pawAuto ? 'paw.chargedAuto' : 'paw.charged', { n: PAW_STREAK, words: PAW_WORDS }), 4);
    this.renderPawBtn();
    this.pawBtn?.classList.remove('charged');
    void this.pawBtn?.offsetWidth;
    this.pawBtn?.classList.add('charged');
  }

  private togglePawAuto(): void {
    if (!this.pawsAllowed || !this.started || this.paused || this.finished) return;
    const p = app.profile!;
    p.progress.pawAuto = !p.progress.pawAuto;
    saveProfile();
    this.say(t(p.progress.pawAuto ? 'paw.autoOn' : 'paw.autoOff', { words: PAW_WORDS }), 3);
    this.renderPawBtn();
  }

  /** Piko's paws replace the hands and type the closest words for the child. */
  private startPaws(self = false): boolean {
    const p = app.profile!;
    if (!this.pawsAllowed || !this.started || this.paused || this.finished || this.pawWords) return false;
    if (p.progress.pawHelp <= 0 || !this.core.focus()) return false;
    p.progress.pawHelp--;
    saveProfile();
    this.pawWords = PAW_WORDS;
    this.pawTimer = this.reduceMotion ? 0.2 : 0.6;
    this.pawIdle = 0;
    this.pawSelf = self;
    this.guideBeforePaws = this.guideOn;
    if (!this.guideOn) this.toggleGuide();
    this.guide.setPaws(pawColors(p.companion.kind));
    this.say(t('paw.start', { piko: p.companion.name }), 2.5);
    this.setMood('happy', 1.4);
    this.renderPawBtn();
    return true;
  }

  private stopPaws(): void {
    this.pawWords = 0;
    this.pawSelf = false;
    this.renderPawBtn();
    this.guide.setPaws(null);
    if (this.guideOn !== this.guideBeforePaws) this.toggleGuide();
    // The child's next reaction time starts now, not with Piko's last key.
    this.lastKey = 0;
    this.readySince = performance.now();
    this.updateGuide();
  }

  private updatePaws(dt: number): void {
    const seen = new Map<number, number>();
    for (const tg of this.core.active) if (tg.selectable) seen.set(tg.id, (this.seen.get(tg.id) ?? 0) + dt);
    this.seen = seen;
    if (this.pawWords) return this.pikoTypes(dt);
    const p = app.profile!;
    if (p.progress.pawAuto && p.progress.pawHelp > 0 &&
      isHardMoment(this.core.targets, this.core.locked, (tg) => this.seen.get(tg.id) ?? 0, (tg) => this.travelTime(tg.word), this.maxActive)) {
      this.startPaws(true);
    }
  }

  /** One key at a time, with Piko's rhythm; none of it counts in the child's statistics. */
  private pikoTypes(dt: number): void {
    if ((this.pawTimer -= dt) > 0) return;
    const tg = this.core.focus();
    if (!tg) {
      // Wait a moment for the next word; stop when none comes.
      this.pawTimer = 0.2;
      if ((this.pawIdle += 0.2) > 4) this.stopPaws();
      return;
    }
    this.pawIdle = 0;
    const ch = tg.word[tg.typed];
    this.core.locked = tg;
    const res = this.core.type(ch);
    this.guide.pawTap(ch);
    if (res.kind === 'done') {
      this.sfx('word');
      this.mode.onDone(tg);
      this.pawTimer = 0.4;
      if (--this.pawWords === 0) this.stopPaws();
    } else {
      this.sfx('key');
      this.mode.onCorrect(tg);
      this.pawTimer = 0.13;
    }
    this.updateGuide();
  }

  // ---- pause -------------------------------------------------------------------

  pause(): void {
    if (this.paused || this.finished || !this.started) return;
    this.paused = true;
    speech.stop();
    // A small card at the top: the words and the guide's next key stay in sight.
    const slower = button(t('level.slower'), () => this.slowDown(), 'btn');
    slower.disabled = this.difficulty <= 1;
    this.pauseEl = h('div', { class: 'card pause-card', role: 'dialog', 'aria-label': t('level.paused') },
      h('h2', {}, t('level.paused')),
      h('div', { class: 'row' },
        button(t('level.resume'), () => this.resume(), 'btn primary', 'play'),
        slower,
        button(t('level.toMap'), () => this.exit(), 'btn', 'map')));
    this.el.querySelector('.stage-wrap')!.append(this.pauseEl);
    (this.pauseEl.querySelector('button') as HTMLButtonElement).focus();
  }

  /** One step lower difficulty from now on; automatic growth may raise it again after accurate play. */
  private slowDown(): void {
    const p = app.profile!;
    this.difficulty = Math.max(1, this.difficulty - 1);
    p.settings.difficulty = this.difficulty;
    p.progress.growthSeconds = 0;
    saveProfile();
    this.resume();
    this.say(t('level.slowerSaid'), 3);
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
    speech.stop();
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
    this.trackPace();
    if (this.pawsAllowed) this.updatePaws(dt);
    this.readFocus();
    if (this.bubbleTimer > 0 && (this.bubbleTimer -= dt) <= 0) this.hideBubble();
    if (this.moodTimer > 0 && (this.moodTimer -= dt) <= 0) renderPikoInto(this.piko, app.profile!.companion, 'idle');
    if (this.robotMoodT > 0 && (this.robotMoodT -= dt) <= 0) this.robotMood = 'idle';
    this.progressFill.style.width = `${Math.round(this.mode.progress() * 100)}%`;
    const target = 0.9 + this.difficulty * 0.35;
    this.gauge.set(this.ema / target);
    if ((this.gaugeLabelIn -= dt) <= 0) {
      this.gaugeLabelIn = 1;
      this.gauge.label(t('level.rhythm', { n: Math.round(this.ema * 60) }));
    }
    // Drift the rhythm down slowly while idle, so the gauge is honest.
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
    if (this.robot) this.drawBolt(g);
    this.labels = [];
    this.labelRects = [];
    this.mode.render(g);
    this.drawLabels(g);
    this.particles.render(g);
    this.placeBubble();
  }

  private labels: PendingLabel[] = [];
  /** Where this frame's labels were drawn, in stage units. */
  private labelRects: Rect[] = [];
  /** Vertical shift of each target's label, smoothed over frames. */
  private labelShift = new Map<number, number>();
  private labelTime = 0;

  /**
   * Word label above a target (helper for modes); drawn after the mode, so labels never overlap.
   * A word the child sees can be typed at once, so a target not selectable yet gets no label.
   */
  label(_g: G, tg: Target, x: number, y: number, size = 40): void {
    if (tg.selectable) this.labels.push({ tg, x, y, size });
  }

  /**
   * The locked and most urgent labels keep their place; each later one moves up (down
   * near the top) until it is clear of the placed ones. Far moves get a line to the object.
   */
  private drawLabels(g: G): void {
    const now = performance.now();
    const dt = this.labelTime ? Math.min(0.1, (now - this.labelTime) / 1000) : 0;
    this.labelTime = now;
    // 0.25 of the way per frame at 60 Hz, the same at any frame rate.
    const follow = 1 - Math.pow(0.75, dt * 60);
    const rank = (l: PendingLabel) => (this.core.locked === l.tg ? Infinity : l.tg.urgency);
    const placed: Rect[] = [];
    const shifts = new Map<number, number>();
    for (const l of [...this.labels].sort((a, b) => rank(b) - rank(a))) {
      // Phrases shrink to fit: in calm modes the stage around their place, moving targets half of it.
      const room = this.mode.phraseWords > 2 ? Math.min(this.vw * 0.9, 2 * Math.min(l.x, this.vw - l.x) - 20) : this.vw * 0.5;
      const full = wordBox(g, l.tg.word, l.size).w;
      if (full > room) l.size = Math.max(LABEL_MIN_SIZE, Math.min(l.size, l.size * room / full));
      const { w, h } = wordBox(g, l.tg.word, l.size);
      const x0 = l.x - w / 2 - LABEL_GAP, x1 = l.x + w / 2 + LABEL_GAP;
      const clear = (dy: number) => placed.every((b) => x1 <= b.x0 || x0 >= b.x1 || l.y + dy + h / 2 + LABEL_GAP <= b.y0 || l.y + dy - h / 2 - LABEL_GAP >= b.y1);
      let want = 0;
      if (!clear(0)) {
        const up = Array.from({ length: Math.max(0, Math.floor((l.y - h / 2) / 4)) }, (_, i) => -(i + 1) * 4).find(clear);
        want = up ?? Array.from({ length: Math.max(0, Math.floor((VH - l.y - h / 2) / 4)) }, (_, i) => (i + 1) * 4).find(clear) ?? 0;
      }
      placed.push({ x0: x0 + LABEL_GAP, x1: x1 - LABEL_GAP, y0: l.y + want - h / 2, y1: l.y + want + h / 2 });
      const prev = this.labelShift.get(l.tg.id);
      const shift = prev == null ? want : prev + (want - prev) * follow;
      shifts.set(l.tg.id, shift);
      this.labelRects.push({ x0: l.x - w / 2, x1: l.x + w / 2, y0: l.y + shift - h / 2, y1: l.y + shift + h / 2 });
      if (Math.abs(shift) > LABEL_LINE_FROM) {
        g.save();
        g.strokeStyle = 'rgba(255,253,246,0.7)';
        g.lineWidth = 2;
        g.setLineDash([4, 5]);
        g.beginPath();
        g.moveTo(l.x, l.y + shift + (shift < 0 ? h / 2 : -h / 2));
        g.lineTo(l.x, l.y);
        g.stroke();
        g.restore();
      }
      drawWord(g, l.tg.word, l.tg.typed, l.x, l.y + shift, l.tg.wobble, {
        size: l.size,
        highContrast: this.highContrast,
        locked: this.core.locked === l.tg,
      });
    }
    this.labelShift = shifts;
  }

  /**
   * The word is the task, so Piko's bubble never covers one: over a label it moves to its
   * second spot (top left), and when that is covered too it hides until a spot is free.
   */
  private placeBubble(): void {
    const b = this.bubble;
    if (b.classList.contains('hidden')) return;
    const s = this.stage.scale;
    const covers = () => {
      const x0 = b.offsetLeft / s - LABEL_GAP, x1 = (b.offsetLeft + b.offsetWidth) / s + LABEL_GAP;
      const y0 = b.offsetTop / s - LABEL_GAP, y1 = (b.offsetTop + b.offsetHeight) / s + LABEL_GAP;
      return this.labelRects.some((r) => r.x0 < x1 && r.x1 > x0 && r.y0 < y1 && r.y1 > y0);
    };
    b.classList.remove('top', 'covered');
    if (!covers()) return;
    b.classList.add('top');
    if (covers()) b.classList.add('covered');
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
    if (this.pawWords) this.stopPaws();
    this.input?.dispose();
    this.input = null;
    this.guide.show(null);
    const p = app.profile!;
    const total = this.chars + this.errors;
    const accuracy = total ? this.chars / total : 1;
    const seconds = this.elapsed;
    const cpm = Math.round(this.ema * 60);
    const chars = this.chars, errors = this.errors;
    // Targets Piko's paws typed count neither way.
    const resolved = this.typedTargets + this.core.missed;
    const typedShare = resolved ? this.typedTargets / resolved : 1;
    this.flushSession();
    if (this.def.kind === 'practice' && !this.def.count && total === 0) {
      this.opts.onFinish(null);
      return;
    }
    const result = completeLevel(p, this.def, { accuracy, chars, errors, cpm, seconds }, typedShare);
    saveProfile();
    this.sfx('reward');
    this.runOff();
    // Leaving during the run-off (back button, map) must not open the results.
    setTimeout(() => { if (!this.disposed) this.opts.onFinish(result); }, this.reduceMotion ? 300 : 900);
  }

  private runOffStart = 0;

  /** 0..1 while Piko runs off at the end of the level, else null (modes with a canvas Piko read it). */
  get exitRun(): number | null {
    if (!this.runOffStart) return null;
    return Math.min(1, (performance.now() - this.runOffStart) / (this.reduceMotion ? 250 : 900));
  }

  /** Piko runs off to the right edge with small hops before the results card; a quick fade with reduced motion. */
  private runOff(): void {
    this.runOffStart = performance.now();
    this.hideBubble();
    if (this.pikoOnStage) return;
    // Web animations: the reduced-motion CSS rules would cut a CSS animation to nothing.
    if (this.reduceMotion) {
      this.piko.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
      return;
    }
    const hop = (x: number, y: number) => ({ transform: `translate(${x}vw, ${-y}px)` });
    this.piko.animate([hop(0, 0), hop(3, 28), hop(12, 0), hop(28, 24), hop(50, 0), hop(75, 18), hop(105, 0)], { duration: 900, easing: 'ease-in', fill: 'forwards' });
  }

  /** Ends an untimed practice on request. */
  endPractice(): void {
    if (!this.finished) this.finish();
  }
}

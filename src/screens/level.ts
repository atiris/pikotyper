import { app, go, pickLine, saveProfile } from '../app/app';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { t, tList } from '../i18n/i18n';
import { LEVELS, type LevelDef, WORLDS, levelById, practiceLevel, rescueLevel } from '../game/levels';
import type { LevelResult } from '../game/progress';
import { WORLD_REWARDS } from '../game/rewards';
import { LevelRuntime } from '../game/runtime';
import { localDate } from '../learning/stats';
import { button, h } from '../ui/dom';
import { keyLabel } from '../ui/keyboard-guide';
import { medal } from '../ui/medal';
import { playLevel } from './map';

interface LevelParams {
  id: string;
  /** Drill keys (practice now). */
  keys?: string[];
  seconds?: number;
}

export function levelScreen(root: HTMLElement, params: LevelParams): () => void {
  const p = app.profile!;
  let def: LevelDef;
  if (params.id === 'practice') def = practiceLevel(params.seconds ?? null);
  else if (params.id === 'rescue') def = rescueLevel(p.progress.dragons.length * 7 + Math.floor(Math.random() * 5));
  else def = levelById(params.id) ?? LEVELS[0];
  let rt: LevelRuntime;
  const exit = () => go('map');
  rt = new LevelRuntime(root, def, {
    keys: params.keys,
    seconds: params.seconds ?? null,
    onExit: exit,
    onFinish: (result) => {
      if (!result) return exit();
      showResults(root, def, result, params);
    },
  });
  if (def.kind === 'practice' && !params.seconds) {
    // Untimed practice ends when the child wants.
    root.querySelector('.hud')!.append(button(t('practice.finish'), () => rt.endPractice(), 'btn small'));
  }
  return () => rt.dispose();
}

const DRAGON_NAMES_FALLBACK = ['Iskra', 'Mäta', 'Luna', 'Bubu'];

function showResults(root: HTMLElement, def: LevelDef, r: LevelResult, params: LevelParams): void {
  const p = app.profile!;
  let rescued: { name: string; hue: number } | null = null;
  if (def.id === 'rescue') {
    const names = tList('dragonNames');
    const pool = names.length ? names : DRAGON_NAMES_FALLBACK;
    rescued = { name: pool[p.progress.dragons.length % pool.length], hue: Math.floor(Math.random() * 360) };
    p.progress.dragons.push({ ...rescued, date: localDate() });
    saveProfile();
  }
  const star = imageUrl('ui-star'), empty = imageUrl('ui-star-empty');
  const stars = h('div', { class: 'stars', role: 'img', 'aria-label': t('results.starsAria', { n: r.stars }) },
    ...[1, 2, 3].map((i) => {
      const on = i <= r.stars;
      const src = on ? star : empty;
      return src ? h('img', { class: `star ${on ? 'on' : ''}`, src, alt: '', style: `--i:${i}` }) : h('span', { class: `star-fallback ${on ? 'on' : ''}`, style: `--i:${i}` }, '★');
    }));
  const lines: HTMLElement[] = [
    h('p', { class: 'big-line' }, r.byPiko ? t('results.byPiko', { piko: p.companion.name }) : t('results.accuracy', { n: Math.round(r.accuracy * 100) })),
  ];
  if (r.cpm > 0) lines.push(h('p', {}, t('results.rhythm', { n: r.cpm })));
  if (r.trend && r.trend > 1.05) lines.push(h('p', { class: 'good' }, t('results.trendUp')));
  for (const k of r.newKeys) lines.push(h('p', { class: 'new-key' }, t('results.newKey', { key: keyLabel(k) })));
  if (r.newAccessories.length) lines.push(h('p', { class: 'new-acc' }, t('results.newAccessory', { n: r.newAccessories.length })));
  for (const kind of r.newCompanions) lines.push(h('p', { class: 'new-acc' }, t('results.newCompanion', { kind: t(`kinds.${kind}`) })));
  if (rescued) lines.push(h('p', { class: 'good' }, t('results.rescued', { name: rescued.name })));
  if (r.growth) {
    lines.push(h('div', { class: 'growth' }, medal(r.growth.medal),
      h('p', {}, h('b', {}, t('results.growthTitle')), h('br'),
        r.growth.kind === 'difficulty' ? t('results.growthDifficulty') : t('results.growthWordLen', { n: r.growth.value }))));
  }
  const sentence = pickLine('piko.level_done', { name: p.name }, p.customMessages);

  const actions = h('div', { class: 'row center' });
  const breakDue = app.sessionSeconds >= p.settings.sessionMinutes * 60;
  const nextDef = def.index >= 0 && !def.isSuper ? LEVELS.find((l) => l.world === def.world && l.index === def.index + 1) : undefined;
  if (breakDue) actions.append(button(t('results.takeBreak'), () => go('break'), 'btn primary', 'play'));
  if (r.worldDone !== null) {
    actions.append(button(t('results.reward'), () => go('story', { scene: WORLD_REWARDS[r.worldDone!], next: 'map' }), `btn ${breakDue ? '' : 'primary'}`, 'star'));
  } else if (nextDef) {
    actions.append(button(t('results.next'), () => playLevel(nextDef.id), `btn ${breakDue ? '' : 'primary'}`, 'next'));
  } else if (def.id === 'rescue') {
    actions.append(button(t('results.nextRescue'), () => go('level', { id: 'rescue' }), `btn ${breakDue ? '' : 'primary'}`, 'rescue'));
  }
  actions.append(button(t('results.replay'), () => go('level', params), 'btn', 'replay'));
  actions.append(button(t('level.toMap'), () => go('map'), 'btn ghost', 'map'));

  const card = h('div', { class: 'card results-card' },
    h('h2', {}, def.kind === 'practice' ? t('results.practiceDone') : t('results.title')),
    def.kind === 'practice' ? null : stars,
    h('div', { class: 'results-body' },
      h('div', { class: 'results-piko' }, pikoElement(p.companion, 'happy', 140), h('p', { class: 'bubble static' }, breakDue ? pickLine('piko.break') : sentence)),
      h('div', { class: 'results-lines' }, ...lines)),
    ...teaser(def, !!nextDef && r.worldDone === null, p.companion.name),
    actions);
  const overlay = h('div', { class: 'overlay results' }, card);
  root.querySelector('.level-screen')!.append(overlay);
  (actions.querySelector('button') as HTMLButtonElement).focus();
}

/**
 * Piko's curious question about the next level, answered only after that level is
 * finished, so the child wants to go on. Story levels only.
 */
function teaser(def: LevelDef, hasNext: boolean, piko: string): HTMLElement[] {
  if (def.index < 0) return [];
  const world = WORLDS[def.world];
  const answer = def.index > 0 ? tList(`teaser.${world}.a`)[def.index - 1] : undefined;
  const question = hasNext ? tList(`teaser.${world}.q`)[def.index] : undefined;
  const out: HTMLElement[] = [];
  if (answer) out.push(h('p', { class: 'teaser answer' }, h('b', {}, t('teaser.answer')), ' ', answer));
  if (question) out.push(h('p', { class: 'teaser ask' }, h('b', {}, t('teaser.ask', { piko })), ' ', question, h('br'), h('small', {}, t('teaser.later'))));
  return out;
}

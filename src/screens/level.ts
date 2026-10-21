import { app, go, pickLine, saveProfile } from '../app/app';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { t, tList } from '../i18n/i18n';
import { LEVELS, type LevelDef, WORLDS, levelById, practiceLevel, rescueLevel, storyOf } from '../game/levels';
import type { LevelResult } from '../game/progress';
import { WORLD_REWARDS } from '../game/rewards';
import { LevelRuntime } from '../game/runtime';
import { surpriseAsk } from '../game/cards';
import { surpriseReached, teaserLines } from '../game/own-content';
import { ownTextPhrases } from '../game/modes/practice';
import type { Friend, Profile, Surprise, Task } from '../storage/schema';
import { recordTaskRun, taskOwn } from '../share/task';
import { localDate } from '../learning/stats';
import { button, h } from '../ui/dom';
import { keyLabel } from '../ui/keyboard-guide';
import { medal } from '../ui/medal';
import { playLevel } from './map';
import { handInDialog, minutesLeft, startTask } from './task';

interface LevelParams {
  id: string;
  /** Drill keys (practice now). */
  keys?: string[];
  seconds?: number;
  /** Free practice of the parent's own text. */
  text?: boolean;
  /** Id of the task this level is played for. */
  task?: string;
}

export function levelScreen(root: HTMLElement, params: LevelParams): () => void {
  const p = app.profile!;
  let def: LevelDef;
  if (params.id === 'practice') def = practiceLevel(params.seconds ?? null, params.text ? ownTextPhrases(p) : undefined);
  else if (params.id === 'rescue') def = rescueLevel(p, p.progress.friends.length * 7 + Math.floor(Math.random() * 5));
  else def = levelById(params.id) ?? LEVELS[0];
  const task = p.tasks.find((x) => x.id === params.task && !x.doneAt) ?? null;
  let rt: LevelRuntime;
  const exit = () => go('map');
  rt = new LevelRuntime(root, def, {
    keys: params.keys,
    seconds: params.seconds ?? null,
    own: task ? taskOwn(task) : undefined,
    onExit: exit,
    onFinish: (result) => {
      if (!result) return exit();
      if (task) {
        recordTaskRun(task, result);
        saveProfile();
      }
      showResults(root, def, result, params, rt.surprise, task);
    },
  });
  if (def.kind === 'practice' && !params.seconds) {
    // Untimed practice ends when the child wants.
    root.querySelector('.hud')!.append(button(t('practice.finish'), () => rt.endPractice(), 'btn small'));
  }
  return () => rt.dispose();
}

const NAMES_FALLBACK: Record<Friend['kind'], string[]> = { dragon: ['Iskra', 'Mäta', 'Luna', 'Bubu'], robot: ['Bip', 'Zip', 'Kolík', 'Dioda'] };

function showResults(root: HTMLElement, def: LevelDef, r: LevelResult, params: LevelParams, surprise: Surprise | null, task: Task | null): void {
  const p = app.profile!;
  let rescued: Friend | null = null;
  if (def.id === 'rescue') {
    // The friend helped follows the mission's story.
    const kind = storyOf(def.world).id === 'robot' ? 'robot' : 'dragon';
    const names = tList(`${kind}Names`);
    const pool = names.length ? names : NAMES_FALLBACK[kind];
    const same = p.progress.friends.filter((f) => f.kind === kind).length;
    rescued = { kind, name: pool[same % pool.length], hue: Math.floor(Math.random() * 360), date: localDate() };
    p.progress.friends.push(rescued);
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
  if (rescued) lines.push(h('p', { class: 'good' }, t(rescued.kind === 'robot' ? 'results.repaired' : 'results.rescued', { name: rescued.name })));
  if (r.growth) {
    lines.push(h('div', { class: 'growth' }, medal(r.growth.medal),
      h('p', {}, h('b', {}, t('results.growthTitle')), h('br'),
        r.growth.kind === 'difficulty' ? t('results.growthDifficulty') : t('results.growthWordLen', { n: r.growth.value }))));
  }
  const sentence = pickLine('piko.level_done', { name: p.name }, p.customMessages);

  const actions = h('div', { class: 'row center' });
  const taskOn = task && !task.doneAt ? task : null;
  if (task?.doneAt) actions.append(button(t('task.handIn'), () => void handInDialog(p, task), 'btn primary', 'upload'));
  else if (taskOn && def.kind === 'practice') actions.append(button(t('task.continue'), () => startTask(p, taskOn), 'btn primary', 'play'));
  const breakDue = app.sessionSeconds >= p.settings.sessionMinutes * 60;
  // A break or a finished task's hand-in is the main action then.
  const calm = breakDue || !!task?.doneAt;
  const nextDef = def.index >= 0 && !def.isSuper ? LEVELS.find((l) => l.world === def.world && l.index === def.index + 1) : undefined;
  if (breakDue) actions.append(button(t('results.takeBreak'), () => go('break'), 'btn primary', 'play'));
  if (r.worldDone !== null) {
    actions.append(button(t('results.reward'), () => go('story', { scene: WORLD_REWARDS[r.worldDone!], next: 'map' }), `btn ${calm ? '' : 'primary'}`, 'star'));
  } else if (nextDef) {
    actions.append(button(t('results.next'), () => playLevel(nextDef.id, taskOn?.id), `btn ${calm ? '' : 'primary'}`, 'next'));
  } else if (def.id === 'rescue') {
    actions.append(button(t('results.nextRescue'), () => go('level', { id: 'rescue' }), `btn ${calm ? '' : 'primary'}`, 'rescue'));
  }
  actions.append(button(t('results.replay'), () => go('level', params), 'btn', 'replay'));
  actions.append(button(t('level.toMap'), () => go('map'), 'btn ghost', 'map'));

  const card = h('div', { class: 'card results-card' },
    h('h2', {}, def.kind === 'practice' ? t('results.practiceDone') : t('results.title')),
    def.kind === 'practice' ? null : stars,
    h('div', { class: 'results-body' },
      h('div', { class: 'results-piko' }, pikoElement(p.companion, 'happy', 140), h('p', { class: 'bubble static' }, breakDue ? pickLine('piko.break') : sentence)),
      h('div', { class: 'results-lines' }, ...lines)),
    ...(surprise ? surpriseResult(p, def, r, surprise) : []),
    task ? h('p', { class: `task-line ${task.doneAt ? 'good' : ''}` }, task.doneAt ? t('task.doneLine', { title: task.title }) : t('task.leftLine', { title: task.title, n: minutesLeft(task) })) : null,
    ...teaser(p, def, !!nextDef && r.worldDone === null),
    actions);
  const overlay = h('div', { class: 'overlay results' }, card);
  root.querySelector('.level-screen')!.append(overlay);
  (actions.querySelector('button') as HTMLButtonElement).focus();
}

/**
 * The surprise asked on the get-ready card, asked again: its answer, highlighted and only
 * this once, when the level went well enough; else a promise for the next try.
 */
function surpriseResult(p: Profile, def: LevelDef, r: LevelResult, s: Surprise): HTMLElement[] {
  const reached = surpriseReached(s, def, r);
  if (reached) {
    s.revealedAt = localDate();
    saveProfile();
  }
  return [h('div', { class: 'surprise-result' },
    surpriseAsk(p, s.q),
    reached ? h('p', { class: 'surprise answer' }, s.a) : h('p', { class: 'surprise almost' }, t('surprise.almost')))];
}

/**
 * Piko's curious question about the next level, answered only after that level is
 * finished, so the child wants to go on; every second one is the parent's own. Story levels only.
 */
function teaser(p: Profile, def: LevelDef, hasNext: boolean): HTMLElement[] {
  if (def.index < 0) return [];
  const world = WORLDS[def.world];
  const { answer, question } = teaserLines(p, {
    a: def.index > 0 ? tList(`teaser.${world}.a`)[def.index - 1] : undefined,
    q: hasNext ? tList(`teaser.${world}.q`)[def.index] : undefined,
  });
  saveProfile();
  const piko = p.companion.name;
  const out: HTMLElement[] = [];
  if (answer) out.push(h('p', { class: 'teaser answer' }, h('b', {}, t('teaser.answer')), ' ', answer));
  if (question) out.push(h('p', { class: 'teaser ask' }, h('b', {}, t('teaser.ask', { piko })), ' ', question, h('br'), h('small', {}, t('teaser.later'))));
  return out;
}

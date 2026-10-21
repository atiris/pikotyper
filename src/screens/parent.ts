import { app, applyProfileLook, go, saveProfile, useLanguage } from '../app/app';
import { t } from '../i18n/i18n';
import { LAYOUTS, LAYOUT_IDS, allKeys } from '../keyboard/layouts';
import { LEVELS, type LevelDef, WORLDS } from '../game/levels';
import { OWN_QUESTIONS_MAX, OWN_QUESTION_LEN, SURPRISES_MAX, SURPRISE_LEN } from '../game/own-content';
import { wordSource } from '../game/runtime';
import { lessonKeyOf, lessonOrder } from '../learning/lessons';
import { COMPANION_KINDS, GUEST_ID, type CompanionKind, type FontChoice, type Lang, type LayoutId, type OwnMix, type Profile, type TaskKind } from '../storage/schema';
import { linkOf } from '../share/codec';
import { TASK_MINUTES, TASK_TITLE_MAX, type TaskSpec, addTask, taskCode } from '../share/task';
import { moveCode } from '../share/transfer';
import { linkBox } from '../ui/link-box';
import { handInDialog } from './task';
import { applyImport, parseImport, planImport } from '../storage/store';
import { KeyboardGuide, keyLabel } from '../ui/keyboard-guide';
import { button, confirmDialog, download, h, modal } from '../ui/dom';
import { pikoElement } from '../gfx/piko';
import { soundButton } from '../ui/chrome';
import { clickableHeatmap } from './stats';
import { barChart, lineChart } from '../ui/charts';
import { hasCompanion, masteredCount } from '../game/rewards';
import { OWN_TEXT_MAX, OWN_WORDS_MAX, parseOwnWords, typableText, untypableWords } from '../words/words';

/** Settings are for parents: one calm question instead of a lock a child solves anyway. */
function parentAccess(): Promise<boolean> {
  const p = app.profile;
  return confirmDialog({
    title: t('parent.checkTitle'),
    text: t('parent.checkText'),
    ok: t('parent.checkOk'),
    cancel: t('common.back'),
    art: p ? pikoElement(p.companion, 'thinking', 110) : undefined,
  });
}

/** `granted`: re-render inside the parent area without asking again. */
export async function parentScreen(root: HTMLElement, params: { granted?: boolean }): Promise<void> {
  if (!params.granted && !(await parentAccess())) return go('map');
  const p = app.profile!;
  const tabs = ['settings', 'own', 'task', 'keys', 'dashboard', 'data'] as const;
  type Tab = (typeof tabs)[number];
  const body = h('div', { class: 'parent-body' });
  const nav = h('nav', { class: 'tabs', role: 'tablist' });
  const show = (tab: Tab) => {
    nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    body.replaceChildren(tab === 'settings' ? settingsTab(p) : tab === 'own' ? ownTab(p) : tab === 'task' ? taskTab(p) : tab === 'keys' ? keysTab(p) : tab === 'dashboard' ? dashboardTab(p) : dataTab(p));
  };
  for (const tab of tabs) {
    const b = button(t(`parent.tab.${tab}`), () => show(tab), 'tab');
    b.dataset.tab = tab;
    b.setAttribute('role', 'tab');
    nav.append(b);
  }
  root.append(h('div', { class: 'screen parent-screen' },
    h('header', { class: 'bar' }, button(t('common.back'), () => go('map'), 'btn ghost small', 'back'), h('h1', {}, t('parent.title', { name: p.name })), soundButton()),
    nav, body));
  show('settings');
}

function field(label: string, control: HTMLElement, hint?: string, tag: 'label' | 'div' = 'label'): HTMLElement {
  return h(tag, { class: 'field' }, h('span', { class: 'field-label' }, label), control, hint ? h('small', {}, hint) : null);
}

function range(value: number, min: number, max: number, step: number, onInput: (v: number) => void, fmt: (v: number) => string = String): HTMLElement {
  const out = h('output', {}, fmt(value));
  const input = h('input', { type: 'range', min, max, step, value });
  input.addEventListener('input', () => { out.textContent = fmt(Number(input.value)); onInput(Number(input.value)); });
  return h('span', { class: 'range' }, input, out);
}

function check(value: boolean, onChange: (v: boolean) => void): HTMLInputElement {
  const c = h('input', { type: 'checkbox' });
  c.checked = value;
  c.addEventListener('change', () => onChange(c.checked));
  return c;
}

function select<T extends string>(value: T, options: [T, string][], onChange: (v: T) => void): HTMLSelectElement {
  const s = h('select', {}, ...options.map(([v, l]) => h('option', { value: v, selected: v === value }, l)));
  s.addEventListener('change', () => onChange(s.value as T));
  return s;
}

/** Sliders with an "automatic" switch: while automatic, the app moves them and they are read-only. */
function autoField(ranges: HTMLElement[], auto: boolean, onAuto: (v: boolean) => void): HTMLElement {
  const lock = (on: boolean) => ranges.forEach((r) => r.querySelectorAll('input').forEach((i) => (i.disabled = on)));
  lock(auto);
  return h('span', { class: 'auto-field' }, ...ranges,
    h('label', { class: 'auto-check' }, check(auto, (v) => { lock(v); onAuto(v); }), t('parent.auto')));
}

function settingsTab(p: Profile): HTMLElement {
  const s = p.settings;
  const save = () => { saveProfile(); applyProfileLook(p); };
  const name = h('input', { type: 'text', value: p.name, maxlength: 24 });
  name.addEventListener('change', () => { p.name = name.value.trim() || p.name; save(); });
  const pikoName = h('input', { type: 'text', value: p.companion.name, maxlength: 20 });
  pikoName.addEventListener('change', () => { p.companion.name = pikoName.value.trim() || 'Piko'; save(); });
  return h('div', { class: 'settings-grid' },
    h('fieldset', {}, h('legend', {}, t('parent.group.child')),
      field(t('parent.childName'), name),
      field(t('parent.companionName'), pikoName),
      field(t('parent.companionKind'), select<CompanionKind>(p.companion.kind, COMPANION_KINDS.map((k) => [k, t(`kinds.${k}`)]), (v) => { p.companion.kind = v; p.avatar = v; if (!hasCompanion(p, v)) p.progress.companionsUnlocked.push(v); save(); })),
      field(t('parent.language'), select<Lang>(p.language, [['sk', 'Slovenčina'], ['en', 'English']], async (v) => { p.language = v; save(); await useLanguage(v); go('parent', { granted: true }); })),
      field(t('parent.layout'), select<LayoutId>(p.layout, LAYOUT_IDS.map((id) => [id, t(`layouts.${id}`)]), (v) => {
        p.layout = v;
        // Keep the progress, but only keys the new layout teaches.
        const order = lessonOrder(v);
        p.progress.unlockedKeys = order.slice(0, Math.max(2, p.progress.unlockedKeys.filter((k) => order.includes(k)).length));
        save();
      }), t('parent.layoutHint'))),
    h('fieldset', {}, h('legend', {}, t('parent.group.practice')),
      field(t('parent.difficulty'), autoField(
        [range(s.difficulty, 1, 10, 1, (v) => { s.difficulty = v; save(); })],
        s.autoDifficulty, (v) => { s.autoDifficulty = v; save(); }), t('parent.autoHint'), 'div'),
      field(t('parent.wordLen'), autoField([
        range(s.wordLen[0], 1, 8, 1, (v) => { s.wordLen = [v, Math.max(v, s.wordLen[1])]; save(); }, (v) => t('parent.min', { n: v })),
        range(s.wordLen[1], 2, 12, 1, (v) => { s.wordLen = [Math.min(v, s.wordLen[0]), v]; save(); }, (v) => t('parent.max', { n: v }))],
        s.autoWordLen, (v) => { s.autoWordLen = v; save(); }), undefined, 'div'),
      field(t('parent.noDiacritics'), check(s.noDiacritics, (v) => { s.noDiacritics = v; save(); }), t('parent.noDiacriticsHint')),
      field(t('parent.noTimePressure'), check(s.noTimePressure, (v) => { s.noTimePressure = v; save(); }), t('parent.noTimePressureHint')),
      field(t('parent.sessionMinutes'), range(s.sessionMinutes, 5, 30, 5, (v) => { s.sessionMinutes = v; save(); }, (v) => t('parent.minutes', { n: v }))),
      field(t('parent.guide'), select(s.guide, [['auto', t('parent.guideAuto')], ['on', t('parent.guideOn')], ['off', t('parent.guideOff')]], (v) => { s.guide = v; save(); })),
      field(t('parent.guideLocked'), check(s.guideLocked, (v) => { s.guideLocked = v; save(); }))),
    h('fieldset', {}, h('legend', {}, t('parent.group.look')),
      field(t('parent.sfx'), range(s.sfxVolume, 0, 1, 0.1, (v) => { s.sfxVolume = v; save(); }, (v) => `${Math.round(v * 100)} %`)),
      field(t('parent.music'), range(s.musicVolume, 0, 1, 0.1, (v) => { s.musicVolume = v; save(); }, (v) => `${Math.round(v * 100)} %`)),
      field(t('parent.font'), select<FontChoice>(s.font, [['lexend', 'Lexend'], ['atkinson', 'Atkinson Hyperlegible'], ['opendyslexic', 'OpenDyslexic']], (v) => { s.font = v; save(); })),
      field(t('parent.largeText'), check(s.largeText, (v) => { s.largeText = v; save(); })),
      field(t('parent.reduceMotion'), check(s.reduceMotion, (v) => { s.reduceMotion = v; save(); })),
      field(t('parent.highContrast'), check(s.highContrast, (v) => { s.highContrast = v; save(); })),
      field(t('parent.autoFullscreen'), check(s.autoFullscreen, (v) => { s.autoFullscreen = v; save(); }), t('parent.autoFullscreenHint'))));
}

/** The parent's own content: encouragements, surprises, questions, words and text. */
function ownTab(p: Profile): HTMLElement {
  const messages = h('textarea', { rows: 3, placeholder: t('parent.messagesPlaceholder') });
  messages.value = p.customMessages.join('\n');
  messages.addEventListener('change', () => { p.customMessages = messages.value.split('\n').map((m) => m.trim()).filter(Boolean).slice(0, 20); saveProfile(); });
  return h('div', { class: 'settings-grid own-tab' },
    h('fieldset', {}, h('legend', {}, t('own.group.messages')), field(t('parent.messages'), messages, t('parent.messagesHint'))),
    surprisesEditor(p),
    questionsEditor(p),
    ...ownWordsEditors(p));
}

const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36);

/** Story level name for the surprise place picker. */
function levelName(l: LevelDef): string {
  return `${t(`worlds.${WORLDS[l.world]}`)}: ${l.isSuper ? t('map.super') : l.index + 1}`;
}

/** Real rewards a parent hides behind a level; the answer is shown once, after the level went well. */
function surprisesEditor(p: Profile): HTMLElement {
  const places: [string, string][] = [['next', t('own.placeNext')], ['practice', t('own.placePractice')], ...LEVELS.map((l): [string, string] => [l.id, levelName(l)])];
  const placeName = (id: string) => places.find(([v]) => v === id)?.[1] ?? id;
  const q = h('textarea', { rows: 2, maxlength: SURPRISE_LEN, placeholder: t('own.surpriseQPlaceholder') });
  const a = h('textarea', { rows: 2, maxlength: SURPRISE_LEN, placeholder: t('own.surpriseAPlaceholder') });
  const place = select('next', places, () => undefined);
  const stars = select('2', [['1', '★'], ['2', `★★ ${t('own.starsEnough')}`], ['3', '★★★']], () => undefined);
  const msg = h('p', { class: 'error', role: 'alert' });
  const list = h('ul', { class: 'own-list' });
  const paint = () => list.replaceChildren(...p.surprises.map((s) => h('li', { class: s.revealedAt ? 'revealed' : '' },
    h('div', {}, h('b', {}, s.q), h('span', {}, s.a),
      h('small', {}, `${placeName(s.place)} · ${'★'.repeat(s.minStars)} · ${s.revealedAt ? t('own.revealed', { date: new Date(s.revealedAt).toLocaleDateString(p.language) }) : t('own.waiting')}`)),
    button(t('own.remove'), () => { p.surprises = p.surprises.filter((x) => x !== s); saveProfile(); paint(); }, 'btn small ghost', 'trash'))));
  const add = () => {
    msg.textContent = '';
    if (!q.value.trim() || !a.value.trim()) return void (msg.textContent = t('own.needBoth'));
    if (p.surprises.length >= SURPRISES_MAX) return void (msg.textContent = t('own.tooMany', { n: SURPRISES_MAX }));
    p.surprises.push({ id: newId(), q: q.value.trim(), a: a.value.trim(), place: place.value, minStars: Number(stars.value) });
    q.value = a.value = '';
    saveProfile();
    paint();
  };
  paint();
  return h('fieldset', { class: 'own-surprises' }, h('legend', {}, t('own.group.surprises')),
    h('p', { class: 'hint' }, t('own.surprisesHint')),
    field(t('own.surpriseQ'), q),
    field(t('own.surpriseA'), a),
    h('div', { class: 'row' }, field(t('own.place'), place), field(t('own.minStars'), stars)),
    msg,
    button(t('own.add'), add, 'btn small primary', 'plus'),
    list);
}

/** Questions that take turns with Piko's teasers; the answer comes after the next level. */
function questionsEditor(p: Profile): HTMLElement {
  const q = h('input', { type: 'text', maxlength: OWN_QUESTION_LEN, placeholder: t('own.questionPlaceholder') });
  const a = h('input', { type: 'text', maxlength: OWN_QUESTION_LEN, placeholder: t('own.answerPlaceholder') });
  const msg = h('p', { class: 'error', role: 'alert' });
  const list = h('ol', { class: 'own-list' });
  const paint = () => list.replaceChildren(...p.ownQuestions.map((x, i) => h('li', {},
    h('div', {}, h('b', {}, x.q), h('span', {}, x.a)),
    button(t('own.remove'), () => {
      p.ownQuestions.splice(i, 1);
      // The pending answer belongs to its question.
      p.progress.pendingQuestion = null;
      saveProfile();
      paint();
    }, 'btn small ghost', 'trash'))));
  const add = () => {
    msg.textContent = '';
    if (!q.value.trim() || !a.value.trim()) return void (msg.textContent = t('own.needBoth'));
    if (p.ownQuestions.length >= OWN_QUESTIONS_MAX) return void (msg.textContent = t('own.tooMany', { n: OWN_QUESTIONS_MAX }));
    p.ownQuestions.push({ q: q.value.trim(), a: a.value.trim() });
    q.value = a.value = '';
    saveProfile();
    paint();
  };
  paint();
  return h('fieldset', { class: 'own-questions' }, h('legend', {}, t('own.group.questions')),
    h('p', { class: 'hint' }, t('own.questionsHint')),
    field(t('own.question'), q),
    field(t('own.answer'), a),
    msg,
    button(t('own.add'), add, 'btn small primary', 'plus'),
    list);
}

/** Own words and own text, how much of them comes into the levels, and five sample targets. */
function ownWordsEditors(p: Profile): HTMLElement[] {
  const s = p.settings;
  const lay = LAYOUTS[p.layout];
  const words = h('textarea', { rows: 4, placeholder: t('own.wordsPlaceholder') });
  words.value = s.ownWords.join('\n');
  const wordsInfo = h('p', { class: 'hint', 'aria-live': 'polite' });
  const text = h('textarea', { rows: 6, maxlength: OWN_TEXT_MAX, placeholder: t('own.textPlaceholder') });
  text.value = s.ownText;
  const textInfo = h('p', { class: 'hint', 'aria-live': 'polite' });
  const preview = h('ul', { class: 'own-preview' });
  const paintPreview = () => {
    const src = wordSource(p);
    preview.replaceChildren(...Array.from({ length: 5 }, () => h('li', {}, src.next(new Set(), undefined, 2))));
  };
  const paint = () => {
    const bad = untypableWords(s.ownWords, lay);
    wordsInfo.replaceChildren(t('own.wordsCount', { n: s.ownWords.length, max: OWN_WORDS_MAX }),
      bad.length ? h('span', { class: 'error' }, ` ${t('own.untypableWords', { list: bad.join(', ') })}`) : '');
    const dropped = typableText(s.ownText, lay).dropped;
    textInfo.replaceChildren(t('own.textCount', { n: s.ownText.length, max: OWN_TEXT_MAX }),
      dropped.length ? h('span', { class: 'error' }, ` ${t('own.untypableChars', { list: dropped.join(' ') })}`) : '');
    paintPreview();
  };
  words.addEventListener('change', () => {
    s.ownWords = parseOwnWords(words.value);
    words.value = s.ownWords.join('\n');
    saveProfile();
    paint();
  });
  text.addEventListener('change', () => { s.ownText = text.value.slice(0, OWN_TEXT_MAX).trim(); saveProfile(); paint(); });
  const mix = select<OwnMix>(s.ownMix, (['off', 'some', 'half', 'most'] as const).map((m): [OwnMix, string] => [m, t(`own.mix.${m}`)]), (v) => { s.ownMix = v; saveProfile(); paintPreview(); });
  paint();
  return [
    h('fieldset', { class: 'own-words' }, h('legend', {}, t('own.group.words')),
      field(t('own.words'), words, t('own.wordsHint')),
      wordsInfo),
    h('fieldset', { class: 'own-text' }, h('legend', {}, t('own.group.text')),
      field(t('own.text'), text, t('own.textHint')),
      textInfo,
      field(t('own.mix.label'), mix, t('own.mixHint')),
      h('div', { class: 'own-preview-box' },
        h('span', { class: 'field-label' }, t('own.preview')),
        preview,
        button(t('own.previewMore'), paintPreview, 'btn small ghost', 'replay'))),
  ];
}

/** A task for this child or a whole class: a link (and QR) with words, text, minutes and what to play. */
function taskTab(p: Profile): HTMLElement {
  const title = h('input', { type: 'text', maxlength: TASK_TITLE_MAX, placeholder: t('task.titlePlaceholder') });
  const words = h('textarea', { rows: 3, placeholder: t('own.wordsPlaceholder') });
  const text = h('textarea', { rows: 4, maxlength: OWN_TEXT_MAX, placeholder: t('own.textPlaceholder') });
  let minutes = 10;
  const kind = select<TaskKind>('practice', [['practice', t('task.kind.practice')], ['story', t('task.kind.story')]], () => undefined);
  const msg = h('p', { class: 'error', role: 'alert' });
  const out = h('div', { class: 'task-out' });
  const list = h('ul', { class: 'own-list task-list' });
  const make = async () => {
    msg.textContent = '';
    const spec: TaskSpec = { id: newId(), title: title.value.trim(), words: parseOwnWords(words.value), text: text.value.slice(0, OWN_TEXT_MAX).trim(), minutes, kind: kind.value as TaskKind };
    if (!spec.words.length && !spec.text) return void (msg.textContent = t('task.needContent'));
    const link = linkOf('task', await taskCode(spec));
    out.replaceChildren(
      h('h3', {}, t('task.linkTitle')),
      h('p', { class: 'hint' }, t('task.linkHint')),
      linkBox(link),
      button(t('task.giveHere', { name: p.name }), () => { addTask(p, spec); saveProfile(); paint(); }, 'btn small', 'plus'));
  };
  const paint = () => list.replaceChildren(...p.tasks.map((x) => h('li', { class: x.doneAt ? 'revealed' : '' },
    h('div', {}, h('b', {}, x.title || t('task.untitled')),
      h('small', {}, `${t(`task.kind.${x.kind}`)} · ${x.doneAt ? t('task.doneAt', { date: new Date(x.doneAt).toLocaleDateString(p.language) }) : t('task.played', { n: Math.floor(x.seconds / 60), total: x.minutes })}`)),
    x.doneAt ? button(t('task.handIn'), () => void handInDialog(p, x), 'btn small', 'upload') : null,
    button(t('own.remove'), () => { p.tasks = p.tasks.filter((y) => y !== x); saveProfile(); paint(); }, 'btn small ghost', 'trash'))));
  paint();
  return h('div', { class: 'settings-grid task-tab' },
    h('fieldset', { class: 'task-new' }, h('legend', {}, t('task.group.new')),
      h('p', { class: 'hint' }, t('task.intro')),
      field(t('task.title'), title),
      field(t('own.words'), words, t('own.wordsHint')),
      field(t('own.text'), text),
      h('div', { class: 'row' },
        field(t('task.minutes'), range(minutes, TASK_MINUTES[0], TASK_MINUTES[1], 1, (v) => (minutes = v), (v) => t('parent.minutes', { n: v }))),
        field(t('task.kindLabel'), kind)),
      msg,
      button(t('task.make'), () => void make(), 'btn primary', 'code'),
      out),
    h('fieldset', { class: 'task-own' }, h('legend', {}, t('task.group.list', { name: p.name })),
      p.tasks.length ? null : h('p', { class: 'hint' }, t('task.none')),
      list));
}

function keysTab(p: Profile): HTMLElement {
  const s = p.settings;
  const lay = LAYOUTS[p.layout];
  const kb = new KeyboardGuide(lay);
  kb.el.classList.add('picker');
  const picked = new Set(s.manualKeys.length ? s.manualKeys : p.progress.unlockedKeys);
  const paint = () => {
    for (const def of allKeys(lay)) {
      const el = kb.keyEl(def.code);
      const key = lessonKeyOf(def);
      el?.classList.toggle('picked', !!key && picked.has(key));
    }
  };
  kb.onKeyClick((code) => {
    const def = allKeys(lay).find((d) => d.code === code)!;
    const key = lessonKeyOf(def);
    if (!key) return;
    if (picked.has(key)) picked.delete(key); else picked.add(key);
    s.manualKeys = [...picked];
    paint();
    saveProfile();
  });
  paint();
  const mode = select(s.activeKeysMode, [['auto', t('parent.keysAuto')], ['manual', t('parent.keysManual')]], (v) => { s.activeKeysMode = v; if (v === 'manual') s.manualKeys = [...picked]; saveProfile(); kb.el.classList.toggle('disabled', v === 'auto'); });
  kb.el.classList.toggle('disabled', s.activeKeysMode === 'auto');
  const presets: [string, string][] = [['home', 'fjdkslaô'], ['homeUs', 'fjdksla;'], ['top', 'qwertzuiop'], ['bottom', 'yxcvbnm']];
  return h('div', {},
    field(t('parent.keysMode'), mode, t('parent.keysHint')),
    h('p', { class: 'hint' }, t('parent.unlocked', { keys: p.progress.unlockedKeys.map(keyLabel).join(' ') })),
    kb.el,
    h('div', { class: 'row' },
      ...presets.filter(([id]) => (p.layout === 'us-qwerty' ? id !== 'home' : id !== 'homeUs')).map(([id, keys]) => button(t(`parent.preset.${id}`), () => {
        for (const c of keys) if (allKeys(lay).some((d) => d.base === c)) picked.add(c);
        s.manualKeys = [...picked];
        s.activeKeysMode = 'manual';
        mode.value = 'manual';
        kb.el.classList.remove('disabled');
        paint();
        saveProfile();
      }, 'btn small')),
      button(t('parent.preset.clear'), () => { picked.clear(); s.manualKeys = []; paint(); saveProfile(); }, 'btn small ghost')));
}

function dashboardTab(p: Profile): HTMLElement {
  const sessions = p.stats.sessions.slice(-14);
  const labels = sessions.map((s) => s.date.slice(5));
  const detail = h('div', { class: 'key-detail-host' }, h('p', { class: 'hint' }, t('stats.clickKey')));
  const heat = clickableHeatmap(p, detail);
  const levelsDone = LEVELS.filter((l) => p.progress.levels[l.id]).length;
  const totalChars = sessions.reduce((a, s) => a + s.chars, 0);
  return h('div', { class: 'dashboard' },
    h('div', { class: 'cards' },
      h('div', { class: 'stat' }, h('b', {}, String(levelsDone)), h('span', {}, t('parent.levelsDone', { total: LEVELS.length }))),
      h('div', { class: 'stat' }, h('b', {}, String(p.progress.unlockedKeys.length)), h('span', {}, t('parent.keysUnlocked'))),
      h('div', { class: 'stat' }, h('b', {}, String(masteredCount(p))), h('span', {}, t('parent.keysMastered'))),
      h('div', { class: 'stat' }, h('b', {}, String(totalChars)), h('span', {}, t('parent.charsTyped')))),
    h('h3', {}, t('parent.heatmap')),
    h('div', { class: 'heat-split' }, heat, detail),
    h('div', { class: 'chart-grid' },
      h('section', {}, h('h3', {}, t('parent.accuracyTrend')),
        lineChart(sessions.map((s) => Math.round((s.chars / Math.max(1, s.chars + s.errors)) * 100)), labels, '%', '#3f8fd6')),
      h('section', {}, h('h3', {}, t('parent.rhythmTrend')),
        lineChart(sessions.map((s) => s.cpm), labels, t('parent.cpm'), '#e08a3c')),
      h('section', {}, h('h3', {}, t('parent.timePerDay')),
        barChart(sessions.map((s) => Math.round(s.seconds / 60)), labels, 'min'))),
    h('h3', {}, t('parent.worlds')),
    h('ul', { class: 'world-list' }, ...WORLDS.map((w, i) => h('li', {}, `${i + 1}. ${t(`worlds.${w}`)}: `,
      ...LEVELS.filter((l) => l.world === i).map((l) => h('span', { class: 'lv' }, `${'★'.repeat(p.progress.levels[l.id] ?? 0) || '·'}`))))));
}

function dataTab(p: Profile): HTMLElement {
  const guest = p.id === GUEST_ID;
  return h('div', { class: 'data-tab' },
    h('p', {}, t('parent.dataText')),
    h('div', { class: 'row' },
      guest ? null : button(t('parent.exportOne'), () => exportOne(p), 'btn', 'download'),
      guest ? null : button(t('move.button'), () => void moveDialog(p), 'btn', 'next'),
      button(t('parent.exportAll'), () => download('pikotyper-profiles.json', app.store.exportJson()), 'btn', 'download'),
      button(t('parent.import'), () => importDialog(() => go('parent', { granted: true })), 'btn', 'upload'),
      button(t('parent.print'), () => printCard(p), 'btn', 'print')),
    guest ? h('p', { class: 'hint' }, t('parent.guestNote')) : h('div', { class: 'danger' },
      h('h3', {}, t('parent.deleteTitle')),
      button(t('parent.delete', { name: p.name }), async () => {
        const yes = await confirmDialog({
          title: t('parent.deleteTitle'),
          text: t('parent.deleteConfirm', { name: p.name }),
          ok: t('parent.deleteOk'),
          cancel: t('common.back'),
          danger: true,
          art: pikoElement(p.companion, 'thinking', 110),
        });
        if (!yes) return;
        app.store.remove(p.id);
        app.profile = null;
        go('start');
      }, 'btn danger', 'trash')));
}

const exportOne = (p: Profile) => download(`pikotyper-${slug(p.name)}.json`, app.store.exportJson([p.id]));

/** The whole player as a link for another computer; a file when the link would be too long. */
async function moveDialog(p: Profile): Promise<void> {
  const prefix = linkOf('move', '');
  const code = await moveCode(p, prefix);
  modal(h('div', { class: 'move' },
    h('h2', {}, t('move.title')),
    ...(code
      ? [h('p', {}, t('move.text', { name: p.name })), linkBox(prefix + code), h('p', { class: 'hint' }, t('move.privacy'))]
      : [h('p', {}, t('move.tooLong')), button(t('parent.exportOne'), () => exportOne(p), 'btn primary', 'download')])), { cls: 'share-modal' });
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'profile';

/** Import with validation; never overwrites silently. */
export function importDialog(done: () => void): void {
  const file = h('input', { type: 'file', accept: '.json,application/json' });
  const msg = h('p', { class: 'error', role: 'alert' });
  const actions = h('div', { class: 'row' });
  const close = modal(h('div', { class: 'import' }, h('h2', {}, t('import.title')), h('p', {}, t('import.text')), file, msg, actions));
  file.addEventListener('change', async () => {
    msg.textContent = '';
    actions.replaceChildren();
    const f = file.files?.[0];
    if (!f) return;
    try {
      const profiles = parseImport(await f.text());
      const plan = planImport(app.store, profiles);
      const finish = (replace: boolean) => { applyImport(app.store, plan, replace); close(); done(); };
      msg.className = 'ok';
      msg.textContent = t('import.found', { n: profiles.length, names: profiles.map((x) => x.name).join(', ') });
      if (plan.conflicts.length) {
        msg.textContent += ` ${t('import.conflict', { names: plan.conflicts.map((x) => x.name).join(', ') })}`;
        actions.append(button(t('import.replace'), () => finish(true), 'btn'), button(t('import.keepBoth'), () => finish(false), 'btn primary'));
      } else actions.append(button(t('import.do'), () => finish(false), 'btn primary'));
    } catch (e) {
      msg.className = 'error';
      msg.textContent = t((e as Error).message);
    }
  });
}

/** Printable progress card through the browser's print dialog. */
function printCard(p: Profile): void {
  const stars = Object.values(p.progress.levels).reduce((a, b) => a + b, 0);
  const last = p.stats.sessions[p.stats.sessions.length - 1];
  const card = h('div', { class: 'print-card' },
    h('h1', {}, t('print.title')),
    h('p', { class: 'print-name' }, p.name),
    h('p', {}, t('print.keys', { n: p.progress.unlockedKeys.length, keys: p.progress.unlockedKeys.join(' ') })),
    h('p', {}, t('print.mastered', { n: masteredCount(p) })),
    h('p', {}, t('print.stars', { n: stars, total: LEVELS.length * 3 })),
    h('p', {}, t('print.worlds', { n: p.progress.worldsDone.length, total: WORLDS.length })),
    last ? h('p', {}, t('print.rhythm', { n: last.cpm })) : null,
    h('p', { class: 'print-date' }, new Date().toLocaleDateString(p.language)),
    h('p', { class: 'print-sign' }, `${p.companion.name} & PikoTyper`));
  document.body.append(card);
  document.body.classList.add('printing');
  const cleanup = () => { card.remove(); document.body.classList.remove('printing'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 1500);
}

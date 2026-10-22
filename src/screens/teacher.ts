import { app, applyProfileLook, go } from '../app/app';
import { t } from '../i18n/i18n';
import { codeFrom } from '../share/codec';
import { parseResult } from '../share/result';
import { type StoredResult, TeacherStore } from '../share/teacher';
import { button, confirmDialog, download, h } from '../ui/dom';
import { keyLabel } from '../ui/keyboard-guide';
import { soundButton, superStar } from '../ui/chrome';

/**
 * The teacher's table of handed-in results, kept in this browser only. Opened from the start
 * page or by a result link, whose result is added on the way in.
 */
export function teacherScreen(root: HTMLElement, params: { code?: string }): void {
  app.profile = null;
  applyProfileLook(null);
  const store = new TeacherStore();
  const msg = h('p', { role: 'status', 'aria-live': 'polite' });
  const table = h('div', { class: 'teacher-table' });
  const paste = h('input', { type: 'text', placeholder: t('teacher.pastePlaceholder'), 'aria-label': t('teacher.paste') });

  const addCode = async (code: string | null) => {
    msg.className = '';
    msg.textContent = '';
    if (!code) {
      msg.className = 'error';
      msg.textContent = t('share.broken');
      return;
    }
    try {
      const { result, intact } = await parseResult(code);
      const added = store.add(result, intact);
      msg.className = intact ? 'ok' : 'error';
      msg.textContent = `${t(added ? 'teacher.added' : 'teacher.already', { name: result.name, title: result.title })}${intact ? '' : ` ${t('teacher.notIntact')}`}`;
      paint();
    } catch (e) {
      msg.className = 'error';
      msg.textContent = t((e as Error).message);
    }
  };

  const remove = async (r: StoredResult) => {
    const yes = await confirmDialog({ title: t('teacher.removeTitle'), text: t('teacher.removeText', { name: r.name, title: r.title }), ok: t('teacher.remove'), cancel: t('common.back'), danger: true });
    if (!yes) return;
    store.remove(r);
    paint();
  };

  const head = ['task', 'child', 'date', 'minutes', 'accuracy', 'rhythm', 'weak'].map((c) => t(`teacher.col.${c}`));
  const paint = () => {
    const rows = store.sorted();
    if (!rows.length) return void table.replaceChildren(h('p', { class: 'hint' }, t('teacher.empty')));
    let lastTask = '';
    table.replaceChildren(h('table', {},
      // The task is the group row above its children.
      h('thead', {}, h('tr', {}, ...head.slice(1).map((c) => h('th', { scope: 'col' }, c)), h('th', {}, ''))),
      h('tbody', {}, ...rows.flatMap((r) => {
        const group = r.taskId !== lastTask ? h('tr', { class: 'task-row' }, h('th', { colspan: head.length, scope: 'rowgroup' }, r.title)) : null;
        lastTask = r.taskId;
        return [group, h('tr', { class: r.intact ? '' : 'broken' },
          h('td', {}, r.name, r.intact ? null : h('span', { class: 'error', title: t('teacher.notIntact') }, ' !')),
          h('td', {}, r.date),
          h('td', {}, String(r.minutes)),
          h('td', {}, `${r.accuracy} %`),
          h('td', {}, String(r.cpm)),
          h('td', {}, r.weak.map(([k, a]) => `${keyLabel(k)} ${a} %`).join(', ')),
          h('td', {}, button('', () => void remove(r), 'btn small ghost', 'trash')))].filter((x): x is HTMLTableRowElement => !!x);
      }))));
    table.querySelectorAll('td .btn').forEach((b) => b.setAttribute('aria-label', t('teacher.remove')));
  };

  const exportCsv = () => download('pikotyper-results.csv', `﻿${store.csv([...head, t('teacher.col.broken')], keyLabel)}`, 'text/csv');

  root.append(h('div', { class: 'screen teacher-screen' },
    h('header', { class: 'bar' }, button(t('common.back'), () => go('start'), 'btn ghost small', 'back'), h('h1', {}, t('teacher.title')), superStar(), soundButton()),
    h('main', { class: 'panel' },
      h('p', {}, t('teacher.intro')),
      h('form', { class: 'row', onSubmit: (e: Event) => { e.preventDefault(); void addCode(codeFrom(paste.value, 'result')).then(() => (paste.value = '')); } },
        paste, h('button', { class: 'btn primary', type: 'submit' }, t('teacher.add'))),
      msg,
      table,
      h('div', { class: 'row' }, button(t('teacher.csv'), exportCsv, 'btn', 'download')),
      h('p', { class: 'hint' }, t('teacher.privacy')))));
  paint();
  if (params.code) void addCode(params.code);
}

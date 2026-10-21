import { app, go, selectProfile } from '../app/app';
import { pikoElement } from '../gfx/piko';
import { language, t } from '../i18n/i18n';
import { COMPANION_KINDS, type CompanionKind, type Lang, type LayoutId } from '../storage/schema';
import { newProfile } from '../storage/store';
import { button, h } from '../ui/dom';
import { muteButton } from '../ui/chrome';

export function newProfileScreen(root: HTMLElement): void {
  let kind: CompanionKind = 'fox';
  const name = h('input', { id: 'np-name', type: 'text', maxlength: 24, autocomplete: 'off', required: true, autofocus: true });
  const pikoName = h('input', { id: 'np-piko', type: 'text', maxlength: 20, value: 'Piko', autocomplete: 'off' });
  const lang = h('select', { id: 'np-lang' },
    h('option', { value: 'sk', selected: language() === 'sk' }, 'Slovenčina'),
    h('option', { value: 'en', selected: language() === 'en' }, 'English'));
  const lay = h('select', { id: 'np-layout' },
    h('option', { value: 'sk-qwertz', selected: language() === 'sk' }, t('layouts.sk-qwertz')),
    h('option', { value: 'us-qwerty', selected: language() !== 'sk' }, t('layouts.us-qwerty')));
  lang.addEventListener('change', () => (lay.value = lang.value === 'sk' ? 'sk-qwertz' : 'us-qwerty'));
  const kinds = h('div', { class: 'kind-picker', role: 'radiogroup', 'aria-label': t('newProfile.companion') },
    ...COMPANION_KINDS.map((k) => {
      const b = h('button', { class: `kind ${k === kind ? 'on' : ''}`, type: 'button', role: 'radio', 'aria-checked': String(k === kind), 'aria-label': t(`kinds.${k}`), onClick: () => {
        kind = k;
        kinds.querySelectorAll('.kind').forEach((el) => { el.classList.remove('on'); el.setAttribute('aria-checked', 'false'); });
        b.classList.add('on');
        b.setAttribute('aria-checked', 'true');
      } }, pikoElement({ name: '', kind: k, accessories: [] }, 'idle', 84), h('span', {}, t(`kinds.${k}`)));
      return b;
    }));
  const error = h('p', { class: 'error', role: 'alert' });
  const form = h('form', { class: 'panel form', onSubmit: async (e: Event) => {
    e.preventDefault();
    const n = name.value.trim();
    if (!n) {
      error.textContent = t('newProfile.nameMissing');
      name.focus();
      return;
    }
    const p = newProfile(n, lang.value as Lang, lay.value as LayoutId, kind);
    p.companion.name = pikoName.value.trim() || 'Piko';
    app.store.add(p);
    await selectProfile(p);
    go('story', { scene: 'intro', next: 'map' });
  } },
    h('h1', {}, t('newProfile.title')),
    h('label', { for: 'np-name' }, t('newProfile.name')), name,
    h('label', {}, t('newProfile.companion')), kinds,
    h('label', { for: 'np-piko' }, t('newProfile.companionName')), pikoName,
    h('div', { class: 'two' },
      h('div', {}, h('label', { for: 'np-lang' }, t('newProfile.language')), lang),
      h('div', {}, h('label', { for: 'np-layout' }, t('newProfile.layout')), lay)),
    h('p', { class: 'hint' }, t('newProfile.parentHint')),
    error,
    h('div', { class: 'row' },
      button(t('common.back'), () => go('start'), 'btn ghost', 'back'),
      h('button', { class: 'btn primary', type: 'submit' }, t('newProfile.create'))));
  root.append(h('div', { class: 'screen form-screen' }, h('div', { class: 'top-right' }, muteButton()), form));
}

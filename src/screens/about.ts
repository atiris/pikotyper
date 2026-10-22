import { app, go } from '../app/app';
import { t, tList } from '../i18n/i18n';
import { button, h, icon } from '../ui/dom';
import { cornerControls } from '../ui/chrome';

const COUNTER = 'https://pikotyper.goatcounter.com';

/** Fills `line` with the visit count the public counter reports; stays empty when offline. */
async function showVisits(line: HTMLElement): Promise<void> {
  try {
    const r = await fetch(`${COUNTER}/counter/TOTAL.json`);
    const { count } = await r.json();
    if (typeof count !== 'string') return;
    line.replaceChildren(t('about.visits', { n: count }), ' ', h('a', { href: COUNTER, target: '_blank', rel: 'noopener' }, t('about.visitsLink')));
  } catch { /* offline or blocked: the line stays empty */ }
}

/** About and privacy promise for parents. */
export function aboutScreen(root: HTMLElement): void {
  const visits = h('p', { class: 'hint' });
  void showVisits(visits);
  root.append(h('div', { class: 'screen about-screen' },
    h('header', { class: 'bar' }, button(t('common.back'), () => go(app.profile ? 'map' : 'start'), 'btn ghost small', 'back')),
    cornerControls(),
    h('article', { class: 'panel prose' },
      h('h1', {}, t('about.title')),
      h('p', {}, t('about.intro')),
      h('h2', {}, t('about.privacyTitle')),
      h('ul', {}, ...tList('about.privacy').map((l) => h('li', {}, l))),
      h('h2', {}, t('about.dataTitle')),
      h('ul', {}, ...tList('about.data').map((l) => h('li', {}, l))),
      visits,
      h('h2', {}, t('about.howTitle')),
      h('ul', {}, ...tList('about.how').map((l) => h('li', {}, l))),
      h('h2', {}, t('about.creditsTitle')),
      h('p', {}, t('about.credits')),
      h('div', { class: 'row about-actions' },
        h('a', { class: 'btn', href: 'https://github.com/atiris/pikotyper', target: '_blank', rel: 'noopener' }, icon('code'), t('about.code')),
        h('a', { class: 'btn', href: 'https://github.com/atiris/pikotyper/issues/new', target: '_blank', rel: 'noopener' }, icon('edit'), t('about.report'))))));
}

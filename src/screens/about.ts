import { app, go } from '../app/app';
import { t, tList } from '../i18n/i18n';
import { button, h, icon } from '../ui/dom';
import { soundButton, superStar } from '../ui/chrome';

/** About and privacy promise for parents. */
export function aboutScreen(root: HTMLElement): void {
  root.append(h('div', { class: 'screen about-screen' },
    h('div', { class: 'top-right' }, superStar(), soundButton()),
    h('article', { class: 'panel prose' },
      h('h1', {}, t('about.title')),
      h('p', {}, t('about.intro')),
      h('h2', {}, t('about.privacyTitle')),
      h('ul', {}, ...tList('about.privacy').map((l) => h('li', {}, l))),
      h('h2', {}, t('about.howTitle')),
      h('ul', {}, ...tList('about.how').map((l) => h('li', {}, l))),
      h('h2', {}, t('about.creditsTitle')),
      h('p', {}, t('about.credits')),
      h('div', { class: 'row about-actions' },
        button(t('common.back'), () => go(app.profile ? 'map' : 'start'), 'btn primary', 'back'),
        h('a', { class: 'btn', href: 'https://github.com/atiris/pikotyper', target: '_blank', rel: 'noopener' }, icon('code'), t('about.code')),
        h('a', { class: 'btn', href: 'https://github.com/atiris/pikotyper/issues/new', target: '_blank', rel: 'noopener' }, icon('edit'), t('about.report'))))));
}

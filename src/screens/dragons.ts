import { app, go } from '../app/app';
import { imageUrl } from '../gfx/assets';
import { t } from '../i18n/i18n';
import { button, h } from '../ui/dom';
import { soundButton } from '../ui/chrome';

/** Collection of dragons rescued in rescue missions. */
export function dragonsScreen(root: HTMLElement): void {
  const p = app.profile!;
  const hatched = imageUrl('obj-dragon-hatched');
  const baby = imageUrl('obj-dragon-baby-1');
  const list = p.progress.dragons;
  root.append(h('div', { class: 'screen dragons-screen' },
    h('header', { class: 'bar' }, button(t('common.back'), () => go('map'), 'btn ghost small', 'back'), h('h1', {}, t('dragons.title')), soundButton()),
    h('div', { class: 'dragon-grid' },
      h('figure', { class: 'dragon first' }, hatched ? h('img', { src: hatched, alt: '' }) : null, h('figcaption', {}, t('dragons.first'))),
      ...list.map((d) => h('figure', { class: 'dragon' },
        baby ? h('img', { src: baby, alt: '', style: `filter:hue-rotate(${d.hue}deg)` }) : null,
        h('figcaption', {}, d.name, h('small', {}, d.date))))),
    list.length ? null : h('p', { class: 'center hint' }, t('dragons.empty')),
    h('div', { class: 'row center' }, button(t('map.rescue'), () => go('level', { id: 'rescue' }), 'btn primary', 'rescue'))));
}

import { app, go, saveProfile } from '../app/app';
import { accessories, imageUrl } from '../gfx/assets';
import { SLOTS, pikoElement, renderPikoInto } from '../gfx/piko';
import { t } from '../i18n/i18n';
import { hasAccessory, unlockRules } from '../game/rewards';
import { button, h, icon } from '../ui/dom';
import { muteButton } from '../ui/chrome';

/** Wardrobe: one item per body area, mixed freely; locked items show how to earn them. */
export function wardrobeScreen(root: HTMLElement): void {
  const p = app.profile!;
  const preview = pikoElement(p.companion, 'happy', 280);
  const rules = new Map(unlockRules().map((r) => [r.acc, r.rule]));
  const howTo = (id: string): string => {
    const r = rules.get(id);
    if (!r) return '';
    if (r.kind === 'level') {
      const [w, l] = r.id.slice(1).split('-');
      return t('wardrobe.byLevel', { level: t('level.title', { world: w, level: l }) });
    }
    if (r.kind === 'world') return t('wardrobe.byWorld', { world: r.world + 1 });
    return t('wardrobe.byMastery', { n: r.keys });
  };
  const grid = h('div', { class: 'wardrobe-grid' });
  const render = () => {
    renderPikoInto(preview, p.companion, 'happy');
    grid.replaceChildren(...SLOTS.flatMap((slot) => {
      const items = accessories().filter((a) => a.slot === slot);
      if (!items.length) return [];
      return [h('section', { class: 'slot' },
        h('h3', {}, t(`slots.${slot}`)),
        h('div', { class: 'items' }, ...items.map((a) => {
          const owned = hasAccessory(p, a.id);
          const on = p.companion.accessories.includes(a.id);
          const src = imageUrl(`acc-${a.id}`);
          return h('button', {
            class: `item ${on ? 'on' : ''} ${owned ? '' : 'locked'}`,
            type: 'button',
            'aria-pressed': String(on),
            'aria-label': `${t(`items.${a.id}`)}${owned ? '' : ` (${howTo(a.id)})`}`,
            title: owned ? t(`items.${a.id}`) : howTo(a.id),
            disabled: !owned,
            onClick: () => {
              const others = p.companion.accessories.filter((id) => accessories().find((x) => x.id === id)?.slot !== slot);
              p.companion.accessories = on ? others : [...others, a.id];
              saveProfile();
              render();
            },
          }, src ? h('img', { src, alt: '' }) : null, owned ? null : h('span', { class: 'lock' }, icon('lock')));
        })))];
    }));
  };
  render();
  const owned = accessories().filter((a) => hasAccessory(p, a.id)).length;
  root.append(h('div', { class: 'screen wardrobe-screen' },
    h('header', { class: 'bar' }, button(t('common.back'), () => go('map'), 'btn ghost small', 'back'), h('h1', {}, t('wardrobe.title', { piko: p.companion.name })), muteButton()),
    h('div', { class: 'wardrobe-body' },
      h('div', { class: 'wardrobe-preview' }, preview, h('p', {}, t('wardrobe.count', { n: owned, total: accessories().length })),
        button(t('wardrobe.clear'), () => { p.companion.accessories = []; saveProfile(); render(); }, 'btn ghost small')),
      grid)));
}

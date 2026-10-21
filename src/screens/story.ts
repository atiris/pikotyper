import { app, go, saveProfile, type ScreenName } from '../app/app';
import { audio } from '../audio/audio';
import { imageUrl } from '../gfx/assets';
import { pikoElement } from '../gfx/piko';
import { t, tList } from '../i18n/i18n';
import { button, h } from '../ui/dom';

interface SceneDef {
  world: string;
  sprites: string[];
  piko?: boolean;
  envelope?: boolean;
  sparkles?: boolean;
}

const SCENES: Record<string, SceneDef> = {
  intro: { world: 'meadow', sprites: ['obj-swatter'], piko: true },
  world1: { world: 'meadow', sprites: ['obj-bee', 'obj-butterfly', 'obj-ladybug'] },
  invitation: { world: 'meadow', sprites: ['obj-rocket'], piko: true, envelope: true },
  world2: { world: 'space', sprites: ['obj-rocket', 'obj-planet-2'] },
  landing: { world: 'space', sprites: ['obj-planet-3', 'obj-rocket'], piko: true },
  world3: { world: 'planet', sprites: ['obj-stone', 'obj-sign'], piko: true },
  force: { world: 'planet', sprites: [], piko: true, sparkles: true },
  world4: { world: 'dragons', sprites: ['obj-dragon-baby-1', 'obj-dragon-baby-2', 'obj-dragon-baby-3'] },
  egg: { world: 'dragons', sprites: ['obj-egg', 'obj-dragon-baby-2'], piko: true, sparkles: true },
  world5: { world: 'egg', sprites: ['obj-egg'], piko: true },
  hatched: { world: 'egg', sprites: ['obj-dragon-hatched'], piko: true, sparkles: true },
};

interface StoryParams {
  scene: string;
  next: ScreenName;
  nextParams?: any;
}

/** Short skippable story scene: a few lines and a gentle animation. */
export function storyScreen(root: HTMLElement, params: StoryParams): () => void {
  const p = app.profile!;
  const def = SCENES[params.scene] ?? SCENES.intro;
  const lines = tList(`story.scenes.${params.scene}`, { name: p.name, piko: p.companion.name });
  audio.music(def.world);
  let i = 0;
  const bg = imageUrl(`bg-${def.world}-far`);
  const text = h('p', { class: 'story-text', 'aria-live': 'polite' });
  const dots = h('div', { class: 'story-dots' }, ...lines.map(() => h('i')));
  const stage = h('div', { class: 'story-stage' },
    ...def.sprites.map((s, k) => {
      const src = imageUrl(s);
      return src ? h('img', { class: 'story-sprite', src, alt: '', style: `--k:${k}` }) : null;
    }),
    def.envelope ? h('div', { class: 'envelope', 'aria-hidden': 'true' }, h('span', {}, '★')) : null,
    def.piko ? h('div', { class: 'story-piko' }, pikoElement(p.companion, 'happy', 220)) : null,
    def.sparkles ? h('div', { class: 'sparkles', 'aria-hidden': 'true' }, ...Array.from({ length: 14 }, (_, k) => h('i', { style: `--k:${k}` }))) : null);
  const finish = () => {
    if (!p.progress.scenesSeen.includes(params.scene)) {
      p.progress.scenesSeen.push(params.scene);
      if (!p.progress.rewards.includes(params.scene) && !params.scene.startsWith('world') && params.scene !== 'intro') p.progress.rewards.push(params.scene);
      saveProfile();
    }
    go(params.next, params.nextParams ?? {});
  };
  const show = () => {
    if (i >= lines.length) return finish();
    text.textContent = lines[i];
    text.classList.remove('in');
    void text.offsetWidth;
    text.classList.add('in');
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= i));
    nextBtn.querySelector('span:not(.icon)')!.textContent = i === lines.length - 1 ? t('common.continue') : t('story.next');
  };
  const nextBtn = button(t('story.next'), () => { i++; show(); }, 'btn primary', 'next');
  const screen = h('div', { class: `screen story-screen world-${def.world}`, style: bg ? `--bg:url("${bg}")` : '' },
    stage,
    h('div', { class: 'story-box' }, text, dots, h('div', { class: 'row' }, button(t('common.skip'), finish, 'btn ghost small'), nextBtn)));
  root.append(screen);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); finish(); }
    else if ((e.key === ' ' || e.key === 'Enter') && document.activeElement !== nextBtn) { e.preventDefault(); i++; show(); }
  };
  window.addEventListener('keydown', onKey);
  if (!lines.length) queueMicrotask(finish);
  else show();
  nextBtn.focus();
  return () => window.removeEventListener('keydown', onKey);
}

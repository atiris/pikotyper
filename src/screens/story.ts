import { app, go, saveProfile, type ScreenName } from '../app/app';
import { audio } from '../audio/audio';
import { hasImage, imageUrl } from '../gfx/assets';
import { type FairyMood, fairyElement } from '../gfx/fairy';
import { type Mood, pikoElement } from '../gfx/piko';
import { type RobotMood, type RobotState, robotElement } from '../gfx/robot';
import { t, tList } from '../i18n/i18n';
import { cornerControls } from '../ui/chrome';
import { button, h } from '../ui/dom';

interface SceneDef {
  world: string;
  sprites: string[];
  piko?: boolean;
  envelope?: boolean;
  sparkles?: boolean;
  fan?: boolean;
  /** Piko's mood; a mood without pictures for the kind falls back to happy. */
  mood?: Mood;
  /** Bolt in story 2. */
  bolt?: RobotState & { mood: RobotMood };
  /** Melody in story 3. */
  fairy?: FairyMood;
}

/** Piko's fan, the same look as the code-drawn one in the meadow levels. */
const FAN = `<svg viewBox="0 0 110 120" aria-hidden="true">${
  Array.from({ length: 10 }, (_, i) => {
    const a0 = Math.PI + (i / 10) * Math.PI, a1 = Math.PI + ((i + 1) / 10) * Math.PI;
    const p = (a: number) => `${(55 + Math.cos(a) * 52).toFixed(1)} ${(62 + Math.sin(a) * 52).toFixed(1)}`;
    return `<path d="M55 62 L${p(a0)} A52 52 0 0 1 ${p(a1)} Z" fill="${i % 2 ? '#b9e4c0' : '#a2d6ab'}" stroke="rgba(80,130,90,0.55)" stroke-width="1.2"/>`;
  }).join('')}<path d="M3 62 A52 52 0 0 1 107 62 Z" fill="none" stroke="#6d5040" stroke-width="2.5" stroke-linejoin="round"/><rect x="50" y="50" width="10" height="66" rx="5" fill="#d29a62" stroke="#6d5040" stroke-width="2"/></svg>`;

/** The owner's fan art when it is there, else the code-drawn one. */
function fan(): HTMLElement {
  const src = imageUrl('obj-fan');
  return src ? h('div', { class: 'story-fan' }, h('img', { src, alt: '' })) : h('div', { class: 'story-fan', html: FAN });
}

const SCENES: Record<string, SceneDef> = {
  intro: { world: 'meadow', sprites: [], piko: true, fan: true },
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
  world6: { world: 'junkyard', sprites: ['obj-tire', 'obj-crate', 'obj-can'], piko: true },
  friends: { world: 'junkyard', sprites: [], piko: true, mood: 'surprised', bolt: { look: 'broken', raincoat: false, mood: 'happy' }, sparkles: true },
  world7: { world: 'workshop', sprites: ['obj-gear', 'obj-bolt', 'obj-wheel'], bolt: { look: 'robot', raincoat: false, mood: 'idle' } },
  legs: { world: 'workshop', sprites: [], piko: true, bolt: { look: 'robot2', raincoat: false, mood: 'happy' }, sparkles: true },
  world8: { world: 'raintown', sprites: ['obj-raindrop', 'obj-umbrella'], bolt: { look: 'robot2', raincoat: false, mood: 'worried' } },
  raincoat: { world: 'raintown', sprites: [], piko: true, bolt: { look: 'robot2', raincoat: true, mood: 'happy' }, sparkles: true },
  world9: { world: 'robocity', sprites: ['obj-door', 'obj-panel'], bolt: { look: 'robot2', raincoat: true, mood: 'idle' } },
  key: { world: 'robocity', sprites: ['obj-door-open'], piko: true, bolt: { look: 'robot2', raincoat: true, mood: 'happy' }, sparkles: true },
  world10: { world: 'robohome', sprites: ['obj-lamp'], piko: true, bolt: { look: 'robot2', raincoat: true, mood: 'idle' } },
  home: { world: 'robohome', sprites: ['obj-vacuum-robot', 'obj-toaster-robot', 'obj-robot-small-1'], piko: true, bolt: { look: 'robot2', raincoat: true, mood: 'happy' }, sparkles: true },
  world11: { world: 'garden', sprites: ['obj-bud'], piko: true, fairy: 'curious' },
  wreath: { world: 'garden', sprites: ['obj-big-flower-open'], piko: true, fairy: 'happy', sparkles: true },
  world12: { world: 'forestpath', sprites: ['obj-bird', 'obj-owl'], fairy: 'singing' },
  feather: { world: 'forestpath', sprites: ['obj-bird'], piko: true, fairy: 'happy', sparkles: true },
  world13: { world: 'lilylake', sprites: ['obj-lily-pad', 'obj-frog'], fairy: 'idle' },
  lily: { world: 'lilylake', sprites: ['obj-lily', 'obj-frog'], piko: true, fairy: 'happy', sparkles: true },
  world14: { world: 'musictree', sprites: ['obj-note'], piko: true, fairy: 'singing' },
  harp: { world: 'musictree', sprites: ['obj-note'], piko: true, fairy: 'happy', sparkles: true },
  world15: { world: 'moonball', sprites: ['obj-firefly'], fairy: 'singing' },
  wings: { world: 'moonball', sprites: ['obj-firefly', 'obj-baby-bird'], piko: true, fairy: 'happy', sparkles: true },
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
    def.piko ? h('div', { class: 'story-piko' }, pikoElement(p.companion, def.mood && hasImage(`piko-${p.companion.kind}-${def.mood}`) ? def.mood : 'happy', 220)) : null,
    def.bolt ? h('div', { class: 'story-bolt' }, robotElement(def.bolt, def.bolt.mood, 180)) : null,
    def.fairy ? h('div', { class: 'story-melody' }, fairyElement(def.fairy, 160)) : null,
    def.fan ? fan() : null,
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
    cornerControls(),
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

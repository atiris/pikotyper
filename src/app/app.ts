import { audio } from '../audio/audio';
import { language, setLanguage, tList } from '../i18n/i18n';
import { LAYOUTS, type Layout } from '../keyboard/layouts';
import { Store } from '../storage/store';
import type { Lang, Profile } from '../storage/schema';
import { loadWords } from '../words/words';

export type ScreenName = 'start' | 'newProfile' | 'map' | 'level' | 'story' | 'parent' | 'wardrobe' | 'dragons' | 'about' | 'break';
export type Screen = (root: HTMLElement, params: any) => (() => void) | void;

const screens = new Map<ScreenName, Screen>();
let cleanup: (() => void) | void;

/** App-wide state. */
export const app = {
  store: new Store(),
  profile: null as Profile | null,
  words: [] as string[],
  /** Active play seconds since the session started (or the last break). */
  sessionSeconds: 0,
  /** A preparation tip was shown in this session. */
  tipShown: false,
  /** Menu music for this visit: the menu track or the extra relaxing one. */
  menuTrack: Math.random() < 0.5 ? 'menu' : 'relaxing',
  breakCount: 0,
};

export function layout(): Layout {
  return LAYOUTS[app.profile?.layout ?? 'sk-qwertz'];
}

export function registerScreen(name: ScreenName, s: Screen): void {
  screens.set(name, s);
}

export function go(name: ScreenName, params: any = {}): void {
  const root = document.querySelector<HTMLElement>('#app')!;
  try { cleanup?.(); } catch (e) { console.error(e); }
  document.querySelectorAll('.modal-back').forEach((m) => m.remove());
  root.replaceChildren();
  root.dataset.screen = name;
  window.scrollTo(0, 0);
  cleanup = screens.get(name)!(root, params);
}

export function saveProfile(): void {
  if (app.profile) app.store.update(app.profile);
}

/** Switches the UI language (and the word list when no profile decides it). */
export async function useLanguage(lang: Lang): Promise<void> {
  if (language() !== lang || !tList('tips').length) await setLanguage(lang);
  app.words = await loadWords(lang);
}

export async function selectProfile(p: Profile): Promise<void> {
  app.profile = p;
  if (p.id !== 'guest') {
    app.store.data.lastProfileId = p.id;
    app.store.save();
  }
  await useLanguage(p.language);
  applyProfileLook(p);
}

/** Applies per-profile look and sound: font, text size, contrast, motion, volumes. */
export function applyProfileLook(p: Profile | null): void {
  const b = document.body;
  const s = p?.settings;
  b.dataset.font = s?.font ?? 'lexend';
  b.classList.toggle('large-text', !!s?.largeText);
  b.classList.toggle('high-contrast', !!s?.highContrast);
  b.classList.toggle('reduce-motion', reduceMotion());
  audio.setVolumes(s?.sfxVolume ?? 0.7, s?.musicVolume ?? 0.5);
}

export function reduceMotion(): boolean {
  return !!app.profile?.settings.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Text for one random message of a pool, never the same line twice in a row. */
const lastLine = new Map<string, string>();
export function pickLine(pool: string, params: Record<string, string | number> = {}, extra: string[] = []): string {
  const lines = [...tList(pool, params), ...extra];
  if (!lines.length) return '';
  const prev = lastLine.get(pool);
  const choices = lines.length > 1 ? lines.filter((l) => l !== prev) : lines;
  const line = choices[Math.floor(Math.random() * choices.length)];
  lastLine.set(pool, line);
  return line;
}

export function isDebug(): boolean {
  return import.meta.env.DEV && new URLSearchParams(location.search).get('debug') === 'unlock-all';
}

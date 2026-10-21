import { DIACRITICS, PUNCTUATION, SHIFT_L, SHIFT_R, SPACE, firstKeys, lessonOrder } from '../learning/lessons';
import { RECENT_WRONG_KEEP } from '../learning/stats';
import {
  type CompanionKind,
  type Lang,
  type LayoutId,
  type ParentLock,
  type Profile,
  type StoreData,
  COMPANION_KINDS,
  GUEST_ID,
  defaultSettings,
  emptyKeyStat,
} from './schema';

export const STORE_KEY = 'pikotyper:v1';
const GUEST_KEY = 'pikotyper:guest';

export const STORE_VERSION = 10;

/** Migrations from older stored shapes, keyed by the version they upgrade from. */
const migrations: Record<number, (data: any) => any> = {
  // v2: key stats keep recent mistakes and a daily history instead of lifetime sums;
  // automatic difficulty and word length; growth medals.
  1: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV1toV2) : data.profiles }),
  // v3: Piko's paw help, charged by mistake-free streaks.
  2: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV2toV3) : data.profiles }),
  // v4: optional fullscreen on start.
  3: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV3toV4) : data.profiles }),
  // v5: space and punctuation in the lesson path; the one Shift key splits into left and right.
  4: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV4toV5) : data.profiles }),
  // v6: the child earns other companion kinds by stars; the current kind is the starting one.
  5: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV5toV6) : data.profiles }),
  // v7: the parent's own content (questions, surprises, words, text) and reading aloud.
  6: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV6toV7) : data.profiles }),
  // v8: tasks from a teacher's or parent's link.
  7: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map((p: any) => (p && typeof p === 'object' ? { ...p, tasks: [] } : p)) : data.profiles }),
  // v9: rescued dragons become little friends, dragons or robots.
  8: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV8toV9) : data.profiles }),
  // v10: an optional password on the parent screen; nothing to change.
  9: (data) => data,
};

function profileV8toV9(p: any): any {
  if (!p || typeof p !== 'object') return p;
  const { dragons, ...progress } = p.progress ?? {};
  const friends = Array.isArray(dragons) ? dragons.map((d: any) => ({ kind: 'dragon', ...d })) : [];
  return { ...p, progress: { ...progress, friends } };
}

function profileV6toV7(p: any): any {
  if (!p || typeof p !== 'object') return p;
  return {
    ...p,
    ownQuestions: [],
    surprises: [],
    settings: { ...p.settings, ownWords: [], ownText: '', ownMix: 'some', readAloud: false },
    progress: { ...p.progress, teasersAsked: 0, ownQuestionNext: 0, pendingQuestion: null },
  };
}

function profileV5toV6(p: any): any {
  if (!p || typeof p !== 'object') return p;
  const kind = COMPANION_KINDS.includes(p.companion?.kind) ? p.companion.kind : 'fox';
  return { ...p, progress: { ...p.progress, companionsUnlocked: [kind] } };
}

/** Keys the v5 lesson path added. */
const V5_KEYS = new Set([SPACE, SHIFT_L, SHIFT_R, ...PUNCTUATION]);

/**
 * The old `Shift` becomes both Shifts (its statistics too). A new key whose lesson
 * predecessor is already unlocked is unlocked as well, but not introduced, so its
 * card still shows once.
 */
export function profileV4toV5(p: any): any {
  if (!p || typeof p !== 'object') return p;
  const split = (keys: unknown) => (Array.isArray(keys) ? keys.flatMap((k) => (k === 'Shift' ? [SHIFT_L, SHIFT_R] : [k])) : keys);
  const progress = p.progress ?? {};
  const unlocked: string[] = Array.isArray(progress.unlockedKeys) ? split(progress.unlockedKeys) as string[] : [];
  const layout = p.layout === 'us-qwerty' || p.layout === 'sk-qwerty' ? p.layout : 'sk-qwertz';
  const skip = (k: string) => !!p.settings?.noDiacritics && DIACRITICS.has(k);
  let prev: string | null = null;
  for (const k of lessonOrder(layout)) {
    if (skip(k)) continue;
    if (V5_KEYS.has(k) && prev && unlocked.includes(prev) && !unlocked.includes(k)) unlocked.push(k);
    prev = k;
  }
  const { Shift: shiftStat, ...keys } = p.stats?.keys ?? {};
  if (shiftStat) {
    keys[SHIFT_L] = structuredClone(shiftStat);
    keys[SHIFT_R] = structuredClone(shiftStat);
  }
  return {
    ...p,
    settings: p.settings ? { ...p.settings, manualKeys: split(p.settings.manualKeys) } : p.settings,
    progress: { ...progress, unlockedKeys: unlocked, introducedKeys: split(progress.introducedKeys) },
    stats: p.stats ? { ...p.stats, keys } : p.stats,
  };
}

function profileV3toV4(p: any): any {
  if (!p || typeof p !== 'object') return p;
  return { ...p, settings: { ...p.settings, autoFullscreen: false } };
}

function profileV2toV3(p: any): any {
  if (!p || typeof p !== 'object') return p;
  return { ...p, progress: { ...p.progress, pawHelp: 0, pawAuto: false } };
}

function profileV1toV2(p: any): any {
  if (!p || typeof p !== 'object') return p;
  const keys: Record<string, any> = {};
  for (const [k, s] of Object.entries<any>(p.stats?.keys ?? {})) {
    const wrong = Object.entries<number>(s?.wrong ?? {}).flatMap(([ch, n]) => Array<string>(Math.min(n, RECENT_WRONG_KEEP)).fill(ch));
    keys[k] = { presses: s?.presses ?? 0, errors: s?.errors ?? 0, recent: Array.isArray(s?.recent) ? s.recent : [], recentWrong: wrong.slice(-RECENT_WRONG_KEEP), days: [] };
  }
  // Values a parent changed stay as they are; untouched defaults switch to automatic.
  const st = p.settings ?? {};
  const len = st.wordLen ?? [2, 6];
  // The get-ready card is shown before every level now.
  const { postureSeen: _seen, ...progress } = p.progress ?? {};
  return {
    ...p,
    progress,
    stats: { ...p.stats, keys },
    settings: { ...st, autoDifficulty: (st.difficulty ?? 3) === 3, autoWordLen: len[0] === 2 && len[1] === 6 },
  };
}

function emptyStore(): StoreData {
  return { version: STORE_VERSION, profiles: [], lastProfileId: null, language: null };
}

export function migrate(raw: any): StoreData {
  if (!raw || typeof raw !== 'object') return emptyStore();
  let data = raw;
  let version = typeof data.version === 'number' ? data.version : 1;
  while (migrations[version]) data = migrations[version](data), version++;
  const store: StoreData = { ...emptyStore(), ...data, version: STORE_VERSION };
  store.profiles = Array.isArray(store.profiles) ? store.profiles.filter(isProfile).map(normalizeProfile) : [];
  if (!isParentLock(store.parentLock)) delete store.parentLock;
  return store;
}

/** Fills fields that are missing in older or hand-edited profiles. */
export function normalizeProfile(p: Profile): Profile {
  const base = newProfile(p.name || '?', p.language === 'en' ? 'en' : 'sk', p.layout, p.avatar);
  return {
    ...base,
    ...p,
    companion: { ...base.companion, ...p.companion },
    settings: { ...base.settings, ...p.settings },
    progress: { ...base.progress, ...p.progress },
    stats: {
      keys: Object.fromEntries(Object.entries(p.stats?.keys ?? {}).map(([k, st]) => [k, { ...emptyKeyStat(), ...st }])),
      sessions: p.stats?.sessions ?? [],
    },
  };
}

function isParentLock(l: any): l is ParentLock {
  return !!l && typeof l === 'object' && typeof l.salt === 'string' && typeof l.hash === 'string';
}

export function isProfile(p: any): p is Profile {
  return !!p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string' &&
    typeof p.progress === 'object' && typeof p.settings === 'object';
}

export function newProfile(name: string, language: Lang, layout?: LayoutId, kind: CompanionKind = 'fox'): Profile {
  const lay: LayoutId = layout ?? (language === 'sk' ? 'sk-qwertz' : 'us-qwerty');
  const start: CompanionKind = COMPANION_KINDS.includes(kind) ? kind : 'fox';
  return {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name,
    avatar: start,
    companion: { name: 'Piko', kind: start, accessories: [] },
    customMessages: [],
    ownQuestions: [],
    surprises: [],
    tasks: [],
    layout: lay,
    language,
    settings: defaultSettings(),
    progress: {
      unlockedKeys: firstKeys(lay),
      introducedKeys: [],
      levels: {},
      worldsDone: [],
      rewards: [],
      friends: [],
      lastTips: [],
      scenesSeen: [],
      growth: 0,
      growthSeconds: 0,
      pawHelp: 0,
      pawAuto: false,
      companionsUnlocked: [start],
      teasersAsked: 0,
      ownQuestionNext: 0,
      pendingQuestion: null,
    },
    stats: { keys: {}, sessions: [] },
    createdAt: Date.now(),
  };
}

function safeGet(storage: Storage | undefined, key: string): string | null {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}

function safeSet(storage: Storage | undefined, key: string, value: string): boolean {
  try { storage?.setItem(key, value); return true; } catch { return false; }
}

export class Store {
  data: StoreData;
  guest: Profile | null = null;

  constructor(private local: Storage | undefined = globalThis.localStorage, private session: Storage | undefined = globalThis.sessionStorage) {
    let raw: any = null;
    try { raw = JSON.parse(safeGet(local, STORE_KEY) ?? 'null'); } catch { raw = null; }
    this.data = migrate(raw);
    try {
      const g = JSON.parse(safeGet(session, GUEST_KEY) ?? 'null');
      if (isProfile(g)) this.guest = normalizeProfile(g);
    } catch { this.guest = null; }
  }

  save(): boolean {
    if (this.guest) safeSet(this.session, GUEST_KEY, JSON.stringify(this.guest));
    return safeSet(this.local, STORE_KEY, JSON.stringify(this.data));
  }

  get profiles(): Profile[] {
    return this.data.profiles;
  }

  get(id: string): Profile | null {
    if (id === GUEST_ID) return this.guest;
    return this.data.profiles.find((p) => p.id === id) ?? null;
  }

  add(p: Profile): Profile {
    this.data.profiles.push(p);
    this.save();
    return p;
  }

  update(p: Profile): void {
    if (p.id === GUEST_ID) this.guest = p;
    else {
      const i = this.data.profiles.findIndex((x) => x.id === p.id);
      if (i >= 0) this.data.profiles[i] = p;
    }
    this.save();
  }

  remove(id: string): void {
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);
    if (this.data.lastProfileId === id) this.data.lastProfileId = null;
    this.save();
  }

  startGuest(language: Lang): Profile {
    if (!this.guest) {
      const g = newProfile('Guest', language);
      g.id = GUEST_ID;
      this.guest = g;
    }
    this.save();
    return this.guest;
  }

  /** JSON for the export file: one profile or all of them. */
  exportJson(ids?: string[]): string {
    const profiles = ids ? this.data.profiles.filter((p) => ids.includes(p.id)) : this.data.profiles;
    return JSON.stringify({ app: 'pikotyper', version: STORE_VERSION, exportedAt: new Date().toISOString(), profiles }, null, 2);
  }
}

export interface ImportPlan {
  profiles: Profile[];
  /** Profiles whose id already exists here. */
  conflicts: Profile[];
}

/** Validates an export file. Throws an Error with an i18n key as message when it is not valid. */
export function parseImport(text: string): Profile[] {
  let raw: any;
  try { raw = JSON.parse(text); } catch { throw new Error('import.errorJson'); }
  const file = raw?.app === 'pikotyper' && Array.isArray(raw.profiles) ? raw : isProfile(raw) ? { version: STORE_VERSION, profiles: [raw] } : null;
  if (!file) throw new Error('import.errorShape');
  const profiles = migrate({ version: file.version, profiles: file.profiles }).profiles;
  if (!profiles.length) throw new Error('import.errorShape');
  return profiles;
}

export function planImport(store: Store, profiles: Profile[]): ImportPlan {
  return { profiles, conflicts: profiles.filter((p) => store.data.profiles.some((x) => x.id === p.id)) };
}

/** Applies an import. `replace`: conflicting profiles overwrite; otherwise both are kept. */
export function applyImport(store: Store, plan: ImportPlan, replace: boolean): void {
  for (const p of plan.profiles) {
    const i = store.data.profiles.findIndex((x) => x.id === p.id);
    if (i >= 0 && replace) store.data.profiles[i] = p;
    else if (i >= 0) store.data.profiles.push({ ...p, id: newProfile(p.name, p.language).id });
    else store.data.profiles.push(p);
  }
  store.save();
}

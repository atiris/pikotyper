import { firstKeys } from '../learning/lessons';
import { RECENT_WRONG_KEEP } from '../learning/stats';
import {
  type CompanionKind,
  type Lang,
  type LayoutId,
  type Profile,
  type StoreData,
  COMPANION_KINDS,
  GUEST_ID,
  defaultSettings,
  emptyKeyStat,
} from './schema';

export const STORE_KEY = 'pikotyper:v1';
const GUEST_KEY = 'pikotyper:guest';

export const STORE_VERSION = 2;

/** Migrations from older stored shapes, keyed by the version they upgrade from. */
const migrations: Record<number, (data: any) => any> = {
  // v2: key stats keep recent mistakes and a daily history instead of lifetime sums;
  // automatic difficulty and word length; growth medals.
  1: (data) => ({ ...data, profiles: Array.isArray(data.profiles) ? data.profiles.map(profileV1toV2) : data.profiles }),
};

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

export function isProfile(p: any): p is Profile {
  return !!p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string' &&
    typeof p.progress === 'object' && typeof p.settings === 'object';
}

export function newProfile(name: string, language: Lang, layout?: LayoutId, kind: CompanionKind = 'fox'): Profile {
  const lay: LayoutId = layout ?? (language === 'sk' ? 'sk-qwertz' : 'us-qwerty');
  return {
    id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name,
    avatar: COMPANION_KINDS.includes(kind) ? kind : 'fox',
    companion: { name: 'Piko', kind: COMPANION_KINDS.includes(kind) ? kind : 'fox', accessories: [] },
    customMessages: [],
    layout: lay,
    language,
    settings: defaultSettings(),
    progress: {
      unlockedKeys: firstKeys(lay),
      introducedKeys: [],
      levels: {},
      worldsDone: [],
      rewards: [],
      dragons: [],
      lastTips: [],
      scenesSeen: [],
      growth: 0,
      growthSeconds: 0,
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

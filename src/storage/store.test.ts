import { describe, expect, it } from 'vitest';
import { STORE_KEY, STORE_VERSION, Store, applyImport, migrate, newProfile, parseImport, planImport } from './store';

class MemStorage {
  map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(k: string) { return this.map.get(k) ?? null; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  removeItem(k: string) { this.map.delete(k); }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

const mem = () => new MemStorage() as unknown as Storage;

describe('Store', () => {
  it('saves and loads profiles', () => {
    const local = mem();
    const s = new Store(local, mem());
    s.add(newProfile('Ema', 'sk'));
    const again = new Store(local, mem());
    expect(again.profiles.map((p) => p.name)).toEqual(['Ema']);
    expect(JSON.parse(local.getItem(STORE_KEY)!).version).toBe(STORE_VERSION);
  });

  it('keeps the guest only in session storage', () => {
    const local = mem(), session = mem();
    const s = new Store(local, session);
    const g = s.startGuest('en');
    g.progress.levels['w1-1'] = 3;
    s.update(g);
    expect(new Store(local, session).guest?.progress.levels['w1-1']).toBe(3);
    expect(new Store(local, mem()).guest).toBeNull();
    expect(new Store(local, session).profiles).toHaveLength(0);
  });

  it('survives broken data', () => {
    const local = mem();
    local.setItem(STORE_KEY, '{oops');
    expect(new Store(local, mem()).profiles).toEqual([]);
    expect(migrate({ version: 1, profiles: [{ nope: true }] }).profiles).toEqual([]);
  });

  it('fills missing fields of older profiles', () => {
    const p: any = newProfile('Ema', 'sk');
    delete p.settings.font;
    delete p.progress.friends;
    const out = migrate({ version: 1, profiles: [p] }).profiles[0];
    expect(out.settings.font).toBe('lexend');
    expect(out.progress.friends).toEqual([]);
  });

  it('upgrades v1 key stats and keeps settings a parent changed', () => {
    const p: any = newProfile('Ema', 'sk');
    p.settings.difficulty = 6;
    delete p.settings.autoDifficulty;
    delete p.settings.autoWordLen;
    p.stats.keys.f = { presses: 10, errors: 2, rtSum: 4000, rtCount: 8, recent: [400, 0, 400], wrong: { g: 2 } };
    const out = migrate({ version: 1, profiles: [p] }).profiles[0];
    expect(out.stats.keys.f).toEqual({ presses: 10, errors: 2, recent: [400, 0, 400], recentWrong: ['g', 'g'], days: [] });
    expect(out.settings.autoDifficulty).toBe(false);
    expect(out.settings.autoWordLen).toBe(true);
  });

  it('gives v2 profiles an empty paw help', () => {
    const p: any = newProfile('Ema', 'sk');
    delete p.progress.pawHelp;
    delete p.progress.pawAuto;
    const out = migrate({ version: 2, profiles: [p] }).profiles[0];
    expect(out.progress.pawHelp).toBe(0);
    expect(out.progress.pawAuto).toBe(false);
  });

  it('gives v3 profiles no automatic fullscreen', () => {
    const p: any = newProfile('Ema', 'sk');
    delete p.settings.autoFullscreen;
    const out = migrate({ version: 3, profiles: [p] }).profiles[0];
    expect(out.settings.autoFullscreen).toBe(false);
  });

  it('splits the v4 Shift into both Shifts, stats included', () => {
    const p: any = newProfile('Ema', 'sk');
    p.progress.unlockedKeys = [...'fjdkslaôgheiruotncvmpbzywxq', 'Shift'];
    p.progress.introducedKeys = [...p.progress.unlockedKeys];
    p.settings.manualKeys = ['f', 'Shift'];
    p.stats.keys.Shift = { presses: 3, errors: 1, recent: [400, 0, 500], recentWrong: ['a'], days: [] };
    const out = migrate({ version: 4, profiles: [p] }).profiles[0];
    expect(out.progress.unlockedKeys).toEqual(expect.arrayContaining(['ShiftL', 'ShiftR']));
    expect(out.progress.unlockedKeys).not.toContain('Shift');
    expect(out.progress.introducedKeys).toEqual(expect.arrayContaining(['ShiftL', 'ShiftR']));
    expect(out.settings.manualKeys).toEqual(['f', 'ShiftL', 'ShiftR']);
    expect(out.stats.keys.ShiftL).toEqual(p.stats.keys.Shift);
    expect(out.stats.keys.ShiftR).toEqual(p.stats.keys.Shift);
    expect(out.stats.keys.Shift).toBeUndefined();
  });

  it('unlocks the new keys a v4 profile already passed, without introducing them', () => {
    const p: any = newProfile('Ema', 'sk');
    p.progress.unlockedKeys = [...'fjdkslaôgheiru'];
    p.progress.introducedKeys = [...p.progress.unlockedKeys];
    const out = migrate({ version: 4, profiles: [p] }).profiles[0];
    expect(out.progress.unlockedKeys).toEqual([...'fjdkslaôgheiru', ' ', '.']);
    expect(out.progress.introducedKeys).not.toContain('.');
    expect(out.progress.introducedKeys).not.toContain(' ');
  });

  it('chains new keys and skips diacritics a parent turned off', () => {
    const p: any = newProfile('Ema', 'sk');
    p.settings.noDiacritics = true;
    p.progress.unlockedKeys = [...'fjdkslaôgheiruotncvmpbzywxq', 'Shift'];
    const out = migrate({ version: 4, profiles: [p] }).profiles[0];
    expect(out.progress.unlockedKeys).toEqual(expect.arrayContaining([' ', '.', ',', '?', '-', '!', ':']));
    const fresh = migrate({ version: 4, profiles: [{ ...p, settings: { ...p.settings, noDiacritics: false } }] }).profiles[0];
    expect(fresh.progress.unlockedKeys).not.toContain('!');
  });

  it('starts v5 profiles with their current companion kind', () => {
    const p: any = newProfile('Ema', 'sk', undefined, 'owl');
    delete p.progress.companionsUnlocked;
    const out = migrate({ version: 5, profiles: [p] }).profiles[0];
    expect(out.progress.companionsUnlocked).toEqual(['owl']);
  });

  it('gives v6 profiles empty own content with reading aloud off', () => {
    const p: any = newProfile('Ema', 'sk');
    delete p.surprises;
    for (const k of ['ownWords', 'ownText', 'ownMix', 'readAloud']) delete p.settings[k];
    const out = migrate({ version: 6, profiles: [p] }).profiles[0];
    expect(out.surprises).toEqual([]);
    expect(out.settings).toMatchObject({ ownWords: [], ownText: '', ownMix: 'some', readAloud: false });
  });

  it('v7 -> v8 adds an empty task list', () => {
    const p: any = newProfile('Ema', 'sk');
    delete p.tasks;
    expect(migrate({ version: 7, profiles: [p] }).profiles[0].tasks).toEqual([]);
  });

  it('v8 -> v9 turns rescued dragons into dragon friends', () => {
    const p: any = newProfile('Ema', 'sk');
    delete p.progress.friends;
    p.progress.dragons = [{ name: 'Luna', hue: 40, date: '2026-05-01' }];
    const out = migrate({ version: 8, profiles: [p] }).profiles[0];
    expect(out.progress.friends).toEqual([{ kind: 'dragon', name: 'Luna', hue: 40, date: '2026-05-01' }]);
    expect('dragons' in out.progress).toBe(false);
  });

  it('v9 -> v10 keeps the data and has no parent lock', () => {
    const out = migrate({ version: 9, profiles: [newProfile('Ema', 'sk')], lastProfileId: null, language: 'sk' });
    expect(out.version).toBe(STORE_VERSION);
    expect(out.profiles).toHaveLength(1);
    expect('parentLock' in out).toBe(false);
  });

  it('v10 -> v11 resets surprises, drops own questions and counts the trained time', () => {
    const p: any = newProfile('Ema', 'sk');
    p.ownQuestions = [{ q: 'Q', a: 'A' }];
    p.surprises = [{ id: '1', q: 'q', a: 'a', place: 'next', minStars: 2 }];
    for (const k of ['trainedSeconds', 'levelsFinished', 'starsEarned']) delete p.progress[k];
    Object.assign(p.progress, { teasersAsked: 3, ownQuestionNext: 1, pendingQuestion: 0 });
    p.stats.sessions = [{ date: '2026-10-20', seconds: 300, chars: 0, errors: 0, cpm: 0 }, { date: '2026-10-21', seconds: 120, chars: 0, errors: 0, cpm: 0 }];
    const out: any = migrate({ version: 10, profiles: [p] }).profiles[0];
    expect(out.surprises).toEqual([]);
    expect('ownQuestions' in out).toBe(false);
    for (const k of ['teasersAsked', 'ownQuestionNext', 'pendingQuestion']) expect(k in out.progress).toBe(false);
    expect(out.progress).toMatchObject({ trainedSeconds: 420, levelsFinished: 0, starsEarned: 0 });
  });

  it('v11 -> v12 starts the star and level counters from the levels already played', () => {
    const p: any = newProfile('Ema', 'sk');
    Object.assign(p.progress, { levels: { 'meadow-1': 3, 'meadow-2': 1 }, levelsFinished: 0, starsEarned: 2 });
    const out: any = migrate({ version: 11, profiles: [p] }).profiles[0];
    expect(out.progress).toMatchObject({ levelsFinished: 2, starsEarned: 4 });
  });

  it('v12 -> v13 lets just typing read typed words', () => {
    const p: any = newProfile('Ema', 'sk');
    delete p.settings.speakTyped;
    expect(migrate({ version: 12, profiles: [p] }).profiles[0].settings.speakTyped).toBe(true);
  });

  it('keeps a parent lock and drops a broken one', () => {
    const lock = { salt: 'ab', hash: 'cd' };
    expect(migrate({ version: 11, profiles: [], parentLock: lock }).parentLock).toEqual(lock);
    expect('parentLock' in migrate({ version: 11, profiles: [], parentLock: { salt: 1 } })).toBe(false);
  });
});

describe('export and import', () => {
  it('round-trips and asks before replacing', () => {
    const a = new Store(mem(), mem());
    const p = a.add(newProfile('Ema', 'sk'));
    const json = a.exportJson();
    const b = new Store(mem(), mem());
    const plan = planImport(b, parseImport(json));
    expect(plan.conflicts).toHaveLength(0);
    applyImport(b, plan, false);
    expect(b.profiles[0].id).toBe(p.id);
    const again = planImport(b, parseImport(json));
    expect(again.conflicts).toHaveLength(1);
    applyImport(b, again, false);
    expect(b.profiles).toHaveLength(2);
    expect(b.profiles[1].id).not.toBe(p.id);
  });

  it('rejects files that are not PikoTyper exports', () => {
    expect(() => parseImport('nope')).toThrow('import.errorJson');
    expect(() => parseImport('{"hello":1}')).toThrow('import.errorShape');
  });
});

import { type Profile, type SessionRecord, emptyKeyStat } from '../storage/schema';
import { MASTERY_WINDOW, SHIFT_KEY, recentAccuracy } from './lessons';

const RECENT_KEEP = MASTERY_WINDOW * 2;
/** Reaction times above this are pauses, not slowness. */
const RT_CAP = 4000;

export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Records one key press against the expected character. */
export function recordPress(profile: Profile, expected: string, typed: string, reactionMs: number): void {
  const keys = expected !== expected.toLowerCase() ? [expected.toLowerCase(), SHIFT_KEY] : [expected];
  const ok = typed === expected;
  const rt = Math.max(1, Math.min(RT_CAP, Math.round(reactionMs)));
  for (const key of keys) {
    const s = (profile.stats.keys[key] ??= emptyKeyStat());
    s.presses++;
    if (ok) {
      s.rtSum += rt;
      s.rtCount++;
    } else {
      s.errors++;
      s.wrong[typed] = (s.wrong[typed] ?? 0) + 1;
    }
    s.recent.push(ok ? rt : 0);
    if (s.recent.length > RECENT_KEEP) s.recent.splice(0, s.recent.length - RECENT_KEEP);
  }
}

/** Adds play time and characters to today's session record. */
export function recordSession(profile: Profile, seconds: number, chars: number, errors: number, cpm: number): void {
  const date = localDate();
  const sessions = profile.stats.sessions;
  let s: SessionRecord | undefined = sessions[sessions.length - 1];
  if (!s || s.date !== date) {
    s = { date, seconds: 0, chars: 0, errors: 0, cpm: 0 };
    sessions.push(s);
  }
  const prevChars = s.chars;
  s.seconds += Math.round(seconds);
  s.chars += chars;
  s.errors += errors;
  if (cpm > 0) s.cpm = Math.round((s.cpm * prevChars + cpm * chars) / Math.max(1, prevChars + chars));
  if (sessions.length > 365) sessions.splice(0, sessions.length - 365);
}

export interface KeyReport {
  key: string;
  presses: number;
  accuracy: number;
  avgMs: number;
  topWrong: string | null;
  /** 0..1 how well it goes; higher is better. */
  score: number;
}

export function keyReport(profile: Profile, key: string): KeyReport | null {
  const s = profile.stats.keys[key];
  if (!s || !s.presses) return null;
  const accuracy = (s.presses - s.errors) / s.presses;
  const avgMs = s.rtCount ? s.rtSum / s.rtCount : 0;
  const topWrong = Object.entries(s.wrong).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const recentAcc = s.recent.length ? recentAccuracy(s) : accuracy;
  const speed = avgMs ? Math.max(0, Math.min(1, (2000 - avgMs) / 1400)) : 0.5;
  return { key, presses: s.presses, accuracy, avgMs, topWrong, score: recentAcc * 0.75 + speed * 0.25 };
}

/** Keys that need practice most, worst first (only keys with enough data). */
export function weakKeys(profile: Profile, keys: string[], count = 3): KeyReport[] {
  return keys
    .map((k) => keyReport(profile, k))
    .filter((r): r is KeyReport => !!r && r.presses >= 5)
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

/** Weight of each key for word picking: weak and slow keys appear more often. */
export function keyWeights(profile: Profile, keys: string[]): Record<string, number> {
  const w: Record<string, number> = {};
  for (const k of keys) {
    const r = keyReport(profile, k);
    w[k] = r ? 1 + (1 - r.score) * 3 : 1.5;
  }
  return w;
}

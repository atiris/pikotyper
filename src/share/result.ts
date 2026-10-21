import { weakKeys } from '../learning/stats';
import type { Profile, Task } from '../storage/schema';
import { checksum, decode, encode } from './codec';

/** What a child hands in after a task. */
export interface TaskResult {
  taskId: string;
  title: string;
  name: string;
  /** Local date the task was finished. */
  date: string;
  /** Minutes played, one decimal. */
  minutes: number;
  /** Percent of correct presses. */
  accuracy: number;
  /** Rhythm, correct characters per minute. */
  cpm: number;
  /** The weakest keys now, with their recent accuracy in percent, weakest first. */
  weak: [string, number][];
}

export const RESULT_WEAK_KEYS = 5;

export function makeResult(p: Profile, task: Task): TaskResult {
  const total = task.chars + task.errors;
  return {
    taskId: task.id,
    title: task.title,
    name: p.name,
    date: task.doneAt ?? '',
    minutes: Math.round(task.seconds / 6) / 10,
    accuracy: total ? Math.round((task.chars / total) * 100) : 100,
    cpm: task.cpm,
    weak: weakKeys(p, Object.keys(p.stats.keys), RESULT_WEAK_KEYS).map((k) => [k.key, Math.round(k.accuracy * 100)]),
  };
}

/** Fields in a fixed order, so the checksum does not depend on how the object was built. */
const sumOf = (r: TaskResult) => checksum(JSON.stringify([r.taskId, r.title, r.name, r.date, r.minutes, r.accuracy, r.cpm, r.weak]));

export function resultCode(r: TaskResult): Promise<string> {
  return encode({ app: 'pikotyper', type: 'result', ...r, sum: sumOf(r) });
}

/** A handed-in result; `intact` is false when the checksum does not match (a broken copy). Throws `share.broken`. */
export async function parseResult(code: string): Promise<{ result: TaskResult; intact: boolean }> {
  const v: any = await decode(code);
  if (v?.app !== 'pikotyper' || v.type !== 'result') throw new Error('share.broken');
  const str = (x: unknown) => (typeof x === 'string' ? x.slice(0, 80) : '');
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0);
  const result: TaskResult = {
    taskId: str(v.taskId),
    title: str(v.title),
    name: str(v.name),
    date: str(v.date),
    minutes: num(v.minutes),
    accuracy: num(v.accuracy),
    cpm: num(v.cpm),
    weak: Array.isArray(v.weak) ? v.weak.filter((w: unknown) => Array.isArray(w) && typeof w[0] === 'string').slice(0, RESULT_WEAK_KEYS).map((w: any[]) => [w[0].slice(0, 12), num(w[1])]) : [],
  };
  if (!result.name || !result.taskId) throw new Error('share.broken');
  return { result, intact: v.sum === sumOf(result) };
}

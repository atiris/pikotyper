import { describe, expect, it } from 'vitest';
import { newProfile } from '../storage/store';
import { CODEC_VERSION, checksum, codeFrom, decode, encode } from './codec';
import { makeResult, parseResult, resultCode } from './result';
import { activeTask, addTask, parseTask, recordTaskRun, taskCode, taskOwn } from './task';
import { TeacherStore } from './teacher';
import { moveCode, parseMove, trimHistory } from './transfer';

const b64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (code: string) => Uint8Array.from(atob(code.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

describe('codec', () => {
  it('round-trips with link-safe characters', async () => {
    const value = { a: 'Ťažký kôň ľúbi ďatelinu', n: [1, 2, 3], deep: { x: null } };
    const code = await encode(value);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decode(code)).toEqual(value);
  });

  it('starts with the version byte and refuses an unknown one', async () => {
    const bytes = unb64(await encode({ a: 1 }));
    expect(bytes[0]).toBe(CODEC_VERSION);
    bytes[0] = 99;
    await expect(decode(b64([...bytes]))).rejects.toThrow('share.broken');
  });

  it('refuses broken input', async () => {
    const code = await encode({ text: 'a long enough text to compress somewhat '.repeat(5) });
    await expect(decode(code.slice(0, code.length / 2))).rejects.toThrow('share.broken');
    await expect(decode('not a code!')).rejects.toThrow('share.broken');
    await expect(decode('')).rejects.toThrow('share.broken');
  });

  it('finds the code in a pasted link', () => {
    expect(codeFrom('https://x.org/pikotyper/#/result/AbC_-123456', 'result')).toBe('AbC_-123456');
    expect(codeFrom('  AbC_-123456 ', 'result')).toBe('AbC_-123456');
    expect(codeFrom('https://x.org/#/task/AbC_-123456', 'result')).toBe(null);
  });

  it('checksum changes with the text', () => {
    expect(checksum('abc')).toMatch(/^[0-9a-f]{8}$/);
    expect(checksum('abc')).not.toBe(checksum('abd'));
  });
});

describe('tasks', () => {
  const spec = { id: 't1', title: 'Zvieratá', words: ['pes', 'mačka'], text: '', minutes: 2, kind: 'practice' as const };

  it('travel by code and come back cleaned', async () => {
    expect(await parseTask(await taskCode({ ...spec, minutes: 99, title: `  ${'x'.repeat(100)}` }))).toMatchObject({ minutes: 20, title: 'x'.repeat(60) });
    await expect(parseTask(await encode({ app: 'pikotyper', type: 'task', id: 'x', title: 'y', words: [], text: '' }))).rejects.toThrow('share.broken');
  });

  it('finish when their time is played, and keep play when given again', () => {
    const p = newProfile('Ema', 'sk');
    const task = addTask(p, spec);
    expect(activeTask(p)).toBe(task);
    expect(recordTaskRun(task, { seconds: 70, chars: 50, errors: 5, cpm: 40 })).toBe(false);
    expect(addTask(p, spec).seconds).toBe(70);
    expect(p.tasks).toHaveLength(1);
    expect(recordTaskRun(p.tasks[0], { seconds: 49, chars: 50, errors: 0, cpm: 44 })).toBe(true);
    expect(p.tasks[0].doneAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(activeTask(p)).toBe(null);
    expect(taskOwn(p.tasks[0]).share).toBe(1);
  });
});

describe('results', () => {
  it('round-trip, and a changed copy is not intact', async () => {
    const p = newProfile('Ema', 'sk');
    const task = addTask(p, { id: 't1', title: 'Zvieratá', words: ['pes'], text: '', minutes: 1, kind: 'story' });
    recordTaskRun(task, { seconds: 60, chars: 90, errors: 10, cpm: 50 });
    const r = makeResult(p, task);
    expect(r).toMatchObject({ name: 'Ema', minutes: 1, accuracy: 90, cpm: 50 });
    const back = await parseResult(await resultCode(r));
    expect(back).toEqual({ result: r, intact: true });
    const forged = await encode({ ...(await decode(await resultCode(r)) as object), accuracy: 100 });
    expect((await parseResult(forged)).intact).toBe(false);
  });

  it('teacher store keeps one result per child and task, and exports CSV', () => {
    const map = new Map<string, string>();
    const local = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) } as unknown as Storage;
    const s = new TeacherStore(local);
    const r = { taskId: 't1', title: 'Zvieratá', name: 'Ema', date: '2026-10-21', minutes: 2, accuracy: 90, cpm: 50, weak: [['ô', 70]] as [string, number][] };
    expect(s.add(r, true)).toBe(true);
    expect(s.add(r, true)).toBe(false);
    s.add({ ...r, accuracy: 95 }, true);
    s.add({ ...r, name: 'Adam, "A"' }, false);
    expect(new TeacherStore(local).results).toHaveLength(2);
    const csv = s.csv(['task', 'child', 'date', 'min', 'acc', 'cpm', 'weak', 'broken'], (k) => k);
    expect(csv.split('\n')).toEqual([
      'task,child,date,min,acc,cpm,weak,broken',
      'Zvieratá,"Adam, ""A""",2026-10-21,2,90,50,ô 70 %,!',
      'Zvieratá,Ema,2026-10-21,2,95,50,ô 70 %,',
    ]);
  });
});

describe('move', () => {
  it('carries a whole profile, dropping old key history when too long', async () => {
    const p = newProfile('Ema', 'sk');
    p.stats.keys.f = { presses: 2, errors: 0, recent: [300, 300], recentWrong: [], days: [
      { date: '2026-01-01', presses: 1, errors: 0, rtSum: 300, rtCount: 1 },
      { date: '2026-10-20', presses: 1, errors: 0, rtSum: 300, rtCount: 1 },
    ] };
    expect(trimHistory(p, 30, new Date(2026, 9, 21)).stats.keys.f.days.map((d) => d.date)).toEqual(['2026-10-20']);
    const back = await parseMove((await moveCode(p, ''))!);
    expect(back.id).toBe(p.id);
    expect(back.stats.keys.f.days).toHaveLength(2);
    expect(await moveCode(p, '', 50)).toBe(null);
  });
});

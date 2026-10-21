import type { TaskResult } from './result';

/** The teacher's collected results live apart from the players, in this browser only. */
export const TEACHER_KEY = 'pikotyper:teacher';

export interface StoredResult extends TaskResult {
  /** The checksum matched when the result was added. */
  intact: boolean;
}

export class TeacherStore {
  results: StoredResult[] = [];

  constructor(private local: Storage | undefined = globalThis.localStorage) {
    try {
      const raw = JSON.parse(local?.getItem(TEACHER_KEY) ?? 'null');
      if (raw?.version === 1 && Array.isArray(raw.results)) this.results = raw.results;
    } catch { this.results = []; }
  }

  save(): void {
    try { this.local?.setItem(TEACHER_KEY, JSON.stringify({ version: 1, results: this.results })); } catch { /* full or blocked storage: kept for this visit */ }
  }

  /** Adds a result; the same child's result of the same task replaces the older one. False when it was already here unchanged. */
  add(r: TaskResult, intact: boolean): boolean {
    const i = this.results.findIndex((x) => x.taskId === r.taskId && x.name === r.name);
    const next = { ...r, intact };
    if (i >= 0 && JSON.stringify(this.results[i]) === JSON.stringify(next)) return false;
    if (i >= 0) this.results.splice(i, 1);
    this.results.push(next);
    this.save();
    return true;
  }

  remove(r: StoredResult): void {
    this.results = this.results.filter((x) => x !== r);
    this.save();
  }

  /** Results by task, then by child. */
  sorted(): StoredResult[] {
    return [...this.results].sort((a, b) => a.title.localeCompare(b.title) || a.taskId.localeCompare(b.taskId) || a.name.localeCompare(b.name));
  }

  /** CSV for a spreadsheet; `head` are the translated column names. */
  csv(head: string[], keyName: (k: string) => string): string {
    const cell = (v: string | number) => (/[",;\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const rows = this.sorted().map((r) => [r.title, r.name, r.date, r.minutes, r.accuracy, r.cpm, r.weak.map(([k, a]) => `${keyName(k)} ${a} %`).join(', '), r.intact ? '' : '!']);
    return [head, ...rows].map((row) => row.map(cell).join(',')).join('\n');
  }
}

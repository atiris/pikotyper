# 10 Tasks, results and player transfer by links (no server)

Depends on 09 (a task uses own words/text). The owner chose: no server, links and
codes only, nothing stored outside the browsers. Affected: new `src/share/`
(codec, task, result, transfer), `src/app/app.ts` + `src/main.ts` (routes),
`src/screens/parent.ts`, new `src/screens/teacher.ts`, `src/screens/map.ts`,
`src/storage/schema.ts` + migration, `public/i18n/*.json`, `.specify/profiles/`,
README. Possibly one small dependency for QR codes (`qrcode-generator`, MIT,
pinned exact version) if the bundle grows by less than 25 kB gzip.

## Why
A teacher or parent wants to give today's task and get the child's results back,
and a child wants to move to another computer without copying JSON files.

## Decisions
- **Codec**: JSON -> `CompressionStream('deflate-raw')` -> base64url. A version
  byte first, so the format can change later. Links use the hash route, so the data
  never reaches a server: `#/task/<code>`, `#/result/<code>`, `#/move/<code>`.
- **Task** (made in the parent area, new tab "Úloha"): title, own words and/or
  text, minutes (1-20), what to do (free practice with the task's words, or the
  next story level with the task's words mixed in "most"). Output: a link to copy
  and a QR image. Opening the link asks which player takes it (or a new one); the
  map then shows the task as the first card "Úloha na dnes" until done.
- **Result**: after the task, the child sees "Odovzdať" with a link + short
  instruction ("pošli tento odkaz učiteľovi, napr. cez Edupage alebo e-mail").
  Content: player name, task title, date, minutes, accuracy, rhythm, the 5 weakest
  keys with accuracy, and a checksum (detects broken copies, not cheating; say so
  in the UI).
- **Teacher view** (`#/teacher`, reachable from the start page footer and by
  opening a result link): pasted or opened results are kept in this browser's
  storage (separate key `pikotyper:teacher`), shown as a table by task and child,
  with delete and CSV export. No accounts.
- **Move a player**: parent area -> player -> "Preniesť na iný počítač" shows a
  link + QR containing the whole profile (compressed). If the link would be longer
  than 8000 chars, drop the per-day key history older than 30 days first; if still
  too long, offer the file export as today. Opening the link imports the profile
  (asks before replacing a player with the same id).
- Schema: `Profile.tasks: { id, title, words, text, minutes, kind, doneAt? }[]`;
  migration adds `tasks: []`.

## Steps
- [x] Codec with unit tests (round trip, version byte, broken input).
- [ ] Routes and screens: task import, result view, teacher table, move import.
- [ ] Parent area: task builder, transfer link/QR.
- [ ] Map task card and the "Odovzdať" flow after the task.
- [ ] Specs (`.specify/profiles/teacher-links.md` new, index updated,
  `privacy.md`: still nothing leaves the browser except what the user copies),
  i18n sk + en, README section "For teachers".
- [ ] Build, vitest, e2e: parent builds a task -> second context opens the link ->
  plays it -> opens the result link in a third context -> teacher table shows one row.

## Notes (decisions taken while implementing)
- `Task` also keeps the play collected over all its runs (`seconds`, `chars`, `errors`,
  `cpm`): a story task needs several levels to fill its minutes, and the result sums them.
  A task is done when its minutes are played (2 s slack); a timed practice task does it in one run.
- The result's 5 weakest keys are the child's weakest keys now (recent window), not only
  the keys of the task's runs: same statistics the parent dashboard shows.
- The teacher store keeps one result per child and task; a newer hand-in replaces it.
- QR: `qrcode-generator` 2.0.4 (7.5 kB gzip). A QR holds at most ~2900 bytes, so it is shown
  only for links that fit; longer links (most move links) are copy-only.

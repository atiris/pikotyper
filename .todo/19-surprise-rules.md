# 19 Surprises as rules: teaser and answer with a trigger, in one table

Client side only: `src/storage/schema.ts` + `src/storage/store.ts` (migration),
`src/game/own-content.ts` (+ test), `src/game/runtime.ts`, `src/game/cards.ts`
(get-ready card), `src/screens/level.ts` (results), `src/screens/parent.ts` (Prekvapenia
tab), `src/share/*` only if links carry surprises or own questions (check),
`src/styles.css`, `public/i18n/*.json`, specs `.specify/profiles/parent-controls.md`,
`.specify/companion/piko.md`, `.specify/game/mechanics.md`.
**Schema change:** `Surprise` becomes a rule (below), `ownQuestions`,
`progress.pendingQuestion` and `progress.ownQuestionNext` go away. Bump the store
`version` with a migration. If plan 18 lands first, take the number after it.
Do this after plan 16 (compact results card).

## Why
- Parents use surprises as real rewards ("where is the candy?"). They want to say
  exactly when the answer comes: after a given level, after some minutes of training,
  after some more levels or stars. They also want a pool of free questions asked now
  and then over a long time.
- One table shows all rules, their state and what is done.
- Own questions mixed into Piko's teasers overlap with this, so the owner drops them,
  together with the ones stored now.
- The answer must always appear together with its question. After a level the child
  may not remember the question any more. This holds for Piko's built-in teasers too.

## Decisions
- **Rule** (`Surprise`):
  `{ id, q, a, trigger, n?, level?, repeat: boolean, createdAt, progressFrom?, doneAt?, lastShownAt? }`
  - `trigger: 'level'`: `level` is a story level id (world + level picked in the form).
    The teaser shows on the get-ready card of that level. The answer shows on its
    results when the level is finished.
  - `trigger: 'minutes'`: after `n` minutes of training (story levels and practice, the
    time `recordSession` counts) since `progressFrom` (creation or the last reveal).
    The teaser shows on every get-ready card while waiting, with "ešte {m} min". The
    answer shows on the results of the level during which the time is reached.
  - `trigger: 'levels'`: after `n` more finished levels since `progressFrom`.
    Shown the same way as minutes ("ešte {k} úrovne").
  - `trigger: 'stars'`: after `n` more stars since `progressFrom` (store the star total
    at `progressFrom`). Shown the same way ("ešte {k} hviezdičiek").
  - `trigger: 'random'`: a free question from the pool. After a finished level, with a
    chance of 1 in 3 when no other rule fires and none was shown today, one random
    pending random rule shows question and answer together on the results.
  - `repeat: false`: after the reveal `doneAt` is set; the rule stays in the table as
    done and is never shown again. `repeat: true`: the counter starts again from the
    reveal (`progressFrom` = now); a level rule fires every time that level is finished;
    a random rule goes back to the pool (no repeat on the same day).
- At most one surprise per level run. Order: level, minutes, levels, stars, random.
  Piko's built-in teaser is not shown in a run that has a surprise.
- **Results:** the surprise block shows the question (Piko asks) and right under it the
  answer, highlighted. When a waiting rule is not reached yet, it shows the question
  with "ešte ..." instead of the answer. Piko's built-in teaser answer ("Sľúbená
  odpoveď") also shows its question above it.
- **Prekvapenia tab** (`parent.ts`): one table with the columns Otázka (teaser),
  Odpoveď, Kedy (trigger in words, e.g. "Svet 1 · Úroveň 4", "po 20 min tréningu",
  "po 3 ďalších úrovniach", "po 10 ďalších hviezdičkách", "náhodne"), Opakovať
  (yes/no), Stav ("čaká", progress like "12 / 20 min", "hotové 21. 10."), and actions
  (edit, delete). Under it, a form: question, answer, trigger select with its field
  (level picker / number), repeat checkbox, "Pridať". Keep a sane max (e.g. 50 rules).
  On a narrow screen the table turns into cards.
- **Removed:** the own questions editor and data, and their use in the teaser rotation
  (`own-content.ts`). Built-in Piko teasers stay.
- **Migration:** old surprises become rules: `place` = level id -> `trigger 'level'`,
  `next` -> `trigger 'levels'` with `n = 1`, `practice` -> `trigger 'minutes'` with
  `n = 1`. `minStars` is dropped. A `revealedAt` becomes `doneAt`, `repeat: false`.
  Drop `ownQuestions` and the progress fields for own questions.

## Steps
- [ ] Schema + migration + store tests (old surprise of each place, own questions gone).
- [ ] Rule engine in `own-content.ts`: pick the rule for a run, progress text, reveal
  and repeat. Unit tests for every trigger, repeat on/off, one per run, random once a day.
- [ ] Get-ready card teaser and the results block with question + answer; built-in
  teaser answer with its question.
- [ ] Prekvapenia tab table and form; remove the own questions editor.
- [ ] Specs (WHAT and WHY).
- [ ] Build, vitest, e2e (adapt `own-content.spec.ts`); Playwright MCP: add a level rule
  for world 1 level 1 (not repeating), play it and see question + answer, check it is
  marked done and not shown again; a 1 minute rule; the table on a narrow screen.

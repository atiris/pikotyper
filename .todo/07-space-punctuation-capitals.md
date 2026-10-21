# 07 Space, punctuation and capitals in the lesson path

Evidence and the chosen order: `.research/learning/space-punctuation-capitals.md`
(read it first). Today the game ignores the space bar (`onChar` returns on `' '` in
`src/game/runtime.ts`), targets are single words, and one `Shift` pseudo-key in
`SK_GROUPS`/`US_GROUPS` (`src/learning/lessons.ts`) comes after the diacritics.

Affected: `src/learning/lessons.ts`, `src/words/words.ts` (+ word lists), `src/game/runtime.ts`,
`src/game/typing.ts`, `src/game/modes/*`, `src/game/cards.ts` (new key cards),
`src/ui/keyboard-guide.ts`, `src/learning/stats.ts`, `src/screens/stats.ts`,
`public/i18n/*.json` (+ names list), `.specify/learning/*`. Store schema: lesson key
ids change, so `STORE_VERSION` goes up with a migration.

## Why
Space, period and comma are needed for any real sentence and the owner wants them
early; capitals at a logical middle point, because Shift chords are hard for
beginners and should not be a block at the very end.

## Decisions
- New lesson keys: `' '` (space), `'.'`, `','`, `'ShiftL'` (left Shift: capitals of
  right-hand letters), `'ShiftR'` (right Shift: capitals of left-hand letters),
  `'?'`, `'-'`, and on Slovak layouts `'!'`, `':'`; US: `'''` with the comma, `'?'`
  and `':'` after `z`, `'!'` and `'-'` with the digits.
- Order (group numbers as in the research file): space as the second intro after
  `f j` (group 1); `.` after `r u`; `,` after `n`; `ShiftL` after `p`; `ShiftR`
  after `z` (sk) / `y` (us); `?` `-` after `q`; sk `!` `:` after the first
  diacritics (`á`); capital diacritics only when the letter and its Shift are both
  unlocked, rarely; digits stay last. Remove the old single `Shift` group.
- Targets: once space is unlocked, a target can be a phrase. Falling/approaching
  modes (meadow, space, dragons, egg) use at most 2 words per target; calm modes
  (practice, planet signs/swamp, own text later) use phrases of 3-4 words. Before
  space is unlocked: single words as today; right after it: chunk pairs like
  `fj jf`. Space inside a target is typed like any char; the label shows a visible
  space dot (`·`, light) so the child sees it.
- Period ends some phrases (`mama ide.`), comma joins two short parts
  (`mama, tata`). Frequencies: period on 1 of 3 phrases, comma on 1 of 5, `?` on
  1 of 8 once unlocked.
- Capitals: only at the start of a target (a name from a localized list
  `names` in i18n, or the first word of a phrase), about 1 target in 6 at first,
  rising to every phrase start when that Shift's mastery >= 1. The Shift keys get
  their own key stats (`ShiftL`, `ShiftR`, measured on capitals of the opposite
  hand). A capital on a target adds 1.5 s to its travel time. When the child uses
  the Shift on the same hand as the letter (detect `ShiftLeft`/`ShiftRight` from
  `e.code` in `KeyInput`), Piko says once per level "Shift stlač druhou rukou".
- New key cards for space (thumb, "palec"), each punctuation key and each Shift
  (show which hand); the keyboard guide marks the space bar and the correct Shift.
- Migration: map old `Shift` in `unlockedKeys`/`introducedKeys`/`stats.keys` to
  both `ShiftL` and `ShiftR`; for a profile whose unlocked keys already include the
  group a new key now follows (e.g. has `u` -> gets `.`), add that key to
  `unlockedKeys` (not to `introducedKeys`, so the intro card still shows once).
  Unit tests for the migration.

## Steps
- [ ] Lesson groups and migration (+ tests in `src/learning/lessons.test.ts`,
  `src/storage/store.test.ts`).
- [ ] Word/phrase builder in `src/words/words.ts`: phrases from known words, names
  list, punctuation and capital rules above; never a char that is not unlocked.
  Unit tests: no locked chars, phrase lengths per mode, frequencies roughly right
  (seeded RNG).
- [ ] Runtime/typing: accept space; `TypingCore` unchanged except it may now see
  spaces; first-letter lock-on still on the first char. Shift side detection and
  the tip. Space is recorded in stats as `' '`.
- [ ] Modes: label widths for phrases (word size shrinks to fit, min 28 px);
  approach speed from `travelTime` already scales by length.
- [ ] Cards and guide: intro cards for the new keys; guide highlights space and the
  correct Shift; finger names: space -> thumb.
- [ ] Stats overlay and parent dashboard show space, punctuation and both Shifts
  (works with plan 08's "My keys" if that is already done; otherwise only the
  key-detail texts).
- [ ] Super profile (`src/app/super.ts`) gets the new keys.
- [ ] Specs: `.specify/learning/lesson-progression.md`, `words.md`,
  `finger-guide.md`, `keyboard-layouts.md`. README "The game" lines.
- [ ] Build, vitest, e2e (`e2e/helpers.ts` must type spaces and capitals: use
  `page.keyboard.type` with the char; for capitals it presses Shift), Playwright
  MCP: new profile plays to the space intro and types phrases.

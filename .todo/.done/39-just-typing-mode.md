# 39 "Len chcem písať": free typing without a game

`src/game/modes/` (new `freetype.ts`), `src/game/modes.ts`, `src/game/levels.ts` (kind),
`src/screens/map.ts` (button), `src/screens/level.ts`, `src/game/runtime.ts`, `src/audio/speech.ts`,
`src/screens/parent.ts` (one setting), `public/i18n/{sk,en}.json`, `.specify/game/mechanics.md`,
`.specify/learning/`. Settings gain one boolean: add it to `Settings`, `defaultSettings()` and a
store migration (v13) that sets it for old profiles.

## What
A third mode beside "Vlastné cvičenie" (the renamed free practice) and "Môj text" on the map:
**Len chcem písať**. No levels, no targets, no stars, no pace. The child picks any background
of the worlds already unlocked (a picker of the world pictures, reusing `isWorldUnlocked`), and
Piko walks around that place (the world's parallax background and ground). Every key the child
presses makes Piko cheerful (a hop, a small sound, a particle); the typed characters collect in
a quiet line. When the child stops for about 1.5 seconds, the collected text is shown as a
word or short phrase above Piko and read aloud (when read-aloud is available), then the line
is cleared. Escape or the X leaves; the keyboard guide may be shown as in other levels.

## Decisions
- It records key statistics like normal play (`recordPress` with expected = typed, i.e. no
  mistakes), so it does not hurt accuracy, and the session time counts for the pacing and the
  break reminder. Time here does not advance stars, levels or tasks.
- No word list and no checking: whatever is typed is shown. Only letters, digits, space and
  punctuation of the layout count; keys like Enter and Backspace work as editing (Backspace
  removes the last typed character before the pause).
- **Misuse (reading "forbidden" words aloud):** the speech runs in the browser, only on this
  device, and nothing is stored or sent, so the harm is the same as typing the word in any
  text field. Still, a parent setting `Čítať napísané slová` (`settings.speakTyped`, default
  on when `readAloud` is on, else off) turns the reading off, and the text is never kept in the
  profile or in results. No word filter: lists of forbidden words are language-specific, always
  incomplete and wrongly block innocent words. This is stated in the settings help text.
- The pause that triggers the reading is fixed (1.5 s), not a setting.
- Piko's walking reuses the sprite and tween code of the existing modes; the background reuses
  `LevelRuntime`'s parallax layers for the chosen world.

## Steps
- [x] `LevelDef` kind `freetype` and `createMode` case; `FreeTypeMode` with the walking Piko,
      the typed line, the pause, the shown and spoken word.
- [x] World picker (only unlocked worlds) shown before it starts and changeable while playing.
- [x] Map button "Len chcem písať" and the rename of free practice to "Vlastné cvičenie"
      (done already in the i18n files; check the button label in `map.ts`).
- [x] Setting `speakTyped` + migration v13 + parent settings UI + help text.
- [x] Texts (sk, en), `.specify` pages (what and why, not how).
- [x] Unit test for the pause/collect logic (pure function), e2e that types, waits and sees the word.
- [x] build, unit tests, e2e; check it in the browser, including speech on and off.

## Progress notes
- `speakTyped` is stored as its own switch, default on (new profiles and migration v13);
  reading still needs `readAloud`, so the effect is "on when read-aloud is on, else off" as
  decided, without coupling two stored values. Its parent switch sits under Music.
- No game cards in free typing (no get-ready, new key, tip): changing the place restarts the
  screen, and a card at every change would be in the way. Piko's bubble says the break line
  once when the break is due, since there is no end screen.
- The pause button is the round X (leave) here; Esc leaves too (a pause card from a hidden
  tab still resumes with Esc). Keys typed while the place picker is open are ignored.
- The shown text goes to a screen-reader status line too (also what the e2e reads).
- Presses with expected = typed feed key readiness like any play (as decided); new keys still
  open only at the end of a level.

## Done - 2026-10-22
- Shipped: "Len chcem písať" / "Just typing" on the map; a place picker of the open worlds
  (skipped with one world, changeable from the HUD); `FreeTypeMode` with Piko walking and
  hopping at every key, the quiet typed line, 1.5 s pause or Enter shows the text above Piko
  and reads it aloud (read-aloud on and `speakTyped` allowed); Backspace edits; Esc and the
  round X leave; presses recorded as correct, time counts, break line from Piko. Setting
  `speakTyped` with migration v13 and the parent switch with its help text; sk/en texts and
  the help card line; `.specify/game/free-typing.md` and links. Unit test of `TypedLine`,
  e2e `e2e/free-type.spec.ts` (pause, edit, stats, picker, speech on/off with a fake voice).
- Checked in the browser: picker, Planet world, typed line, shown word, parent switch.
- Left out: free presses still feed key readiness as the plan decided; the possible side
  effect is in the backlog.

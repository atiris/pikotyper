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
- [ ] `LevelDef` kind `freetype` and `createMode` case; `FreeTypeMode` with the walking Piko,
      the typed line, the pause, the shown and spoken word.
- [ ] World picker (only unlocked worlds) shown before it starts and changeable while playing.
- [ ] Map button "Len chcem písať" and the rename of free practice to "Vlastné cvičenie"
      (done already in the i18n files; check the button label in `map.ts`).
- [ ] Setting `speakTyped` + migration v13 + parent settings UI + help text.
- [ ] Texts (sk, en), `.specify` pages (what and why, not how).
- [ ] Unit test for the pause/collect logic (pure function), e2e that types, waits and sees the word.
- [ ] build, unit tests, e2e; check it in the browser, including speech on and off.

# 33 "Môj postup": per-story rows and long-term typing indicators

`src/screens/` (progress panel; find it by the title "Môj postup"), `src/learning/stats.ts`,
`src/storage/` (read only), `src/styles.css`, `public/i18n/*.json`,
`public/assets/` (ui-earth, ui-level, ui-key; run `npm run assets` to process the three raw
pictures already in `assets-src/`), `src/gfx/assets.ts`, `.specify/profiles/statistics.md`.
No schema change if the indicators are computed from the stored key statistics; if not, add
a migration.

Goal: the child sees the overall progress at a glance, with icons and numbers, not text.
The basis of progress is how many letters the child can type with enough quality and speed,
over the long term, not in one exercise.

## Steps
- [ ] 1. **Process the new icons.** `ui-earth.jpg` (finished worlds), `ui-level.jpg` (finished
      stories), `ui-key.jpg` (keys). Add them to `scripts/assets.mjs` and the asset table the
      same way the other `ui-*` are, keyed on their background colour; check the edge on a
      contact sheet.
- [ ] 2. **Mastered key.** Define in `src/learning/stats.ts` (one function, documented in
      `statistics.md`): a key is "mastered" when, over its last 30 recorded presses, accuracy
      is at least 90 % and median speed is at or above the target of the child's pace profile
      (use the existing pace in `src/game/pace.ts`; do not invent a second one). Counters per
      key: presses, accuracy, speed. Unit tests with fixtures: too few presses, low accuracy,
      slow, mastered.
- [ ] 3. **Summary row.** At the top: three icon + number chips: `ui-key` mastered keys
      (of the layout's total, for example "17/42"), `ui-earth` finished worlds, `ui-level`
      finished stories. Icon and number only; the meaning goes into the tooltip / aria-label.
      Add two more chips only if they fit the same pattern: quality (average accuracy of the
      mastered keys, in %) and speed (median characters per minute of the mastered keys).
      Explain them in one line each in the help page.
- [ ] 4. **Story rows.** One row per story (Piko, Piko and Robot Šrobik, Piko and Melody,
      with the story's image), then the worlds of that story as icons: finished worlds in
      colour, not finished grey; then the star total of that story as a number and the star
      icon (for example 3 coloured, 2 grey worlds, "18 ★"). No text labels except the story
      name. Locked stories stay visible with grey worlds.
- [ ] 5. Drive the panel with the playwright MCP with a fresh profile and with the
      `superpikotyper` profile at 1366 x 768 and 360 px wide; report what you saw. Update the
      specs. Build, lint, test.

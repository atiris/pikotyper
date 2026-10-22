# 34 Parent area: child summary, level stars grid, child switcher

`src/screens/parent.ts` (and its tabs), `src/screens/friends.ts` (companion picker, read),
`src/learning/stats.ts`, `src/styles.css`, `public/i18n/*.json`,
`.specify/profiles/parent-controls.md`, `.specify/profiles/statistics.md`. No schema change.

Depends on plan 33 (the mastered-key function and the summary chips, reuse them).

## Steps
- [ ] 1. **Section "Dieťa".** Order: child name, then (new) Piko picture with the short
      statistics (the same icon + number chips as the child's "Môj postup": mastered keys,
      worlds, stories, quality, speed - reuse the component, do not copy it), then the
      companion choice: first the picture list under the heading "Kamarát", then the field
      "Meno kamaráta" under the chosen picture.
- [ ] 2. **Pokroky - Úrovne.** The stars have a fixed width: a filled star for achieved, a
      grey/empty star for not achieved, always three in a cell with fixed width and centered
      (use the same star images/SVG as the results card, not text characters). Levels are laid
      out in a column grid (`grid-template-columns: repeat(auto-fill, minmax(<cell>, 1fr))`):
      with enough width there are more columns, each cell has the level name and its stars
      aligned to the same place in every cell.
- [ ] 3. **Child switcher.** A button to the right of "< Späť" (child icon and the child's
      name). It opens a card list of the profiles (same cards as on the start screen, small);
      choosing one switches the parent area to that child without leaving it; the current
      tab stays. Respect the password gate: switching does not ask again within the open
      session. If there is only one profile, the button is hidden.
- [ ] 4. Drive the parent area with the playwright MCP with 3 profiles (Dieťa section, Pokroky
      - Úrovne at 1366 px and 600 px wide, switching a child) and report what you saw. Add an
      e2e test for switching. Update the specs. Build, lint, test.

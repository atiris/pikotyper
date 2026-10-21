# 08 Map, companion and wardrobe redesign

Client side only: `src/screens/map.ts`, `src/screens/wardrobe.ts`,
`src/screens/stats.ts` (My keys), `src/gfx/piko.ts`, `src/game/rewards.ts`,
`src/styles.css`, `public/i18n/*.json`, `.specify/companion/`, `.specify/experience/visuals.md`.
Schema: `Progress` gets `companionsUnlocked: CompanionKind[]` (migration in
`src/storage/store.ts`, next free `STORE_VERSION`; existing profiles start with
their current kind).

## Why
- The map's top area wastes space and repeats itself; story titles and the first
  cards are not aligned; the big button names a level instead of saying "continue".
- The child wants to rename Piko and pick another friend, earned by playing.

## Decisions
- **Accessories stay per player.** Each child earns their own (siblings share a
  computer; earning is the motivation). Keep `progress.rewards` as it is.
- **New friends are earned by stars.** Total stars over all levels (sum of
  `progress.levels`) unlock the other kinds in this order, one every 6 stars:
  cat, bunny, owl, dog, bear, panda, penguin, lion (the starting kind is skipped).
  The parent's choice at profile creation stays free.
- **Rename** is allowed for the child in the wardrobe (max 16 chars, not empty);
  the parent setting stays too.

## Steps
- [ ] **Map layout.** Left column top to bottom: "Ahoj, {name}!" (h1, left aligned),
  Piko (click opens stats, as today), then the buttons. Remove `map.sub`
  ("{piko} už čaká...") from code and i18n. The top bar keeps only "Hráči" on the
  left and the round settings, fullscreen and sound buttons on the right.
- [ ] **Continue button.** The big button says "Pokračovať" / "Continue"; the level
  it starts ("Svet 1 · Úroveň 1") is only in its `title` (hover) and aria-label.
- [ ] **Story row.** The story name (h2) and the world cards are left aligned in the
  right column: the name above the cards, the first card starts at the same left
  edge. Check widths 1024, 1366, 1920.
- [ ] **Design pass.** No `design` skill exists in this setup; do the pass by hand:
  one consistent spacing scale, headings hierarchy (h1 greeting, h2 story name, h3
  world names), equal button heights in the left column, round icon buttons all
  48 px. Take screenshots before and after with the Playwright MCP and compare.
- [ ] **Wardrobe becomes "Kamarát a šatník" / "Buddy and wardrobe"** (button and
  title). Add a "Kamarát" section on top: name field (rename), and a row of all
  kinds; locked ones show a lock and "ešte N hviezdičiek". Picking a kind changes
  `companion.kind`; accessories stay on.
- [ ] **Piko jumps less on hover** is in plan 06; do not repeat.
- [ ] **My keys shows every character.** The "Moje klávesy" overlay lists letters
  and also space, punctuation, capitals (Shift) and digits once plan 07 adds them:
  the heat map keyboard shows the shifted characters as clickable too (a key with
  a shifted symbol shows its stats for the base and, after a toggle "⇧ znaky", for
  the shifted symbol). `keyForCode` in `src/screens/stats.ts` returns base or
  shifted by the toggle.
- [ ] Specs and i18n sk + en; build, vitest, e2e (update selectors that rely on
  `map.play` text); Playwright MCP check of map and wardrobe.

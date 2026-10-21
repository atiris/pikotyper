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
- [x] **Map layout.** Left column top to bottom: "Ahoj, {name}!" (h1, left aligned),
  Piko (click opens stats, as today), then the buttons. Remove `map.sub`
  ("{piko} už čaká...") from code and i18n. The top bar keeps only "Hráči" on the
  left and the round settings, fullscreen and sound buttons on the right.
- [x] **Continue button.** The big button says "Pokračovať" / "Continue"; the level
  it starts ("Svet 1 · Úroveň 1") is only in its `title` (hover) and aria-label.
- [x] **Story row.** The story name (h2) and the world cards are left aligned in the
  right column: the name above the cards, the first card starts at the same left
  edge. Check widths 1024, 1366, 1920.
- [x] **Design pass.** No `design` skill exists in this setup; do the pass by hand:
  one consistent spacing scale, headings hierarchy (h1 greeting, h2 story name, h3
  world names), equal button heights in the left column, round icon buttons all
  48 px. Take screenshots before and after with the Playwright MCP and compare.
- [x] **Wardrobe becomes "Kamarát a šatník" / "Buddy and wardrobe"** (button and
  title). Add a "Kamarát" section on top: name field (rename), and a row of all
  kinds; locked ones show a lock and "ešte N hviezdičiek". Picking a kind changes
  `companion.kind`; accessories stay on.
- [x] **Piko jumps less on hover** is in plan 06; do not repeat.
- [x] **My keys shows every character.** The "Moje klávesy" overlay lists letters
  and also space, punctuation, capitals (Shift) and digits once plan 07 adds them:
  the heat map keyboard shows the shifted characters as clickable too (a key with
  a shifted symbol shows its stats for the base and, after a toggle "⇧ znaky", for
  the shifted symbol). `keyForCode` in `src/screens/stats.ts` returns base or
  shifted by the toggle.
- [x] Specs and i18n sk + en; build, vitest, e2e (update selectors that rely on
  `map.play` text); Playwright MCP check of map and wardrobe.

## Progress notes
- Friend order: the plan's list plus fox at the end, so a child who started with another
  kind can still earn the fox (always 8 kinds to earn, 6 stars each).
- Stars earned before v6 count: the wardrobe grants due friends when it opens; levels
  grant them too and the results card names a new friend.
- A kind the parent picks in the settings is added to the unlocked ones (parent choice is free).
- "ešte N ★" / "N more ★" instead of "ešte N hviezdičiek" (no plural forms in i18n).
- Left column buttons all 56 px; back buttons in every top bar 48 px like the round ones
  (owner's request during the run). Island row gap leaves room for the lowered even cards.
- My keys: the ⇧ switch lives in `clickableHeatmap`, so the parent dashboard has it too.
  Hidden paw drawings no longer take space under the heat map (empty area, side scroll).
- Owner asked about the finger chip contrast: `#d55e00` and `#009e73` failed AA with either
  ink; the chip now darkens the finger color until white text reaches 4.5:1.

## Done - 2026-10-21
Shipped: map with greeting, Piko and equal buttons in the left column, "Continue" with the
level on hover, story name above left-aligned cards, spacing tokens; "Buddy and wardrobe"
with rename and kinds earned by stars (v6 migration `companionsUnlocked`); My keys and the
parent dashboard show shifted symbols with a ⇧ switch; AA contrast for finger chips; specs
and i18n. Verified with tsc build, vitest, the e2e suite and Playwright MCP (map at 1024,
1366, 1920 before/after; wardrobe kind pick and rename; ⇧ `?` key detail).
Left out: the next-key highlight on the keyboard guide still uses the raw finger colors
(text on `#d55e00` / `#009e73` is below 4.5:1) - in BACKLOG.md.

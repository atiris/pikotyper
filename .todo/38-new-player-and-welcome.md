# 38 New player form layout and a welcome on the map

`src/screens/new-profile.ts`, `src/screens/map.ts`, `src/screens/story.ts` (scene `intro`),
`public/i18n/{sk,en}.json` (`newProfile`, `map`), `src/styles.css` (`.kind-picker`, `.form`),
`.specify/profiles/profiles.md`, `e2e/layout.spec.ts`. No storage change: the "welcome seen"
mark reuses `progress.scenesSeen` (an id string), so no migration.

## What
1. **Form layout.** The companions (9 friends) sit in a grid of 3 columns x 3 rows. Beside
   it, one column with, top to bottom: the friend's name ("Meno kamaráta"), the language, the
   keyboard layout. When the width is not enough for two columns the name field and the two
   selects go below the picker (single column). The player's own name stays above both.
2. **The X.** The form is a window: it closes with the round X at the top right (cancel,
   forgets a pending task link as the Back button does today). The "Späť" button goes.
3. **After creating a player** the map opens (not the intro story and not a level), because a
   parent may want to set the profile up first. Above the story rows the map shows a welcome
   card for a player who has not seen it: Piko greets the child by name and says in two or
   three short lines what to do (press "Pokračovať", the keys unlock step by step, the "?" button
   helps, the parent can open settings with the gear). It has a close X and a "Začať" button
   that starts the first level; closing or starting marks it seen (`scenesSeen` gets
   `welcome`), it never shows again. The intro story scene stays as the first level's own
   introduction and is not shown before the map any more.

## Decisions
- The welcome card is part of the map's story area (top of `.story-rows`), not a modal, so it
  does not block the settings gear.
- A guest and the super player see no welcome.

## Steps
- [ ] Rework the form markup and CSS: 3x3 picker, side column, narrow-width fallback.
- [ ] X instead of "Späť" (reuse `closeButton`); keep the pending-task cleanup.
- [ ] Go to the map after creating; welcome card with texts (sk, en), `scenesSeen` mark.
- [ ] Remove the `intro` story scene from the creation path (keep it if a level still plays it).
- [ ] Update `.specify/profiles/profiles.md`; adjust e2e that create a player and expect the
      story (`e2e/*.spec.ts` helpers).
- [ ] build, unit tests, e2e; check the form at wide, narrow and short screens in the browser.

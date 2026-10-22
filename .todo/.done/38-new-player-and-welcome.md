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
- [x] Rework the form markup and CSS: 3x3 picker, side column, narrow-width fallback.
- [x] X instead of "Späť" (reuse `closeButton`); keep the pending-task cleanup.
- [x] Go to the map after creating; welcome card with texts (sk, en), `scenesSeen` mark.
- [x] Remove the `intro` story scene from the creation path (keep it if a level still plays it).
- [x] Update `.specify/profiles/profiles.md`; adjust e2e that create a player and expect the
      story (`e2e/*.spec.ts` helpers).
- [x] build, unit tests, e2e; check the form at wide, narrow and short screens in the browser.

## Progress notes
- The intro scene now plays from `playLevel` before the very first level (then the world 1
  scene), so a guest and the super player get it too; e2e use a `skipStories` helper.
- Escape also closes the form (ui-rules: a window closes with X and Escape).
- Below 1280 px width the form starts under the corner buttons, which otherwise covered its X.
- The install offer waits while the welcome card is shown, so the first map has one greeting.
- The welcome has three lines (Continue and step-by-step keys merged into one).
- The form's hint pointed to a lock button; it now names the gear on the map.

## Done - 2026-10-22
Shipped: 3 x 3 companion grid with a side column (single column under 640 px), the X and
Escape instead of "Späť", the map after creating a player with a one-time welcome card
(`scenesSeen` gets `welcome`), the intro story before the first level, spec and e2e updates
(new layout test for the form and the welcome). Left out: nothing.

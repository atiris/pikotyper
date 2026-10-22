# 40 Make the interface follow the rules

Rules: [.specify/experience/ui-rules.md](../.specify/experience/ui-rules.md). Files:
`src/ui/chrome.ts`, `src/ui/hud.ts`, `src/ui/dom.ts`, `src/game/runtime.ts`, `src/screens/*.ts`,
`src/styles.css`, `e2e/layout.spec.ts`. No storage change.

## Findings (from the code, to confirm in the browser first)
1. **Corner controls sit in four places.** `.top-right` (absolute, 1rem/1rem) on start, about,
   new player; the `.bar` header (in the page flow, 1.2rem top and 1rem-2.5rem side padding)
   on teacher, wardrobe, friends, parent, link import; `.map-top` on the map; `.hud` in a level.
   Measure `soundButton()` on every screen with the Playwright MCP before and after.
2. **Leaving is done three ways.** Bottom "Späť": about (primary), new player, practice key
   picker, link import (also a top one). Top-left "Späť": the pages. Round X: help, modals.
3. **Scrolling is mixed.** Help page scrolls the whole page with a sticky bar; the level help
   card and `.modal` scroll inside; the stats modal jumped when tabs changed (fixed: top
   aligned and a styled scroller, see `.modal::-webkit-scrollbar`).
4. **Level title.** `titleBlock()` draws the world name over dots; the rules want a ring
   beside the pause button.
5. **Paw.** It is in the HUD after the pause button (`runtime.ts` `hud`); check in every world
   (the user saw it "in the game strip"): if it is drawn on the stage anywhere, move it.
6. **Piko's bubble** (`.bubble`, `placeBubble()`) is placed beside Piko and jumps with him;
   its fallback is top left. Make top left the only spot.
7. Tabs: settings and the progress panel use `.tabs` separately; the help page (plan 37) will.

## Decisions
- One `cornerControls()` in `src/ui/chrome.ts` returns the global buttons in the fixed order;
  `.top-right` becomes `position: fixed` with one offset for all screens; page headers reserve
  that space on the right (padding) instead of holding the buttons. The level keeps them in
  its compact bar (second placement).
- Pages keep "Späť" top left; the new player form, the practice key picker and help become
  windows with the X (plans 37 and 38 do the form and help; this plan does the key picker and
  the about leftovers and link import).
- The ring: `levelRing(done, total, current)` in `hud.ts`, same size as the rhythm ring, the
  progress of the world as arc segments (like the paw's), the number inside; a web for a
  super obstacle level. `level-dots` and `.dot` are deleted with their help text
  (`help.icons.dots`), and the help text for the ring replaces it.
- Piko's bubble in a level: always `.bubble.top` style at top left with 85 % opacity; the
  "covered by a word" check stays (hides until free), the beside-Piko spot is deleted.

## Steps
- [x] Measure the corner buttons on every screen (script with Playwright MCP), record in this file.
- [x] `cornerControls()` and one fixed placement; update headers and CSS.
- [x] Closing: key picker and link import follow rule 2.
- [x] Level ring beside the pause button; remove dots; update help texts (sk, en) and
      `.specify/experience/help.md`; fix `e2e/help.spec.ts` count if it changes.
- [x] Paw: confirm it is only in the bar next to pause in all worlds, fix if not.
- [x] Bubble fixed top left, translucent.
- [x] e2e: the sound button has the same offset on start, teacher, map, wardrobe; the
      level ring shows the current number.
- [x] build, unit tests, e2e; screenshots of start, teacher, map, level in the browser.

## Measurements (sound button, top and right offset in px at 1366x768, scrollbar excluded)
- Before: start 16/16, about 16/16, new player 16/16, teacher 19/25, wardrobe 19/40,
  map 16/160 (fullscreen and help right of it), level 8/(in the bar).
- After: every standard screen (start, about, teacher, new player, story, map, wardrobe,
  settings) 16/139 with sound, fullscreen, help in the same places; level keeps the compact bar.

## Decisions taken while implementing
- Every standard screen shows the same global set (super star, sound, fullscreen, help), so a
  button never moves: fullscreen is now everywhere, and help without a player opens the about
  page (plan 37 turns that into the help page's about tab). The start page's own "i" button was
  dropped as a duplicate of that help button; its teacher button and language switch lead the row.
- On the break screen the help button is shown but disabled, so the break cannot be skipped
  through help. The help page itself has no corner controls (its X sits there; plan 37 redoes it).
- In a level the order is pause, paw, ring, world name: the play controls (rule 6) start the
  bar and the ring, a picture, follows them; the level's own help is the rightmost button in
  the global order (`globalButtons(helpBtn)`).
- Paw finding: the round paw button shared the class `paw` with the keyboard guide's paw
  pictures and took their size and 130 % offset, so it was drawn over the stage in every
  world. The keyboard's paws are now `kb-paw`.
- The about page got the "Späť" header (rule 2); its bottom row keeps only the two links.
  The link import error panel lost its bottom "Späť" (the header has one); the key picker
  lost its bottom "Späť" (the X closes it).
- Stale e2e fixed while here: help page count 16 and its X (`.modal-x`), the super star
  selector (`.top-right .round-btn.super`); both backlog lines removed.

## Done - 2026-10-22
Shipped: `cornerControls()`/`globalButtons()`/`helpButton()` in `src/ui/chrome.ts`, fixed
`.top-right` on all standard screens with page headers reserving the room; closing per rule 2
for the key picker, link import and about; `levelRing()`/`placeRing()` in `src/ui/hud.ts`
replacing the dots (help texts sk/en, `help.md`); paw class clash fixed; Piko's bubble fixed
top left at 85 % opacity, hides when it would cover a word (`piko.md`); e2e for one offset on
start, teacher, map, wardrobe and the ring's number. Verified: build, unit tests, full e2e,
screenshots of start, teacher, map, settings, level (1366 and 1024) and the help list.
Left out: nothing new for the backlog; the new player form and help page closing stay with
plans 38 and 37.

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
- [ ] Measure the corner buttons on every screen (script with Playwright MCP), record in this file.
- [ ] `cornerControls()` and one fixed placement; update headers and CSS.
- [ ] Closing: key picker and link import follow rule 2.
- [ ] Level ring beside the pause button; remove dots; update help texts (sk, en) and
      `.specify/experience/help.md`; fix `e2e/help.spec.ts` count if it changes.
- [ ] Paw: confirm it is only in the bar next to pause in all worlds, fix if not.
- [ ] Bubble fixed top left, translucent.
- [ ] e2e: the sound button has the same offset on start, teacher, map, wardrobe; the
      level ring shows the current number.
- [ ] build, unit tests, e2e; screenshots of start, teacher, map, level in the browser.

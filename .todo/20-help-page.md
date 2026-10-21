# 20 Help page: how to type, what the icons mean

Client side only: new `src/screens/help.ts`, the router (`go('help')`), `src/screens/map.ts`
(help button in the top actions), `src/game/runtime.ts` (help in the pause menu),
`src/ui/` icons (reuse the existing ones), `src/styles.css`, `public/i18n/*.json`,
specs `.specify/experience/index.md` (+ a new `help.md`), `.specify/experience/accessibility.md`.
No schema change. Do this after plans 15-17, because the icons and the practice entry
change there.

## Why
- The owner wants simple help for the child: how to sit and type, and what the icons
  at the top of the map and of a level do. Children do not guess symbols.

## Decisions
- A "?" icon button in the map's top actions and a "Pomoc" button in a level's pause
  menu open the help page. From a level it comes back to the paused level; from the map
  it goes back to the map. Esc goes back.
- Sections (short, big friendly text, a picture where one exists):
  1. **Ako písať**: 6-8 short tips in our own words, built from the existing
     preparation tips in i18n (`tips.*`, home keys F and J, thumbs on space, each
     finger has its keys, look at the screen not the hands, go slowly and accurately,
     short breaks). Pick the clearest, do not copy all 47.
  2. **Ikony hore**: every top icon drawn as it really is (the same icon component),
     each with one line. Map: settings, sound, fullscreen, help. Level: rhythm gauge,
     reading aloud, finger guide, sound, fullscreen, Piko's paws (help, and Enter starts
     it), pause. Only the icons that exist when this plan runs; take them from the code,
     not from this list.
  3. **Ako hrať**: type the word on the object; nothing bad happens when it gets past;
     stars come from accuracy; new keys come as you get better; Esc pauses.
- sk + en texts. The page works at 1024x600 with scrolling inside the page.

## Steps
- [ ] Help screen + routing + entries (map, pause).
- [ ] Texts sk + en.
- [ ] Specs (WHAT and WHY).
- [ ] Build, vitest, e2e (a test opens help from the map and goes back); Playwright MCP:
  map -> help -> back; level -> pause -> help -> back to the paused level.

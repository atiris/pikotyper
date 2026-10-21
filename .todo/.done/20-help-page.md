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
- [x] Help screen + routing + entries (map, pause).
- [x] Texts sk + en.
- [x] Specs (WHAT and WHY).
- [x] Build, vitest, e2e (a test opens help from the map and goes back); Playwright MCP:
  map -> help -> back; level -> pause -> help -> back to the paused level.

## Done - 2026-10-21
`src/screens/help.ts`: the help page (how to type in 8 own tips, the map's and the level's
top buttons drawn with the same icons, paw ring, progress bar and rhythm gauge, how to
play), a "?" button in the map's top actions (`go('help')`, own address `#/p/<id>/help`)
and a "Help" button in the pause card that opens the page over the paused level (the
runtime gets `onHelp` like `onPiko`, so `game/` does not import `screens/`). Back and Esc
return to the map or to the paused level. New `help` icon, texts sk + en, spec
`.specify/experience/help.md`, e2e `e2e/help.spec.ts`. Decisions: the map's "Players"
button is listed too (it sits at the top); the practice "Finish" button is not (only in
free practice). Playwright MCP at 1024x600: map -> help -> back, level -> pause -> help ->
Esc back to the paused level with focus on Continue; no console errors.
Left out: nothing; nothing went to the backlog.

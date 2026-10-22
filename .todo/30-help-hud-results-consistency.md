# 30 Help, level help card, HUD star, results buttons, explanations

`src/screens/help.ts`, `src/ui/hud.ts`, `src/screens/level.ts`, `src/screens/friends.ts`
(wardrobe), `src/screens/map.ts`, the results card, `src/styles.css`, `public/i18n/*.json`,
`.specify/experience/help.md`, `.specify/experience/visuals.md`. No schema change.

Depends on plan 25 (`roundButton`/`roundSvg` already exist in `src/ui/hud.ts`).

## Steps
- [ ] 1. **Help page.** Add the missing sample of the paw help button (the paw ring button as
      it looks in the level HUD) with one line on what it does. Put the same round close button
      in the top right corner that the "Môj postup" panel uses (reuse its component; do not copy
      its CSS). Remove any other close control the page had.
- [ ] 2. **Level help card ("?").** Text left-aligned (not centered). It must say in plain words
      how to use the paw (what it shows and when to press it). No star in this card. Same close
      behaviour as before (Esc or "Pokračovať").
- [ ] 3. **Explain the dots under the world name.** In a level the title block shows small dots
      (level dots plus coloured ones: green, green, red, pastel and a snowflake-like one) that no
      one understands, and the help does not say. Find what each dot is in the code
      (`level.titleWords` block in `src/ui/hud.ts`). Decide: if a dot carries no information the
      child needs, remove it; otherwise keep it and add a legend line in the level help card
      and the help page. Record the decision in the plan's Done section.
- [ ] 4. **"Záchranná misia" and the badge.** Find where each is shown (rescue mission = a
      mode/card offered after failure or a super-obstacle; badge = world reward). Write in the
      help page and in the level help card one short child-friendly sentence for each: what it
      is and when it appears. If the code shows "Záchranná misia" with no way to learn when it
      comes up, add the sentence where it appears too.
- [ ] 5. **Star is part of the top menu.** The star (shown when it applies) must be a normal
      member of the top bar row on every screen that has one (map, level HUD), not a fixed
      overlay with padding hacks. In the friend/wardrobe screen ("Kamarát a šatník") the star
      and number move next to the animal picture on the left, not the top bar.
- [ ] 6. **Results buttons.** "Ďalšia úroveň", "Hrať znova" and "Mapa" use one button style
      (same size, shape, font, icon slot); only "Ďalšia úroveň" is highlighted (accent
      colour). Use the shared `roundButton`/button classes, no new style.
- [ ] 7. Drive the app with the playwright MCP (help page, level help card, results card,
      wardrobe, map) at 1366 x 768 and report what you saw. Update the specs. Build, lint, test.

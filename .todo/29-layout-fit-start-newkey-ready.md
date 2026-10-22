# 29 Layout: start screen, new key panel and "Pripraviť sa" card fit without scrolling

`src/screens/` (start/profile picker, new-key panel, posture card), `src/styles.css`,
`public/i18n/*.json`, `e2e/`, `.specify/experience/visuals.md`, `.specify/profiles/profiles.md`.
No schema or storage change.

Children (and teachers) use small laptop screens. Three screens scroll today for no good
reason. Rule for all three: at 1366 x 768 and at 1024 x 600 nothing scrolls.

## Steps
- [ ] 1. **Start screen.** Find the screen with the profile cards (read `src/screens/` and
      `src/app/app.ts` first). Put the logo and the title text on one row. Profile cards: up to
      5 on one row with no scrolling at 1366 x 768 (cards shrink with `clamp()`/container width,
      not a fixed size). Rules for the "+ Nový hráč" entry: with 4 or fewer profiles it is a card
      after the profile cards; with 5 or more it is a button placed before "Hrať ako hosť". With
      more than 5 profiles the cards wrap, and the last row never holds a single card (the
      row split is balanced: for example 6 profiles = 3 + 3, 7 = 4 + 3, 8 = 4 + 4, 9 = 5 + 4,
      11 = 6 + 5 where a row may exceed 5 only when width allows; otherwise wrap and allow
      vertical scroll of the card area only). Test (unit for the row split function, e2e for
      "5 profiles, no page scroll": `document.documentElement.scrollHeight <= innerHeight`).
      The footer (privacy note, links "O hre PikoTyper" and the teacher link) stays visible without
      scrolling and keeps both links; the owner could not find them when the page was long.
- [ ] 2. **New key panel.** Make it lower: the heading "Nový kláves „d“" goes above Piko, the
      "how to type it" content (finger guide) sits to the right of Piko, the skip action is
      "Preskočiť" and Esc triggers it (show the Esc hint on the button). Panel height stays under
      60 % of the viewport at 768 px. Keep the existing start action and flow.
- [ ] 3. **"Pripraviť sa" card (posture).** Same content, laid out so it fits at 600 px
      height: picture and text side by side on wide screens, picture scaled to the available
      height (`max-height` in `vh`), button always visible without scrolling.
- [ ] 4. Drive the app with the playwright MCP at 1366 x 768 and 1024 x 600 (start screen with
      1, 5 and 7 profiles, a new-key panel, the posture card) and check the page does not
      scroll; add an e2e check for the start screen and the posture card. Update specs
      (WHAT and WHY only). Build, lint, unit and e2e tests.

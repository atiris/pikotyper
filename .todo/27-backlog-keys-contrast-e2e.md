# 27 Backlog fixes: shifted punctuation in the key picker, next-key contrast, e2e accents

`src/screens/parent.ts` (keysTab), `src/ui/keyboard-guide.ts`, `src/styles.css`
(`.kb-key.next`), `src/learning/lessons.ts` (read only), `e2e/helpers.ts`,
`src/ui/keyboard-guide.test.ts`, `public/i18n/*.json` if a label is new,
`.specify/profiles/parent-controls.md`, `.specify/experience/accessibility.md`,
`.specify/learning/finger-guide.md`. No schema or storage change.

Three small entries from `.todo/BACKLOG.md`, worked together because each is a few lines
and each needs a test. The fourth entry (native-speaker review of the Slovak word list) is
human work and stays in the backlog.

## Steps
- [ ] 1. **Manual key picker misses shifted punctuation.** In the parent's manual key
      mode (`keysTab` in `src/screens/parent.ts`) only base characters can be picked, so the
      Slovak `?`, `!`, `:` (Shift with `,`, `§`, `.`) cannot be chosen. The lesson order already
      contains these keys (`?`, `!`, `:` in `SK_GROUPS`). Add a row "Interpunkcia" under the
      keyboard picker with one chip per punctuation lesson key the layout has (`.` `,` `?` `-` `!`
      `:` and the US apostrophe), each labeled with the character and, for shifted ones, the
      key combination (for example `? (Shift + ,)`). Picking a chip toggles the same lesson key
      the automatic mode uses. Read `keysTab` first and follow its state and saving; do not
      invent a second storage format. Test: picking `?` in manual mode puts `?` into the key
      set of the profile and a drill can contain it.
- [ ] 2. **Next-key highlight below AA contrast.** `.kb-key.next` paints raw finger colors, so
      labels on `#d55e00` and `#009e73` reach only about 3.9-4.4:1. The chips already use
      `textColorsOn` (`src/ui/keyboard-guide.ts`). Use the same function for the highlighted
      key (label and its small finger number), keep the key's look otherwise. Test in
      `keyboard-guide.test.ts`: for every finger color the chosen label color has a contrast
      of at least 4.5:1 (use the existing `contrast()`).
- [ ] 3. **E2E typing helper cannot type accented letters.** `typeChar` in `e2e/helpers.ts` uses
      `keyboard.type`, which sends no `keydown` for characters that are not on the US layout
      (`á ú ô ...`), so a test that reaches diacritic keys stalls. Make `typeChar` dispatch a
      real `keydown` and `keyup` (on `window`, with `key` and the layout's `code` from
      `src/keyboard/layouts.ts`) for such characters, keep `keyboard.type` for the rest.
      Add one e2e test that plays a level whose keys include a diacritic and reaches the
      results card.
- [ ] 4. Remove the three entries from `.todo/BACKLOG.md` in the finishing commit.
      Update the three specs listed above in one line each. `npm run build`, `npm test`,
      `npm run test:e2e`; clean tree; commit and push.

# 41 Settings: one look for switches, and the child's picture and progress

`src/screens/parent.ts` (`field`, `check`, `autoField`, `settingsTab`, `dashboardTab`),
`public/i18n/{sk,en}.json` (`parent.*`), `src/styles.css` (`.field`, `.auto-check`),
`.specify/profiles/parent-controls.md`, `.specify/experience/ui-rules.md`. No storage change.

## What
1. **Every switch (checkbox) looks the same:** the checkbox on the left, to its right the
   title (bold), and under the title the explanation in normal text, small, muted. Today
   "Automaticky (rastie s pokrokom dieťaťa)" has the box left of its label, but "Menej pohybu",
   "Veľké písmo", "Vysoký kontrast", "Zamknúť klávesnicu" and the like have the title above and
   the box on its own line, and the hint is sometimes under, sometimes beside.
   One helper (`switchField(title, checked, onChange, hint?)`) renders all of them; `field()`
   stays for text, selects and sliders.
2. **The automatic sliders get proper titles.** The checkbox label "Automaticky (rastie s
   pokrokom dieťaťa)" becomes two switches with their own titles and one short line each:
   - "Automatická náročnosť" - "Rastie s pokrokom dieťaťa po niekoľkých minútach presného písania.
     Každý krok je medaila."
   - "Automatická dĺžka slov" - "Rastie s pokrokom dieťaťa, spolu s náročnosťou."
   The long paragraph `parent.autoHint` shrinks to the pace note (slow start, "Bez časového tlaku")
   and stays under the difficulty slider; the strings `parent.auto` is removed.
3. **Section "Dieťa":** shows the current Piko (with the chosen accessories) as a picture
   at the top of the section, next to the name; the progress summary row leaves this section.
4. **Section "Pokroky" (dashboard tab):** starts with the same Piko picture and the progress
   summary row (`summaryRow`: stories, worlds, keys, accuracy, speed, stars) above the cards.

## Decisions
- The rule goes into `ui-rules.md` as rule 10 ("Switches"), with the layout above.
- The surprises form's repeat checkbox (`surprises.repeat`) uses the same helper.
- Texts in sk and en; the keys keep the same set in both (`i18n.test.ts`).

## Steps
- [x] `switchField` helper and CSS; convert every checkbox in `parent.ts` (settings, surprises,
      own words, task form).
- [x] Split the automatic switch into two titled switches with their short lines; trim `autoHint`.
- [x] Move the summary row to Pokroky, keep the Piko picture in Dieťa and add it to Pokroky.
- [x] Update `.specify/profiles/parent-controls.md` and `ui-rules.md`.
- [x] build, unit tests, e2e parent; check the settings tab at 1024 and at phone width in the browser.

## Progress
- `switchField(title, box, hint?)` takes the checkbox from `check()` instead of
  `(checked, onChange)`, so the surprises form can keep its `repeat` input to read and reset.
- The hint is tied to the checkbox with `aria-describedby`; the accessible name is the title alone.
- Own words and the task form have no checkboxes; the settings tab and the surprises form had all ten.
- Rule 10 was already in `ui-rules.md`; it now also says it covers every switch in the parent area.
- Checked in the browser at 1024 and 390 px: no horizontal overflow, no console errors.

## Done - 2026-10-22
Shipped: one switch layout for all parent-area checkboxes, two titled automatic switches with a
shorter pace note, the Piko picture beside the child's name, the picture and progress summary at
the top of Pokroky. Nothing was left out.

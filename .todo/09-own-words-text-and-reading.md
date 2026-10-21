# 09 Own content tab (words, text, encouragements, questions) and reading aloud

Depends on 07 (own text needs space and punctuation). Client side only.
Affected: `src/storage/schema.ts` + migration (new settings), `src/screens/parent.ts`,
`src/words/words.ts`, `src/game/runtime.ts`, `src/game/levels.ts` (practice),
new `src/audio/speech.ts`, `src/ui/chrome.ts`, `public/i18n/*.json`, `.specify/`.

## Why
Parents and teachers want this week's spelling words and their own texts in the
game (top research proposals); reading aloud helps young and dyslexic readers.

## Decisions
- **One tab for own content.** The parent area gets a new tab "Vlastné" / "Own content"
  between Settings and Keys, with five sections in this order: own encouragements
  (moved here from the Settings tab, same data `customMessages`), surprises, own
  questions and answers, own words, own text with the mix choice. The Settings tab no longer shows
  the encouragements.
- **Own questions and answers**: `ownQuestions: { q: string; a: string }[]` (max 30,
  each max 160 chars, both required). They take turns with Piko's built-in teasers:
  every second teaser after a story level is the next own question (in order, then
  from the start again). The answer comes, as for built-in teasers, on the results card
  of the next finished story level; the pending question is kept in
  `progress.pendingQuestion: number | null` so a break between levels does not lose it.
- **Surprises** (a parent hides a real reward, e.g. "Vieš, kde ti ocko schoval sladkú
  odmenu, keď zvládneš toto cvičenie? Ja to viem a prezradím ti to, keď ho zvládneš
  dostatočne správne." -> "Malá čokoláda je pre teba schovaná v skrini za chladničkou.").
  Data: `surprises: { id, q, a, place, minStars, revealedAt? }[]` (max 20; q and a max
  200 chars). `place` is a story level id, `'next'` (the next story level or rescue
  mission the child plays) or `'practice'` (the next free practice of at least one
  minute). `minStars` 1-3, default 2 ("dostatočne správne"); free practice uses the
  same accuracy limits as stars. Piko asks the question on the get-ready card of that
  place (plan 06 merged card) and repeats it on the results card. Reached the stars:
  the results card shows the answer, highlighted, and `revealedAt` is set; from then on
  the surprise is never asked or shown to the child again (the parent still sees it
  as "odhalené {date}" and can delete it). Not reached: Piko says "Skoro! Skús to ešte
  raz a potom ti to prezradím." and the surprise waits for the next try. Several
  surprises on one place: the oldest first, one per level. A surprise never counts
  in statistics and is not part of the turn-taking of own questions.
- Settings per profile: `ownWords: string[]` (max 300, trimmed, lowercased unless
  the parent typed capitals), `ownText: string` (max 4000 chars),
  `ownMix: 'off' | 'some' | 'half' | 'most'` (share of targets taken from own
  words/text: 0, 25 %, 50 %, 80 %), `readAloud: boolean` (default false).
- Own words and own text may contain keys the child has not unlocked; they are
  used anyway (the teacher decided), the guide shows the keys. If a char cannot be
  typed on the profile's layout at all (`canType` false), that word is skipped and
  the parent sees it listed as "nedá sa napísať" in the editor.
- Own text is split into phrases by sentence and comma; in story levels it comes
  in phrase-sized targets (mode limits from plan 07), interleaved with random
  targets by `ownMix`; in free practice there is a new choice "Môj text" that types
  the text in order, phrase by phrase, without random words.
- Reading aloud uses the browser's `speechSynthesis` (offline voices). It reads the
  target the child should type when it becomes the focus, and Piko's bubble lines.
  Voice: first voice whose `lang` starts with the profile language; if none
  exists, the button is hidden. Rate 0.9.
- The reading button is a round icon button (speaker-with-lips/"read" icon) placed
  directly left of the keyboard button in the level HUD; it toggles `readAloud`.

## Steps
- [ ] Schema + migration + tests.
- [ ] Own content tab: encouragements moved from Settings; questions editor (list of
  question + answer pairs, add/remove, max 30) and the teaser turn-taking in
  `src/screens/level.ts` with a unit test for the order.
- [ ] Surprises: editor (question, answer, place picker with world/level names, "next
  level" and "free practice", stars 1-3, list with state "čaká" / "odhalené {date}",
  delete); get-ready card and results card hooks; unit tests: revealed once, not
  revealed below `minStars`, oldest first, never shown after `revealedAt`.
- [ ] In that tab: "Vlastné slová" (textarea, one word per line or separated by
  commas/spaces) and "Vlastný text" (textarea) with the mix choice and a preview
  of five sample targets; validation messages.
- [ ] Word source: mix own words/phrases into `WordSource.next` by `ownMix`;
  practice "Môj text" mode in order.
- [ ] Speech module with a unit-testable voice picker; HUD button; reads focus
  target and bubbles; stops on pause/exit.
- [ ] Specs (`.specify/learning/words.md`, `.specify/profiles/parent-controls.md`,
  `.specify/experience/accessibility.md`), i18n sk + en, README: a "Surprises" part
  saying it is intended that a parent hides real rewards (a treat, a trip, a game
  evening) behind a level, and that the answer is shown to the child only once, after
  the level is done well enough.
- [ ] Build, vitest, e2e: parent adds two own words with mix "most", the child's
  next level shows one of them. Playwright MCP check of the editor and HUD.

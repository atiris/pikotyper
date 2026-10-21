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
  between Settings and Keys, with four sections in this order: own encouragements
  (moved here from the Settings tab, same data `customMessages`), own questions and
  answers, own words, own text with the mix choice. The Settings tab no longer shows
  the encouragements.
- **Own questions and answers**: `ownQuestions: { q: string; a: string }[]` (max 30,
  each max 160 chars, both required). They take turns with Piko's built-in teasers:
  every second teaser after a story level is the next own question (in order, then
  from the start again). The answer comes, as for built-in teasers, on the results card
  of the next finished story level; the pending question is kept in
  `progress.pendingQuestion: number | null` so a break between levels does not lose it.
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
- [ ] In that tab: "Vlastné slová" (textarea, one word per line or separated by
  commas/spaces) and "Vlastný text" (textarea) with the mix choice and a preview
  of five sample targets; validation messages.
- [ ] Word source: mix own words/phrases into `WordSource.next` by `ownMix`;
  practice "Môj text" mode in order.
- [ ] Speech module with a unit-testable voice picker; HUD button; reads focus
  target and bubbles; stops on pause/exit.
- [ ] Specs (`.specify/learning/words.md`, `.specify/profiles/parent-controls.md`,
  `.specify/experience/accessibility.md`), i18n sk + en, README.
- [ ] Build, vitest, e2e: parent adds two own words with mix "most", the child's
  next level shows one of them. Playwright MCP check of the editor and HUD.

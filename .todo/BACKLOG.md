# Backlog

Everything found outside the current task, one line each, most important first:
`- [P1|P2|P3] <title> - <one line: what is wrong and where>`.
Search before adding; an entry is worked only when it is named.
- [P3] Native-speaker review of the Slovak word list - public/words/sk.json was generated; rare or odd word forms may remain
- [P3] Manual key picker misses shifted punctuation - src/screens/parent.ts keysTab picks only base characters, so Slovak `? ! :` (Shift + `, § .`) cannot be chosen in manual mode
- [P3] Next-key highlight text below AA contrast - src/styles.css `.kb-key.next` uses raw finger colors; labels on `#d55e00` and `#009e73` reach only ~3.9-4.4:1 (chips use textColorsOn)
- [P3] E2E typing helper cannot type accented letters - e2e/helpers.ts typeChar uses keyboard.type, which sends no keydown for `á ú ô`, so a test that reaches diacritic keys stalls
- [P2] Regenerate flagged background art - six `regenerate:` rows in assets-src/PROMPTS.md (planet-near flat edge, junkyard-near repeat, robocity mid/near busy, workshop mid/near pink outline)

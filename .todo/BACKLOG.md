# Backlog

Everything found outside the current task, one line each, most important first:
`- [P1|P2|P3] <title> - <one line: what is wrong and where>`.
Search before adding; an entry is worked only when it is named.
- [P3] Native-speaker review of the Slovak word list - public/words/sk.json was generated; rare or odd word forms may remain
- [P2] Regenerate flagged background art - six `regenerate:` rows in assets-src/PROMPTS.md (planet-near flat edge, junkyard-near repeat, robocity mid/near busy, workshop mid/near pink outline)
- [P3] Objects can flash their fallback on first spawn - src/game/runtime.ts prepare() preloads only the three backgrounds; mode sprites load on first draw (declare them per mode)
- [P3] An update re-downloads the whole install cache - scripts/sw-template.js addAll(CORE) fetches every file again when the version changes (about 6.6 MB)
- [P2] Super password e2e fails - e2e/play.spec.ts 'the super password typed fast' never shows .super-badge (fails on a clean checkout too)
- [P2] Help e2e fails - e2e/help.spec.ts expects 15 .help-icons li but the page shows 16 (fails on a clean checkout too)

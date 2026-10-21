# Queue

The order in which `.todo/run-queue.ps1` implements the open plans, top first,
each in its own clean session. One line per plan in `.todo/`:
`- [P1|P2|P3] <plan>.md - <why it sits at this position>`. A plan that is not
listed here is never run. Lines whose plan has moved to `.todo/.done/` are
skipped, and the session that finishes a plan removes its line.

- [P2] 08-map-companion-redesign.md - map and wardrobe polish; its "My keys" step shows the keys 07 adds
- [P2] 12-meadow-dandelion-and-web.md - design canvas for world 1: dandelion instead of swatter, web with holes, paw pulse; independent of 08
- [P2] 09-own-words-text-and-reading.md - own content tab (encouragements, questions, words, text) needs 07's phrases; reading aloud
- [P2] 10-teacher-links.md - tasks and results reuse 09's own words and text
- [P3] 11-story-robot.md - second story; needs the owner's media (fallbacks work without them); after the core plans

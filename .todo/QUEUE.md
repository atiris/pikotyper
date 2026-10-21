# Queue

The order in which `.todo/run-queue.ps1` implements the open plans, top first,
each in its own clean session. One line per plan in `.todo/`:
`- [P1|P2|P3] <plan>.md - <why it sits at this position>`. A plan that is not
listed here is never run. Lines whose plan has moved to `.todo/.done/` are
skipped, and the session that finishes a plan removes its line.

- [P1] 06-play-hud-and-fixes.md - play screen fixes the owner hit first (overlapping words, HUD, paws, accessories)
- [P1] 07-space-punctuation-capitals.md - real sentences need space, period, comma and capitals early; 09 builds on it
- [P2] 08-map-companion-redesign.md - map and wardrobe polish; its "My keys" step shows the keys 07 adds
- [P2] 09-own-words-text-and-reading.md - own words and text need 07's phrases; reading aloud
- [P2] 10-teacher-links.md - tasks and results reuse 09's own words and text
- [P3] 11-story-robot.md - second story; needs the owner's media (fallbacks work without them); after the core plans

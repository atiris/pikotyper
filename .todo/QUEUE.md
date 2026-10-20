# Queue

The order in which `.todo/run-queue.ps1` implements the open plans, top first,
each in its own clean session. One line per plan in `.todo/`:
`- [P1|P2|P3] <plan>.md - <why it sits at this position>`. A plan that is not
listed here is never run. Lines whose plan has moved to `.todo/.done/` are
skipped, and the session that finishes a plan removes its line.

- [P1] 01-core-foundation.md - base modules and the storage contract every other plan uses
- [P1] 02-game-engine-and-meadow.md - engine and first playable world; needs 01
- [P1] 03-story-worlds-2-5.md - rest of the story on the same engine; needs 02
- [P2] 04-piko-stats-parent.md - companion, stats, parent area; needs 01-03
- [P2] 05-audio-a11y-pwa-polish.md - finish, offline, end-to-end scenario; needs 01-04

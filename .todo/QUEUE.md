# Queue

The order in which `.todo/run-queue.ps1` implements the open plans, top first,
each in its own clean session. One line per plan in `.todo/`:
`- [P1|P2|P3] <plan>.md - <why it sits at this position>`. A plan that is not
listed here is never run. Lines whose plan has moved to `.todo/.done/` are
skipped, and the session that finishes a plan removes its line.

- [P2] 26-assets-check-and-story-wiring.md - checks the art in the real game; runs after 25 because the HUD and hands change the screens it looks at
- [P2] 28-performance-audit.md - measures and tunes the whole app; last big plan, after the look (25) and the art (26) are final
- [P3] 27-backlog-keys-contrast-e2e.md - three small backlog fixes; after 25 because the keyboard guide hands and highlight are redrawn there

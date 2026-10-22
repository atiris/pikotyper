# Queue

The order in which `.todo/run-queue.ps1` implements the open plans, top first,
each in its own clean session. One line per plan in `.todo/`:
`- [P1|P2|P3] <plan>.md - <why it sits at this position>`. A plan that is not
listed here is never run. Lines whose plan has moved to `.todo/.done/` are
skipped, and the session that finishes a plan removes its line.

- [P1] 29-layout-fit-start-newkey-ready.md - screens that scroll today; independent, quick win
- [P1] 31-play-rules-and-feel.md - idle progress is a correctness rule, changes how every level is played
- [P1] 32-progression-balance-and-names.md - story 1 is too hard; changes the numbers that plan 33 shows
- [P2] 30-help-hud-results-consistency.md - help, HUD star and result buttons; after the rules are settled
- [P2] 33-my-progress-panel.md - needs the new key counts from plan 32
- [P2] 34-parent-area-child-stats-switcher.md - reuses the components from plan 33
- [P3] 35-standalone-background-strips.md - prompt work only, the owner generates the pictures

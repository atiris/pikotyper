# Queue

The order in which `.todo/run-queue.ps1` implements the open plans, top first,
each in its own clean session. One line per plan in `.todo/`:
`- [P1|P2|P3] <plan>.md - <why it sits at this position>`. A plan that is not
listed here is never run. Lines whose plan has moved to `.todo/.done/` are
skipped, and the session that finishes a plan removes its line.

- [P1] 40-ui-consistency.md - the rules the plans below build on; first, so they use the X and the corner controls as defined
- [P1] 38-new-player-and-welcome.md - the form and the first impression; the X pattern the help page then reuses
- [P1] 37-unified-help.md - one help page with tabs; after 38 so both use the same close X
- [P2] 39-just-typing-mode.md - new mode, independent of the two above

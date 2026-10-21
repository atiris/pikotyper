# Queue

The order in which `.todo/run-queue.ps1` implements the open plans, top first,
each in its own clean session. One line per plan in `.todo/`:
`- [P1|P2|P3] <plan>.md - <why it sits at this position>`. A plan that is not
listed here is never run. Lines whose plan has moved to `.todo/.done/` are
skipped, and the session that finishes a plan removes its line.

- [P2] 17-free-practice-key-picker.md - independent; before 20 so help shows the final entries
- [P2] 18-settings-password.md - schema bump; take the next version if 19 landed first
- [P2] 19-surprise-rules.md - after 16 (results block); schema bump
- [P2] 21-robot-finale-badges-celebration.md - after 16 (progress view gets the badge shelf)
- [P2] 23-dictation-and-memory.md - after 15 and 17 (voice reads targets only, practice picker)
- [P3] 24-story-fairy-forest.md - third story; after 15, 21, 22, 23
- [P3] 20-help-page.md - last, describes the icons and flows the plans above settle

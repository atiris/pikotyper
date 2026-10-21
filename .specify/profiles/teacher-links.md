# Tasks, results and moving a player by links

## What
- **No server, links only.** Everything a link carries is inside its address hash
  (`#/task/…`, `#/result/…`, `#/move/…`), compressed, with a format version, so the data
  never reaches a web server and old links can still be told apart later.
- **Task** (parent area, tab "Úloha"): a name, own words and/or a text, 1-20 minutes, and
  what to play: free practice of only the task's words, or the next story levels with the
  task's words mixed in mostly. The result is a link to copy and a QR code (when the link
  fits in one). It can also be given straight to the current player.
- Opening a task link asks which player takes it (or creates a new one). The map then
  shows **Úloha na dnes** as its first card until the minutes are played; a story task
  may take several levels, and leaving a level early does not count it.
- **Hand-in:** after the task, the child gets **Odovzdať**: a result link and the short
  instruction to send it to the teacher (Edupage, e-mail). It holds the player's name,
  the task, the date, minutes played, accuracy, rhythm and the five weakest keys, plus a
  checksum. The UI says plainly that the checksum finds damaged copies, not cheating.
- **Teacher view** (`#/teacher`, from the start page footer, or by opening a result link):
  results opened or pasted are kept in this browser only, apart from the players, as a
  table grouped by task, one row per child (a newer hand-in replaces the older one), with
  delete and CSV export. No accounts.
- **Move a player:** parent area, data tab, "Preniesť na iný počítač": a link (and QR when
  it fits) with the whole profile. A link stays under 8000 characters: older per-key day
  history (over 30 days) is dropped first, and a profile still too big goes by file export.
  Opening the link imports the player and asks before replacing one with the same id.

## Why
- Teachers and parents want to give today's task and get the child's results back, and
  a child wants to continue on another computer, without copying JSON files around.
- The app has no backend and promises that nothing leaves the browser on its own; links
  keep that promise, because only what a person copies and sends travels.

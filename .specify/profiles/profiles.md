# Profiles

## What
- Several local child profiles on one device, picked on the start screen (name and
  avatar), plus a **Guest** mode that keeps nothing after the browser tab closes.
- Profile data: child name, companion name and kind, custom messages, layout, settings,
  progress, unlocked items, statistics.
- Export a profile (or all of them) to a `.json` file and import it on another device.
  Import validates the file and never silently overwrites (it asks: replace or keep both).
  A player can also move by link ([teacher-links.md](teacher-links.md)).
- Stored data has a version; older data is migrated on load.
- Every player has an address (`#/p/<id>`, plus `/wardrobe`, `/friends`, `/settings`), so a
  link or desktop shortcut opens that child's map directly; the browser's back and forward
  buttons move between screens. Leaving the whole app asks first while a player is active.
- **Super mode** for parents and testers: typing `superpikotyper` fast (within 4 seconds,
  no field) on the start screen opens a temporary player with every world, level,
  key and accessory open. It lives in memory only, never touches real players'
  statistics, and ends with its round star button in the top right corner or a reload;
  the star never pushes the screen down.

## Why
- Families and classrooms share devices; export/import gives portability without accounts.
- Children should not have to pick themselves on the start screen every time, and a stray
  back button or shortcut should not throw them out of a level.
- Parents want to look at later worlds without playing through them or spoiling a child's
  progress; the typing speed keeps learners from finding it by accident.

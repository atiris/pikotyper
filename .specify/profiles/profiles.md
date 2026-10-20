# Profiles

## What
- Several local child profiles on one device, picked on the start screen (name and
  avatar), plus a **Guest** mode that keeps nothing after the browser tab closes.
- Profile data: child name, companion name and kind, custom messages, layout, settings,
  progress, unlocked items, statistics.
- Export a profile (or all of them) to a `.json` file and import it on another device.
  Import validates the file and never silently overwrites (it asks: replace or keep both).
- Stored data has a version; older data is migrated on load.

## Why
- Families and classrooms share devices; export/import gives portability without accounts.

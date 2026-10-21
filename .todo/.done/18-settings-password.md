# 18 Password for the parent settings

Client side only: `src/storage/schema.ts` + `src/storage/store.ts` (store-level field
with a migration), `src/screens/parent.ts`, every way that opens the parent screen
(`settingsButton` in `src/ui/`, pause menu, ...), `src/app/super.ts` (read only),
`src/styles.css`, `public/i18n/*.json`, specs `.specify/profiles/parent-controls.md`,
`.specify/experience/privacy.md`.
**Schema change:** `StoreData.parentLock?: { salt: string; hash: string }`, the next
store `version` and a migration that only bumps the version. If plan 19 lands first,
take the number after it.

## Why
- Children open the settings and change things. The owner wants a simple password on
  the settings page. Data does not need to be encrypted: it is a lock on the page, not
  real security.
- When the owner plays as the super player, the lock must not apply, and the super
  player can change or remove it. This is also the way back if the password is
  forgotten.

## Decisions
- One password for the whole device (all profiles and the guest), stored as
  `{ salt, hash }`: SHA-256 (SubtleCrypto) of salt + password, both hex. Never in plain
  text. The only recovery is the super player.
- Settings page, new group "Heslo na nastavenia": set a password (typed twice), change
  it, or remove it. Changing or removing needs the current password, except for the
  super player.
- While a lock is set, every way into the parent screen first shows a small modal:
  a password field, "Otvoriť" and "Späť". A wrong password shakes the field and says
  "Nesprávne heslo". After 5 wrong tries, a 30 s wait (shown as a countdown).
- An unlock holds until the parent screen is left; the next visit asks again.
- The super player (`SUPER_ID`) is never asked.

## Steps
- [x] Schema field + migration + store tests.
- [x] Hash helper (unit test: same password matches, another does not).
- [x] Lock modal on every way into the parent screen; super player bypass.
- [x] Settings group to set / change / remove.
- [x] Specs (WHAT and WHY).
- [x] Build, vitest, e2e (set a password, leave, entering needs it); Playwright MCP the
  same as a real user, plus the super player bypass and change.

## Done - 2026-10-21
- Store v10 with `parentLock?: { salt, hash }` (migration only bumps; a broken lock is
  dropped on load), `src/storage/lock.ts` (SHA-256 of salt + password via SubtleCrypto)
  with unit tests.
- `parentAccess` in `src/screens/parent.ts` is the single gate for every way in (the map
  gear and the `#/p/<id>/settings` address): super player passes, a set lock asks for the
  password, otherwise the calm question stays. Wrong password shakes the field; 5 wrong
  in a row start a 30 s countdown, kept in memory while the app runs (a reload resets
  it - acceptable for a lock on the page, not security).
- Settings tab group "Heslo na nastavenia": set (twice), change and remove; current
  password asked except for the super player. The lock is not part of exported files.
- Specs: parent-controls, privacy. E2E test in `e2e/parent.spec.ts`; Playwright MCP
  run covered set, wrong + countdown, super bypass + change, remove.
- Left out: nothing.

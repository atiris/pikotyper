# Parent controls

## What
- A parent area behind a gear button and one calm question ("do you really want to open
  the settings?"). Deleting a profile asks in the app's own style.
- An optional **settings password**, one for the whole device (every profile and the
  guest). While it is set, every way into the parent area (the gear, the settings address)
  asks for it instead of the question; a wrong one says so, and after five wrong tries in a
  row the next try waits 30 seconds. An unlock lasts until the parent area is left. The
  settings tab sets it (typed twice), changes it or removes it; changing or removing needs
  the current password. Only a salted hash is stored, never the password, and it is not in
  exported files.
- The super player is never asked and can change or remove the password without the
  current one; this is the only way back from a forgotten password.
- Difficulty and word length each have an **automatic** mode (on by default): after a few
  minutes of accurate play (90 %+) one of them goes up by one step, taking turns, up to a
  ceiling (difficulty 8, words of 9 letters); each step gives the child a numbered medal.
  A parent who sets the value by hand turns its automatic mode off.
- Settings per profile: child name, companion name and kind, keyboard layout, active keys (pick by hand or "automatic"), word length range,
  difficulty 1-10, words without diacritics, no time pressure, session length, guide
  visibility, sound and music volume, start in fullscreen. The help text says the start
  is slow and points to "no time pressure" for a child who still cannot keep up.
- An **own content** tab collects what the parent writes for the child:
  - own encouraging messages, mixed into the companion's lines;
  - **surprises**: a question and an answer (up to 20, 200 characters each) placed on a
    story level, on the next level or rescue mission, or on free practice of a minute at
    least, with the stars needed (1-3, two by default: "well enough"). The companion asks
    the question on the get-ready card and again on the results card. With enough stars
    (in practice: the same accuracy limits) the answer is shown, highlighted, once; from
    then on the surprise is never shown to the child again, and the parent sees it as
    revealed with its date. Without them the companion says "almost, try once more" and the
    surprise waits. Several on one place come oldest first, one per level. Surprises never
    count in statistics;
  - **own questions and answers** (up to 30, 160 characters each): every second teaser
    question after a story level is the next own question, in order and then from the start
    again; its answer comes on the results card of the next finished story level, even after
    a break;
  - **own words** (up to 300) and **own text** (up to 4000 characters) with the share of
    targets taken from them and a preview of five sample targets
    ([words](../learning/words.md)).
- Dashboard: per-key heat map on the keyboard, accuracy and rhythm trend, time played per
  day, finished levels.
- Printable progress card / certificate (browser print), instead of class codes.

## Why
- A 10-year-old solves any arithmetic "adult check"; a plain question keeps settings out of
  the way without pretending to be a lock.
- Some children open the settings anyway and change things; a family that wants it can put
  a simple password on the page. It is a lock on the page, not security of the data, so it
  needs no encryption, and the owner keeps a way back through the super player.
- Fixed settings either bore a growing child or overwhelm a new one; small automatic steps,
  each celebrated, make getting better visible and rewarding.
- Parents and teachers want control and visible progress; printable cards avoid accounts
  and rosters ([research](../../.research/features/parent-dashboard.md)).
- A real reward hidden behind a level (a treat, a trip, a game evening) and the family's
  own questions tie the game to the child's life; told once and only after good play, the
  answer stays worth waiting for ([research](../../.research/game/piko-questions.md)).

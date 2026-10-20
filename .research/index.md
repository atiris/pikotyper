# PikoTyper Research: What Users Want From Kids Typing Tools

Date: 2026-10-20. Scope: kids and young teens (target age 10-15), parents, teachers. Spec read: `pikotyper.md`.

## Method and honesty note
Web search gave thin results (few real Reddit threads, Common Sense Education reviews were frozen in Jan 2026 and are being removed). Many blog "reviews" are sponsored (Typesy). Claims below are marked:
- **[src]** = backed by a fetched or searched source (URL in `competitors.md`).
- **[bg]** = common background knowledge about the products or keyboard, not verified in this pass. Verify before relying on it.

## Files
- `competitors.md` - per product: praise and complaints.
- `features/index.md` - list of proposed feature areas (one file each).

## Big picture (3 lines)
1. Kids' tools fail on: ads, rigid scoring, boring repeated lessons, speed-over-accuracy races, and weak finger guidance.
2. Teachers want: free, no ads, simple assignments, accuracy shown first, proper finger technique.
3. Slovak is a real gap: no found child-friendly modern tool handles the Slovak layout (diacritics behind the number row, dead keys) well. This is our best differentiator.

## Top 15 recommendations (ranked)

| # | What | Why / evidence | Prio | Fits philosophy |
|---|------|----------------|------|-----------------|
| 1 | Slovak-first layout teaching: ordered lessons for diacritics, dead keys (acute, caron), number row where digits need Shift | Slovak diacritics sit behind digits [src: ddadsstornala]; Slovak tool "Písanie Hravo" sells a diacritics level [src]. No free kid tool found | P1 | yes |
| 2 | On-screen keyboard with finger colors + next-key highlight, option to fade/hide it | Dance Mat weak finger guidance [src: Typing Tournament]; masking keys is standard teacher advice [src: Mavis Beacon guide] | P1 | yes |
| 3 | Accuracy-first feedback (no WPM race, stars for clean words, speed shown only as trend) | Teachers: races push speed over accuracy [src: Common Sense Nitro Type]; TypingClub kids complain speed is prioritized [src] | P1 | yes |
| 4 | Zero ads, zero accounts, zero tracking, stated plainly | Ads are the top complaint on TypingClub and Typing.com free [src]; privacy warning on TypingClub [src] | P1 | yes |
| 5 | Gentle mistake handling: no lost lives, wrong key just wobbles, Piko says a hint | Rigid scoring and discouraging pacing [src: parents on TypingClub]; matches spec | P1 | yes |
| 6 | Adaptive practice: weak keys get more weight, keys unlock one at a time | Keybr / Typing.com tailor to trouble letters [src, bg] | P1 | yes |
| 7 | Session pacing: soft stop at 10-15 min, stretch break with Piko, no streak guilt | 5-10 min start, break after ~20 min for primary [src: EANI]; addiction concern [bg] | P1 | yes |
| 8 | Parent panel: key/length/difficulty (in spec) + per-key heat map, weekly summary, printable certificate | Parents like progress tracking [src]; teachers want assignments [src] | P2 | yes |
| 9 | Accessibility pack: dyslexia-friendly font choice (Lexend/Atkinson/OpenDyslexic), colorblind-safe finger colors plus patterns, big text, reduce motion, sound off | OpenDyslexic not universal, alternatives suggested [src]; uncluttered screen, low motion [src] | P2 | yes |
| 10 | Offline-first PWA, installable, works without network after first load | Fits GitHub Pages; school Wi-Fi/lag complaints [src: kid reviews lag] | P2 | yes |
| 11 | Short, varied lessons: skip button, no unskippable songs/cutscenes | Dance Mat: cannot skip long songs, low replay value [src] | P2 | yes |
| 12 | Posture and hand-position reminder at start and at breaks (home row bumps F/J) | EANI: teach home row from start [src]; Dance Mat needs teacher policing [src] | P2 | yes |
| 13 | Keyboard layout selector (Slovak QWERTZ, Czech, US QWERTY, German) plus detection warning | Slovak layout differs by OS [src: Wikipedia QWERTZ]; Tux Typing supports many languages [src] | P2 | yes |
| 14 | Export/import progress + printable "progress card" instead of class codes | Class codes/rosters add privacy burden [src: Typing.com take-home agreement] | P2 | yes |
| 15 | Optional calm "free practice" with pronounceable pseudo-words per key set (in spec) plus Slovak real-word lists with correct diacritics | Keybr-style generated words [src, partial]; spec already has fallback generator | P3 | yes |

Partly-fitting ideas deliberately NOT recommended: public leaderboards and racing (Nitro Type), chat, cosmetic purchases, daily streak pressure. See `features/session-pacing.md` and `features/accuracy-first-feedback.md`.

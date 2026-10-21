# PikoTyper

A peaceful, story-driven touch-typing adventure for children (about 10-15 years).
Kids learn to type with **all ten fingers** together with their friend **Piko**: they help
animals on a meadow, fly a rocket through space, explore a new planet, protect dragons and
hatch a new friend. No explosions, no punishment, no ads, no accounts.

*Pokojná príbehová hra pre deti na nácvik písania všetkými desiatimi. Po slovensky aj po anglicky.*

**Play:** https://atiris.github.io/pikotyper/

![Start screen](docs/start.png)

## How it teaches

- **One key at a time.** Keys unlock from the home row (`F` `J`, then `D` `K`, `S` `L` ...),
  each new key is introduced alone (where it is, which finger), then mixed with known keys.
  The next key unlocks when the last one is mastered (40 recent presses, 92 % accuracy,
  steady reaction time).
- **Every key has its finger.** The on-screen keyboard shows finger colors and numbers,
  lights up the next key (and both steps of Slovak accent keys), and two hands show which
  finger to use. The guide fades for keys the child already masters.
- **Accuracy before speed.** Stars come from accuracy; speed is only a personal trend.
  Mistakes never cost anything: the letter wobbles, the right key glows, and after three
  misses on one key Piko offers a 20-second mini practice.
- **Weak keys come more often**, and the stats overlay (click Piko) shows which keys to
  practise, with a one-minute drill.
- **Good habits:** a posture card, a short preparation tip before each session (47 tips),
  and a stretch break after the session length the parent chose.
- **Slovak QWERTZ done right:** `ľ š č ť ž ý á í é` on the number row, `ú ä ô ň`, dead keys
  for `ó ĺ ŕ ď` and accented capitals, and a hint when the real keyboard looks different.

## The game

| World | What happens | Big challenge | Reward |
|---|---|---|---|
| 1. Training Meadow | a soft swatter shoos bees, ladybugs and mice away | spider web | invitation to space, meet Piko |
| 2. Rocket Flight | typing rhythm drives the speedometer, a beam pushes rocks away | splitting asteroid | landing clearance |
| 3. New Planet | stepping stones across a swamp, road signs | cracking boulder | the Force |
| 4. Dragon Valley | shield bubbles protect baby dragons | rhythm wave | a dragon egg |
| 5. Egg Journey | the egg jumps over rocks and stumps | friendly mole | a baby dragon, endless rescue missions |

Piko can be one of nine animals and wears 28 accessories earned by progress (never by chance).

![Meadow level](docs/meadow.png)
![Space level](docs/space.png)

## For parents

- **Private:** 100 % in the browser. No backend, no tracking, no cookies. Profiles stay in
  `localStorage` and can be exported / imported as a `.json` file. Guest mode keeps nothing.
- **Parent area** (lock button, simple adult check): child and companion names, own
  encouraging messages, keyboard layout, active keys (automatic or picked by hand), word
  length, difficulty 1-10, words without diacritics, no time pressure, session length,
  guide visibility, volumes, fonts (Lexend, Atkinson Hyperlegible, OpenDyslexic), large
  text, reduced motion, high contrast. A dashboard shows a per-key heat map, accuracy and
  rhythm trends, time per day, and a printable progress card.
- **Offline:** installable PWA; works without internet after the first visit.

## Development

Requires Node.js 24+.

```sh
npm ci
npm run dev      # http://localhost:5173/pikotyper/
npm run build    # type check + production build into dist/
npm test         # unit tests (Vitest)
npm run test:e2e # browser tests (Playwright)
npm run assets   # turn raw images and music in assets-src/ into public/assets/
npm run icons    # render the PWA icons
```

Every push to `main` builds the site and deploys it to GitHub Pages
(`.github/workflows/deploy.yml`).

## Project docs

- [`pikotyper.md`](pikotyper.md) - the original brief
- [`.specify/`](.specify/) - what the product does and why, per feature
- [`.research/`](.research/) - research of similar products and proposed features
- [`.todo/`](.todo/) - implementation plans, queue and backlog
- [`.scenarios/`](.scenarios/) - end-to-end test scenarios
- [`assets-src/PROMPTS.md`](assets-src/PROMPTS.md) - Gemini prompts for images and music

## License

[MIT](LICENSE). Fonts: SIL Open Font License (see `public/fonts/`).

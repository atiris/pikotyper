# PikoTyper

A peaceful, story-driven touch-typing adventure for children.
Kids learn the keyboard together with their friend **Piko**: they help animals on
a meadow, fly a rocket through space, explore a new planet, protect dragons and
hatch a new friend. No explosions, no punishment, no ads, no accounts.

*Pokojná príbehová hra pre deti na nácvik písania všetkými desiatimi. Po slovensky aj po anglicky.*

**Play:** https://atiris.github.io/pikotyper/ (work in progress)

## Principles

- **Child-friendly:** gentle feedback on mistakes, positive reinforcement, no addiction loops.
- **Private:** 100 % in the browser. No backend, no tracking. Profiles stay in `localStorage`
  and can be exported / imported as a `.json` file.
- **Configurable:** a parent picks active keys, word length and difficulty.
- **Multilingual:** Slovak and English, language detected from the browser.

## Development

Requires Node.js 24+.

```sh
npm ci
npm run dev      # http://localhost:5173/pikotyper/
npm run build    # type check + production build into dist/
npm test         # unit tests (Vitest)
npm run test:e2e # browser tests (Playwright)
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

[MIT](LICENSE)

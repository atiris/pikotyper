import type { Page } from '@playwright/test';

/** Plays the open level like a child reading the finger guide, until the results card. */
export async function playLevel(page: Page, mistakes = true): Promise<string> {
  let typed = 0;
  for (let i = 0; i < 3000; i++) {
    const state = await page.evaluate(() => {
      const res = document.querySelector<HTMLElement>('.results-card');
      if (res) return { kind: 'results', text: res.innerText };
      const nk = document.querySelector('.newkey-card .big-key');
      if (nk) return { kind: 'newkey', key: nk.textContent ?? '' };
      const pass = document.querySelector<HTMLElement>('.posture-card')?.dataset.password;
      if (pass) return { kind: 'password', key: pass };
      return { kind: 'play', next: document.querySelector<HTMLElement>('.kb-guide')?.dataset.next ?? '' };
    });
    if (state.kind === 'results') return state.text!;
    if (state.kind === 'password') await page.keyboard.type(state.key!);
    else if (state.kind === 'newkey') await page.keyboard.type(state.key === '⇧' ? 'A' : state.key!);
    else if (state.next) {
      if (mistakes && typed % 13 === 4) await page.keyboard.type('q');
      await page.keyboard.type(state.next);
      typed++;
    }
    await page.waitForTimeout(state.kind === 'play' ? 90 : 200);
  }
  throw new Error('level did not finish');
}

export async function createProfile(page: Page, name: string): Promise<void> {
  await page.goto('./');
  await page.locator('.profile-card.new').click();
  await page.locator('#np-name').fill(name);
  await page.locator('form button[type=submit]').click();
  await page.locator('.story-screen').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.map-screen').waitFor();
}

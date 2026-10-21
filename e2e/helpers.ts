import type { Page } from '@playwright/test';

/** Plays the open level like a child reading the finger guide, until the results card; `typed` collects the characters. */
export async function playLevel(page: Page, mistakes = true, typed: string[] = []): Promise<string> {
  for (let i = 0; i < 3000; i++) {
    const state = await page.evaluate(() => {
      const res = document.querySelector<HTMLElement>('.results-card');
      if (res) return { kind: 'results', text: res.innerText };
      const nk = document.querySelector<HTMLElement>('.newkey-card');
      if (nk) return { kind: 'newkey', key: nk.dataset.sample ?? '' };
      if (document.querySelector('.posture-card')) return { kind: 'ready' };
      return { kind: 'play', next: document.querySelector<HTMLElement>('.kb-guide')?.dataset.next ?? '' };
    });
    if (state.kind === 'results') return state.text!;
    if (state.kind === 'ready') await page.keyboard.press('Space');
    else if (state.kind === 'newkey') await typeChar(page, state.key!);
    else if (state.next) {
      if (mistakes && typed.length % 13 === 4) await page.keyboard.type('q');
      await typeChar(page, state.next);
      typed.push(state.next);
    }
    await page.waitForTimeout(state.kind === 'play' ? 90 : 200);
  }
  throw new Error('level did not finish');
}

/** One character as a child types it: a capital with Shift held. */
export async function typeChar(page: Page, ch: string): Promise<void> {
  const capital = ch !== ch.toLowerCase();
  if (capital) await page.keyboard.down('Shift');
  await page.keyboard.type(ch);
  if (capital) await page.keyboard.up('Shift');
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

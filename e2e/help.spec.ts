import { expect, test } from '@playwright/test';
import { createProfile, typeChar } from './helpers';

test('help opens from the map and from a paused level and goes back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await createProfile(page, 'Ema');

  // Map -> help -> back button.
  await page.locator('.map-top .help-btn').click();
  const help = page.locator('.help-page');
  await expect(help.locator('h2', { hasText: 'How to type' })).toBeVisible();
  await expect(help.locator('.help-icons li')).toHaveCount(15);
  expect(page.url()).toMatch(/\/help$/);
  await help.getByRole('button', { name: 'Back' }).click();
  await page.locator('.map-screen').waitFor();
  // Map -> help -> Escape.
  await page.locator('.map-top .help-btn').click();
  await help.waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.map-screen').waitFor();

  // Level -> pause -> help -> back to the paused level.
  await page.locator('.map-side .btn.primary').click();
  await page.locator('.story-screen').waitFor();
  await page.keyboard.press('Escape');
  for (let i = 0; i < 100; i++) {
    const state = await page.evaluate(() => {
      const nk = document.querySelector<HTMLElement>('.newkey-card');
      if (nk) return { kind: 'newkey', key: nk.dataset.sample ?? '' };
      if (document.querySelector('.posture-card')) return { kind: 'ready', key: '' };
      if (document.querySelector('.mode-intro')) return { kind: 'intro', key: '' };
      // Play has started once Piko stops waiting.
      return { kind: document.querySelector('.level-piko.waiting') ? 'wait' : 'play', key: '' };
    });
    if (state.kind === 'play') break;
    if (state.kind === 'ready') await page.keyboard.press('Space');
    else if (state.kind === 'intro') await page.keyboard.press('Enter');
    else if (state.kind === 'newkey') await typeChar(page, state.key);
    await page.waitForTimeout(200);
  }
  await page.keyboard.press('Escape');
  const pause = page.locator('.pause-card');
  await pause.getByRole('button', { name: 'Help' }).click();
  await expect(page.locator('.help-overlay .help-page')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.help-overlay')).toHaveCount(0);
  await expect(pause).toBeVisible();
  await pause.getByRole('button', { name: 'Help' }).click();
  await page.locator('.help-overlay').getByRole('button', { name: 'Back' }).click();
  await expect(pause).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pause).toHaveCount(0);
  expect(errors).toEqual([]);
});

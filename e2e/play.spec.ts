import { expect, test } from '@playwright/test';
import { createProfile, playLevel } from './helpers';

test('a new child plays the first level by typing and sees stars', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await createProfile(page, 'Ema');
  await page.locator('.map-side .btn.primary').click();
  await page.locator('.story-screen').waitFor();
  await page.keyboard.press('Escape');
  const text = await playLevel(page);
  expect(text).toMatch(/%/);
  await expect(page.locator('.results-card .star.on').first()).toBeVisible();
  await expect(page.locator('.results-card .teaser.ask')).toBeVisible();
  await page.locator('.results-card .btn').last().click();
  await expect(page.locator('.level-node.done')).toHaveCount(1);
  await page.locator('.map-piko').click();
  await page.locator('.heatmap .kb-key[data-heat]').first().click();
  await expect(page.locator('.stats-modal .key-detail')).toContainText('%');
  expect(errors).toEqual([]);
});

test('a copied link opens the player directly', async ({ page, context }) => {
  await createProfile(page, 'Lea');
  expect(page.url()).toMatch(/#\/p\//);
  const p2 = await context.newPage();
  await p2.goto(page.url());
  await expect(p2.locator('.map-hello')).toContainText('Lea');
});

test('the super password typed fast on the start page opens everything', async ({ page }) => {
  await page.goto('./');
  await page.locator('.start-screen').waitFor();
  await page.keyboard.type('superpikotyper', { delay: 40 });
  await expect(page.locator('.super-badge')).toBeVisible();
  await expect(page.locator('.level-node:disabled')).toHaveCount(0);
  await page.locator('.super-badge').click();
  await expect(page.locator('.start-screen')).toBeVisible();
  await expect(page.locator('.super-badge')).toHaveCount(0);
});

test('Enter sends Piko\'s paws to type a few words', async ({ page }) => {
  await page.goto('./');
  await page.locator('.start-screen').waitFor();
  await page.keyboard.type('superpikotyper', { delay: 40 });
  await page.locator('.map-side .btn.primary').click();
  await page.locator('.story-screen').waitFor();
  await page.keyboard.press('Escape');
  const pass = await page.locator('.posture-card').getAttribute('data-password');
  await page.keyboard.type(pass!);
  await expect(page.locator('.paw-btn')).toHaveAttribute('data-charged', '3');
  await expect(page.locator('.level-piko.waiting')).toHaveCount(0);
  await expect.poll(() => page.locator('.kb-guide').getAttribute('data-next')).not.toBe('');
  await page.keyboard.press('Enter');
  await expect(page.locator('.kb-guide.paws-on')).toBeVisible();
  await expect(page.locator('.paw-btn')).toHaveAttribute('data-charged', '2');
  await expect(page.locator('.kb-guide.paws-on')).toHaveCount(0, { timeout: 15000 });
});

test('a level left during its get-ready card does not swallow the next level\'s keys', async ({ page }) => {
  await page.goto('./');
  await page.locator('.start-screen').waitFor();
  await page.keyboard.type('superpikotyper', { delay: 40 });
  await page.locator('.map-side .btn.primary').click();
  await page.locator('.story-screen').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.posture-card').waitFor();
  await page.goBack();
  await page.locator('.map-screen').waitFor();
  await page.locator('.map-side .btn.primary').click();
  const pass = await page.locator('.posture-card').getAttribute('data-password');
  await page.keyboard.type(pass!);
  await expect(page.locator('.level-piko.waiting')).toHaveCount(0);
  // The level listens on the window after all capturing cards; a key must get that far.
  await page.evaluate(() => window.addEventListener('keydown', () => document.body.dataset.reached = '1'));
  await page.keyboard.type('a');
  await expect(page.locator('body[data-reached]')).toHaveCount(1);
});

test('guest progress is forgotten in a new browser context', async ({ page, browser }) => {
  await page.goto('./');
  await page.locator('.start-screen .btn.ghost').first().click();
  await expect(page.locator('.map-screen')).toBeVisible();
  const other = await browser.newContext();
  const p2 = await other.newPage();
  await p2.goto('./');
  await expect(p2.locator('.profile-card:not(.new)')).toHaveCount(0);
  await other.close();
});

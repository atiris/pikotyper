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
  await page.locator('.results-card .btn').last().click();
  await expect(page.locator('.level-node.done')).toHaveCount(1);
  expect(errors).toEqual([]);
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

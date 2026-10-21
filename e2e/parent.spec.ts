import { expect, test } from '@playwright/test';
import { createProfile } from './helpers';

test('parent changes settings, exports and imports into a fresh browser', async ({ page, browser }) => {
  await createProfile(page, 'Tomas');
  await page.locator('.top-actions .icon-btn').first().click();
  await page.locator('.confirm .btn.danger, .confirm .btn:not(.primary)').last().click();
  await expect(page.locator('.parent-screen')).toBeVisible();
  await page.locator('.field', { hasText: /časového|time pressure/i }).locator('input').check();
  await page.locator('.tab').nth(3).click();
  const download = page.waitForEvent('download');
  await page.locator('.data-tab .btn').first().click();
  const file = await (await download).path();

  const other = await browser.newContext();
  const p2 = await other.newPage();
  await p2.goto('./');
  await p2.locator('.start-screen .btn.ghost').nth(1).click();
  await p2.locator('.import input[type=file]').setInputFiles(file!);
  await p2.locator('.import .btn.primary').click();
  await expect(p2.locator('.profile-card', { hasText: 'Tomas' })).toBeVisible();
  const imported = await p2.evaluate(() => JSON.parse(localStorage.getItem('pikotyper:v1')!).profiles[0].settings.noTimePressure);
  expect(imported).toBe(true);
  await other.close();
});

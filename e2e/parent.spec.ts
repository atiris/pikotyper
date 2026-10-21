import { expect, test } from '@playwright/test';
import { createProfile } from './helpers';

test('parent changes settings, exports and imports into a fresh browser', async ({ page, browser }) => {
  await createProfile(page, 'Tomas');
  await page.locator('.top-actions .icon-btn').first().click();
  const words = (await page.locator('.number-words').textContent())!.trim();
  const sk = ['', 'jeden', 'dva', 'tri', 'štyri', 'päť', 'šesť', 'sedem', 'osem', 'deväť', 'desať', 'jedenásť', 'dvanásť', 'trinásť', 'štrnásť', 'pätnásť', 'šestnásť', 'sedemnásť', 'osemnásť', 'devätnásť'];
  const skT = ['', '', 'dvadsať', 'tridsať', 'štyridsať', 'päťdesiat', 'šesťdesiat', 'sedemdesiat', 'osemdesiat', 'deväťdesiat'];
  const en = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const enT = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  let answer = 0;
  for (let i = 11; i < 100; i++) {
    const s = i < 20 ? sk[i] : skT[Math.floor(i / 10)] + (i % 10 ? sk[i % 10] : '');
    const e = i < 20 ? en[i] : enT[Math.floor(i / 10)] + (i % 10 ? `-${en[i % 10]}` : '');
    if (s === words || e === words) answer = i;
  }
  expect(answer).toBeGreaterThan(10);
  await page.locator('.adult-check input').fill(String(answer));
  await page.locator('.adult-check button[type=submit]').click();
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

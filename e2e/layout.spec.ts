import { expect, test, type Page } from '@playwright/test';
import { createProfile } from './helpers';

const SIZES = [{ width: 1366, height: 768 }, { width: 1024, height: 600 }];

async function noScroll(page: Page): Promise<void> {
  const [scroll, inner] = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
  expect(scroll).toBeLessThanOrEqual(inner);
}

async function addProfiles(page: Page, from: number, to: number): Promise<void> {
  for (let i = from; i <= to; i++) {
    await page.goto('./');
    await page.locator(i === 1 ? '.profile-card.new' : '.btn:has-text("Nový hráč"), .btn:has-text("New player"), .profile-card.new').first().click();
    await page.locator('#np-name').fill(`Kid${i}`);
    await page.locator('form button[type=submit]').click();
    await page.locator('.story-screen').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.map-screen').waitFor();
  }
}

test('the start screen does not scroll with 1, 5 and 7 profiles', async ({ page }) => {
  await createProfile(page, 'Kid1');
  for (const [count, rows] of [[1, 1], [5, 1], [7, 2]]) {
    await addProfiles(page, count === 1 ? 2 : count === 5 ? 2 : 6, count);
    if (count === 1) { /* already created */ }
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await page.goto('./');
      await page.locator('.start-screen').waitFor();
      await noScroll(page);
      await expect(page.locator('.profile-row')).toHaveCount(rows);
      // The about and teacher buttons are in the first viewport whatever the number of profiles.
      await expect(page.locator('.top-right .round-btn')).toHaveCount(3);
      for (const b of await page.locator('.top-right .round-btn').all()) await expect(b).toBeInViewport();
      const newAsCard = count < 5;
      await expect(page.locator('.profile-card.new')).toHaveCount(newAsCard ? 1 : 0);
    }
  }
});

test('the new key card and the get-ready card fit and Esc skips the key', async ({ page }) => {
  for (const size of SIZES) {
    await page.setViewportSize(size);
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await createProfile(page, 'Fit');
    await page.locator('.level-node.current').first().click({ force: true });
    await page.locator('.story-screen, .posture-card').first().waitFor();
    if (await page.locator('.story-screen').count()) await page.keyboard.press('Escape');
    const nk = page.locator('.newkey-card');
    await nk.waitFor();
    const box = (await nk.boundingBox())!;
    expect(box.height).toBeLessThan(size.height * 0.6);
    // Esc skips a key card; the keys of the lesson come one by one before the get-ready card.
    const posture = page.locator('.posture-card');
    for (let i = 0; i < 10 && !(await posture.count()); i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    await posture.waitFor();
    await noScroll(page);
    await expect(page.locator('.space-key')).toBeInViewport({ ratio: 1 });
  }
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = 'https://jodjai-daily-wallet.theprimecent.chatgpt.site/';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200, 'Production must be publicly accessible');
  assert.equal(new URL(page.url()).origin, new URL(url).origin, 'No login redirect');
  const hasPinScreen = await page.locator('#pin-screen').count() > 0;
  async function pin() {
    for (const digit of '4826') await page.locator(`[data-digit="${digit}"]`).click();
    await page.locator('#pin-ok').click();
  }
  if (hasPinScreen) {
    await pin();
    await page.waitForFunction(() => document.querySelector('#pin-title').textContent.includes('ยืนยัน'));
    await pin();
  }
  await page.locator('#main-app').waitFor({ state: 'visible' });
  await page.locator('#add-nav').click();
  await page.locator('#amount-input').fill('120.25');
  await page.locator('[data-category="credit_card"]').click();
  await page.locator('#transaction-form .save-btn').click();
  await page.locator('#add-modal').waitFor({ state: 'hidden' });
  assert.match(await page.locator('#transaction-list').textContent(), /บัตรเครดิต/);
  await page.locator('[data-tab="analytics"]').click();
  assert.match(await page.locator('#category-rankings').textContent(), /บัตรเครดิต/);
  await page.reload();
  if (hasPinScreen) await pin();
  await page.locator('#main-app').waitFor({ state: 'visible' });
  assert.match(await page.locator('#today-total').textContent(), /120.25/);
  await page.locator('[data-tab="settings"]').click();
  assert.match(await page.locator('.footer-note').textContent(), /rev02\.[123]/);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-btn').click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), 'utf8');
  assert.match(csv, /credit_card/);
  assert.deepEqual(errors, []);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('JodJai production: public access, PIN, credit card, analytics, persistence, CSV and mobile width passed.');
} finally {
  await browser.close();
}

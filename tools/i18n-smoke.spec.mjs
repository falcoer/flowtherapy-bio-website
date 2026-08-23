import { test, expect } from '@playwright/test';

const base = 'http://127.0.0.1:4173';
const locales = [
  ['fr-FR','fr','Nous contacter'],
  ['en-GB','en','Contact us'],
  ['es-ES','es','Contactarnos'],
  ['it-IT','it','Contattaci'],
  ['de-DE','de','Kontakt'],
  ['pt-PT','pt','Contacte-nos'],
  ['zh-CN','zh','联系我们'],
  ['ja-JP','ja','お問い合わせ']
];

test('la racine publique détecte les huit langues du navigateur', async ({ browser }) => {
  for (const [browserLocale,expected,title] of locales) {
    const context=await browser.newContext({locale:browserLocale});
    await context.route(/\.(?:avif|webp|png|jpe?g|woff2)(?:\?|$)/,route=>route.abort());
    const page=await context.newPage();
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem('ft-locale','en'));
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await expect(page).toHaveURL(new RegExp('/'+expected+'/$'));
    await expect(page.locator('html')).toHaveAttribute('lang',expected);
    await expect(page.locator('#contact-title')).toHaveText(title);
    await expect(page.locator('.home')).toBeVisible();
    await expect(page.locator('.error')).toHaveCount(0);
    expect(errors).toEqual([]);
    await context.close();
  }
});

test('la racine publique change de langue sans rechargement', async ({ page }, testInfo) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/en/',{waitUntil:'networkidle'});
  await expect(page.locator('.home')).toBeVisible();
  const navigations=await page.evaluate(()=>performance.getEntriesByType('navigation').length);
  await page.locator('#language-toggle').click();
  await page.locator('[data-locale="es"]').click();
  await expect(page).toHaveURL(/\/es\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang','es');
  await expect(page.locator('#contact-title')).toHaveText('Contactarnos');
  expect(await page.evaluate(()=>performance.getEntriesByType('navigation').length)).toBe(navigations);
  await page.locator('#theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',/dark|light/);
  await page.locator('[data-media-index="0"]').click();
  await expect(page.locator('#media-dialog')).toHaveAttribute('open','');
  await page.locator('#media-close').click();
  await page.screenshot({path:testInfo.outputPath('public-i18n-desktop.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('les huit routes publiques localisées sont rechargeables', async ({ page }) => {
  await page.route(/\.(?:avif|webp|png|jpe?g|woff2)(?:\?|$)/,route=>route.abort());
  for (const [,locale,title] of locales) {
    await page.goto(base+'/'+locale+'/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.locator('#contact-title')).toHaveText(title);
    await expect(page.locator('.error')).toHaveCount(0);
  }
});

test('le sélecteur reste utilisable sur mobile avec huit langues', async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/ja/',{waitUntil:'networkidle'});
  await page.locator('#language-toggle').click();
  await expect(page.locator('.language-option')).toHaveCount(8);
  await expect(page.locator('[data-locale="zh"]')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('public-i18n-mobile.png'),fullPage:true});
});

test('la préversion isolée accepte les nouvelles langues', async ({ page }) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/i18n-preview/zh/',{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('lang','zh');
  await expect(page.locator('#contact-title')).toHaveText('联系我们');
  await expect(page.locator('.error')).toHaveCount(0);
  expect(errors).toEqual([]);
});

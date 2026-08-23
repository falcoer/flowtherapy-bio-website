import { test, expect } from '@playwright/test';

const base = 'http://127.0.0.1:4173';

test('la racine publique détecte la première langue du navigateur', async ({ browser }) => {
  for (const [locale,expected,title] of [['fr-FR','fr','Nous contacter'],['en-GB','en','Contact us']]) {
    const context=await browser.newContext({locale});
    const page=await context.newPage();
    const errors=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem('ft-locale','en'));
    await page.goto(base+'/',{waitUntil:'networkidle'});
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
  await page.locator('[data-locale="fr"]').click();
  await expect(page).toHaveURL(/\/fr\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang','fr');
  await expect(page.locator('#contact-title')).toHaveText('Nous contacter');
  expect(await page.evaluate(()=>performance.getEntriesByType('navigation').length)).toBe(navigations);
  await page.locator('#theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',/dark|light/);
  await page.locator('[data-media-index="0"]').click();
  await expect(page.locator('#media-dialog')).toHaveAttribute('open','');
  await page.locator('#media-close').click();
  await page.screenshot({path:testInfo.outputPath('public-i18n-desktop.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('les routes publiques localisées sont rechargeables', async ({ page }, testInfo) => {
  for (const [locale,title] of [['fr','Nous contacter'],['en','Contact us']]) {
    await page.goto(base+'/'+locale+'/',{waitUntil:'networkidle'});
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await expect(page.locator('#contact-title')).toHaveText(title);
    await expect(page.locator('.error')).toHaveCount(0);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/en/',{waitUntil:'networkidle'});
  await expect(page.locator('#language-toggle')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('public-i18n-mobile.png'),fullPage:true});
});

test('la préversion isolée reste opérationnelle', async ({ page }) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/i18n-preview/en/',{waitUntil:'networkidle'});
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('#contact-title')).toHaveText('Contact us');
  await expect(page.locator('.error')).toHaveCount(0);
  expect(errors).toEqual([]);
});

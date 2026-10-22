import { test, expect } from '../fixtures.js';
test('CAT-01 @smoke lists the seeded catalog', async ({ store, page }) => {
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(store.product('Orbit Headphones')).toContainText('$129.00');
});
test('CAT-02 search ignores case and surrounding whitespace', async ({ store, page }) => {
  await store.search('  KEYBOARD  ');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(store.product('Field Keyboard')).toBeVisible();
});
test('CAT-03 empty results recover when search is cleared', async ({ store, page }) => {
  await store.search('no such product');
  await expect(page.getByText('No products found', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await store.search(''); await expect(page.getByRole('article')).toHaveCount(3);
});
test('CAT-04 sorts numerically in both directions', async ({ store, page }) => {
  await store.sort('price-asc');
  await expect(page.getByRole('article').getByRole('heading')).toHaveText(['Arc Mouse', 'Field Keyboard', 'Orbit Headphones']);
  await store.sort('price-desc');
  await expect(page.getByRole('article').getByRole('heading')).toHaveText(['Orbit Headphones', 'Field Keyboard', 'Arc Mouse']);
});
test('CAT-05 catalog fits the configured viewport', async ({ store, page }) => {
  await expect(store.product('Arc Mouse')).toBeVisible();
  const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
});

import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures.js';
import { customer } from '../data/customer.js';
import { StorePage } from '../pages/store.page.js';
test('RES-01 injected catalog outage offers a working retry', async ({ api, page }) => {
  void api;
  await page.route('**/api/products', route => route.fulfill({ status: 503, json: { error: 'Injected outage' } }));
  const store = new StorePage(page); await store.open();
  await expect(page.getByRole('alert').filter({ hasText: 'Catalog is unavailable' })).toBeVisible();
  await page.unroute('**/api/products');
  await page.getByRole('button', { name: 'Retry catalog' }).click();
  await expect(store.product('Arc Mouse')).toBeVisible();
});
test('RES-02 injected checkout outage preserves cart and permits retry', async ({ store, page }) => {
  await store.add('Arc Mouse'); await expect(store.cart.total).toHaveText('$49.00');
  await page.route('**/api/orders', route => route.fulfill({ status: 503, json: { error: 'Please try again' } }));
  await store.cart.checkout(customer());
  await expect(store.cart.error).toHaveText('Please try again');
  await expect(store.cart.total).toHaveText('$49.00');
  await page.unroute('**/api/orders'); await store.cart.checkout(customer());
  await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
});
test('A11Y-01 login has no automatically detectable WCAG A/AA violations', async ({ login, page }) => {
  await login.open();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
test('A11Y-02 populated store has no automatically detectable WCAG A/AA violations', async ({ store, page }) => {
  await store.add('Arc Mouse'); await expect(store.cart.total).toHaveText('$49.00');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
test('A11Y-03 sign-in form supports keyboard submission', async ({ login, page }) => {
  await login.open(); await page.getByLabel('Password', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

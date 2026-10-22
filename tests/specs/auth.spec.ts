import { test, expect } from '../fixtures.js';
test('AUTH-01 @smoke signs in through the UI', async ({ login, page }) => {
  await login.open(); await login.signIn();
  await expect(page.getByRole('heading', { name: 'Make room for focus.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});
test('AUTH-02 rejects incorrect credentials', async ({ login, page }) => {
  await login.open(); await login.signIn('demo@example.test', 'incorrect');
  await expect(page.getByRole('alert').filter({ hasText: 'Incorrect email or password' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeHidden();
});
test('AUTH-03 signing out invalidates the server session', async ({ store, page }) => {
  await expect(store.cart.total).toHaveText('$0.00');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  expect((await page.request.get('/api/cart')).status()).toBe(401);
});
test('AUTH-04 anonymous requests cannot create orders', async ({ request }) => {
  const response = await request.post('/api/orders', { data: { name: 'Alex Example', address: '42 Test Street' } });
  expect(response.status()).toBe(401);
});

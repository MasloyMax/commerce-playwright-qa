import { test, expect } from '../fixtures.js';
import { customer } from '../data/customer.js';
test('CART-01 @smoke adds two products and calculates the exact total', async ({ store }) => {
  await store.add('Orbit Headphones'); await expect(store.cart.total).toHaveText('$129.00');
  await store.add('Field Keyboard'); await expect(store.cart.total).toHaveText('$218.00');
});
test('CART-02 cart survives page reload', async ({ store, page }) => {
  await store.add('Arc Mouse'); await expect(store.cart.total).toHaveText('$49.00');
  await page.reload();
  await expect(store.cart.item('Arc Mouse').getByRole('spinbutton')).toHaveValue('1');
  await expect(store.cart.total).toHaveText('$49.00');
});
test('CART-03 quantity updates the total and removal empties the cart', async ({ store }) => {
  await store.add('Arc Mouse'); await expect(store.cart.total).toHaveText('$49.00');
  await store.cart.quantity('Arc Mouse', '3'); await expect(store.cart.total).toHaveText('$147.00');
  await store.cart.remove('Arc Mouse'); await expect(store.cart.total).toHaveText('$0.00');
  await expect(store.cart.root.getByRole('button', { name: 'Place order' })).toBeDisabled();
});
test('CART-04 quantity boundary is enforced by the server', async ({ store, page }) => {
  await store.add('Arc Mouse'); await expect(store.cart.total).toHaveText('$49.00');
  const response = await page.request.put('/api/cart/mouse', { data: { quantity: 11 } });
  expect(response.status()).toBe(422);
  await page.reload();
  await expect(store.cart.item('Arc Mouse').getByRole('spinbutton')).toHaveValue('1');
});
test('CART-05 independent sessions do not share a cart', async ({ store, browser, baseURL }) => {
  await store.add('Arc Mouse'); await expect(store.cart.total).toHaveText('$49.00');
  const other = await browser.newContext({ baseURL });
  try {
    await other.request.post('/api/login', { data: { email: 'demo@example.test', password: 'Demo-pass-123' } });
    const cart = await other.request.get('/api/cart');
    expect(await cart.json()).toEqual({ items: [], total: 0 });
  } finally { await other.close(); }
});
test('ORDER-01 @smoke places an order and verifies it through the API', async ({ store, api, page }) => {
  await store.add('Orbit Headphones'); await expect(store.cart.total).toHaveText('$129.00');
  await store.cart.checkout(customer());
  await expect(page.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
  const order = await api.order(await page.getByTestId('order-id').innerText());
  expect(order).toMatchObject({ total: 12900, name: 'Alex Example', address: '42 Test Street' });
  expect(order.items).toEqual([expect.objectContaining({ id: 'headphones', quantity: 1, subtotal: 12900 })]);
  await expect(store.cart.total).toHaveText('$0.00');
});
test('ORDER-02 invalid delivery data preserves the cart', async ({ store }) => {
  await store.add('Arc Mouse'); await expect(store.cart.total).toHaveText('$49.00');
  await store.cart.checkout(customer({ name: ' ', address: 'x' }));
  await expect(store.cart.error).toHaveText('Enter a name and a delivery address');
  await expect(store.cart.total).toHaveText('$49.00');
});
test('ORDER-03 client-supplied prices cannot alter the order total', async ({ api, page }) => {
  await api.add('keyboard', 2);
  const response = await page.request.post('/api/orders', { data: { ...customer(), total: 1, price: 1 } });
  expect(response.status()).toBe(201); expect((await response.json()).total).toBe(17800);
});

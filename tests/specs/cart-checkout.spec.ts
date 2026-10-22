import { test, expect } from '../fixtures.js';
import { customer } from '../data/customer.js';

test.afterEach('Завершить сессию пользователя', async ({ api }) => {
  await api.logout();
});

test.describe('Корзина', () => {
  test.beforeEach('Авторизоваться через API и открыть магазин', async ({ api, store }) => {
    await api.login();
    await store.open();
  });

  test('CART-01 @smoke Стоимость двух разных товаров складывается в итог корзины', async ({ store }) => {
    await store.addToCart('Orbit Headphones');
    await expect(store.cart.total).toHaveText('$129.00');

    await store.addToCart('Field Keyboard');
    await expect(store.cart.total).toHaveText('$218.00');
  });

  test('CART-02 Товары и сумма корзины сохраняются после перезагрузки страницы', async ({ store }) => {
    await store.addToCart('Arc Mouse');
    await expect(store.cart.total).toHaveText('$49.00');

    await store.reload();

    await expect(store.cart.quantityInput('Arc Mouse')).toHaveValue('1');
    await expect(store.cart.total).toHaveText('$49.00');
  });

  test('CART-03 Изменение количества пересчитывает сумму, а удаление очищает корзину', async ({ store }) => {
    await store.addToCart('Arc Mouse');
    await expect(store.cart.total).toHaveText('$49.00');

    await store.cart.setQuantity('Arc Mouse', 3);
    await expect(store.cart.total).toHaveText('$147.00');

    await store.cart.remove('Arc Mouse');

    await expect(store.cart.total).toHaveText('$0.00');
    await expect(store.cart.item('Arc Mouse')).toHaveCount(0);
    await expect(store.cart.checkoutButton).toBeDisabled();
  });

  test('CART-04 Сервер отклоняет количество больше десяти и сохраняет прежнее значение', async ({ store, api }) => {
    await store.addToCart('Arc Mouse');
    await expect(store.cart.total).toHaveText('$49.00');

    const response = await api.setQuantity('mouse', 11);
    expect(response.status()).toBe(422);

    await store.reload();
    await expect(store.cart.quantityInput('Arc Mouse')).toHaveValue('1');
  });

  test('CART-05 Корзины двух независимых сессий не влияют друг на друга', async ({ store, secondSessionApi }) => {
    await store.addToCart('Arc Mouse');
    await expect(store.cart.total).toHaveText('$49.00');

    await secondSessionApi.login();
    const cart = await secondSessionApi.cart();

    expect(cart.status()).toBe(200);
    expect(await cart.json()).toEqual({ items: [], total: 0 });
    await expect(store.cart.total).toHaveText('$49.00');
  });
});

test.describe('Оформление заказа', () => {
  test.beforeEach('Авторизоваться через API и открыть магазин', async ({ api, store }) => {
    await api.login();
    await store.open();
  });

  test('ORDER-01 @smoke Оформленный заказ сохраняется на сервере и очищает корзину', async ({ store, api }) => {
    await store.addToCart('Orbit Headphones');
    await expect(store.cart.total).toHaveText('$129.00');

    await store.cart.checkout(customer());

    await expect(store.cart.confirmationHeading).toBeVisible();
    const order = await api.order(await store.cart.orderId.innerText());
    expect(order).toMatchObject({ total: 12900, name: 'Alex Example', address: '42 Test Street' });
    expect(order.items).toEqual([expect.objectContaining({ id: 'headphones', quantity: 1, subtotal: 12900 })]);
    await expect(store.cart.total).toHaveText('$0.00');
  });

  test('ORDER-02 Некорректные данные доставки вызывают ошибку, а корзина сохраняется', async ({ store }) => {
    await store.addToCart('Arc Mouse');
    await expect(store.cart.total).toHaveText('$49.00');

    await store.cart.checkout(customer({ name: ' ', address: 'x' }));

    await expect(store.cart.error).toHaveText('Enter a name and a delivery address');
    await expect(store.cart.total).toHaveText('$49.00');
    await expect(store.cart.quantityInput('Arc Mouse')).toHaveValue('1');
  });
});

test.describe('Расчёт стоимости заказа через API', () => {
  test.beforeEach('Авторизоваться и добавить две клавиатуры в корзину', async ({ api }) => {
    await api.login();
    await api.add('keyboard', 2);
  });

  test('ORDER-03 Подмена цены в запросе не меняет рассчитанную сервером сумму', async ({ api }) => {
    const response = await api.createOrder({ ...customer(), total: 1, price: 1 });

    expect(response.status()).toBe(201);
    expect((await response.json()).total).toBe(17800);
  });
});

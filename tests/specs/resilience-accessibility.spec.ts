import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures.js';
import { customer } from '../data/customer.js';

test.afterEach('Завершить сессию пользователя', async ({ api }) => {
  await api.logout();
});

test.describe('Восстановление каталога после сбоя', () => {
  test.beforeEach('Открыть магазин при недоступном каталоге', async ({ api, page, store }) => {
    await api.login();
    await page.route('**/api/products', route => route.fulfill({ status: 503, json: { error: 'Injected outage' } }));
    await store.open();
  });

  test('RES-01 Кнопка повтора загружает каталог после сбоя', async ({ store, page }) => {
    await expect(store.catalogError).toHaveText('Catalog is unavailable. Please try again.');

    await page.unroute('**/api/products');
    await store.retryCatalog();

    await expect(store.product('Arc Mouse')).toBeVisible();
  });
});

test.describe('Повторное оформление заказа после сбоя', () => {
  test.beforeEach('Добавить товар и сделать сервис заказов недоступным', async ({ api, store, page }) => {
    await api.login();
    await store.open();
    await store.addToCart('Arc Mouse');
    await expect(store.cart.total).toHaveText('$49.00');
    await page.route('**/api/orders', route => route.fulfill({ status: 503, json: { error: 'Please try again' } }));
  });

  test('RES-02 При сбое заказа корзина сохраняется, а повторная попытка проходит успешно', async ({ store, page }) => {
    await store.cart.checkout(customer());

    await expect(store.cart.error).toHaveText('Please try again');
    await expect(store.cart.total).toHaveText('$49.00');

    await page.unroute('**/api/orders');
    await store.cart.checkout(customer());

    await expect(store.cart.confirmationHeading).toBeVisible();
  });
});

test.describe('Доступность страницы входа', () => {
  test.beforeEach('Открыть страницу входа', async ({ login }) => {
    await login.open();
  });

  test('A11Y-01 На странице входа axe не находит нарушений WCAG A/AA', async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();

    expect(results.violations).toEqual([]);
  });

  test('A11Y-03 Пользователь может отправить форму входа с клавиатуры', async ({ login, store }) => {
    await login.focusSignInWithKeyboard();
    await expect(login.signInButton).toBeFocused();

    await login.submitWithKeyboard();

    await expect(store.signOutButton).toBeVisible();
  });
});

test.describe('Доступность магазина с заполненной корзиной', () => {
  test.beforeEach('Авторизоваться, открыть магазин и добавить товар', async ({ api, store }) => {
    await api.login();
    await store.open();
    await store.addToCart('Arc Mouse');
    await expect(store.cart.total).toHaveText('$49.00');
  });

  test('A11Y-02 В магазине с товаром в корзине axe не находит нарушений WCAG A/AA', async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();

    expect(results.violations).toEqual([]);
  });
});

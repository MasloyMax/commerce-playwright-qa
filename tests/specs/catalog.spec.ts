import { test, expect } from '../fixtures.js';

test.afterEach('Завершить сессию пользователя', async ({ api }) => {
  await api.logout();
});

test.describe('Каталог товаров', () => {
  test.beforeEach('Авторизоваться через API и открыть магазин', async ({ api, store }) => {
    await api.login();
    await store.open();
  });

  test('CAT-01 @smoke В каталоге отображаются все три товара и их цены', async ({ store }) => {
    await expect(store.products).toHaveCount(3);
    await expect(store.product('Arc Mouse')).toContainText('$49.00');
    await expect(store.product('Field Keyboard')).toContainText('$89.00');
    await expect(store.product('Orbit Headphones')).toContainText('$129.00');
  });

  test('CAT-02 Поиск находит товар независимо от регистра и пробелов по краям', async ({ store }) => {
    await store.search('  KEYBOARD  ');

    await expect(store.products).toHaveCount(1);
    await expect(store.product('Field Keyboard')).toBeVisible();
  });

  test('CAT-03 Очистка поиска возвращает товары после пустой выдачи', async ({ store }) => {
    await store.search('no such product');

    await expect(store.noResults).toBeVisible();
    await expect(store.products).toHaveCount(0);

    await store.search('');

    await expect(store.products).toHaveCount(3);
  });

  test('CAT-04 Товары сортируются по возрастанию и убыванию цены', async ({ store }) => {
    await store.sortBy('price-asc');
    await expect(store.productNames).toHaveText(['Arc Mouse', 'Field Keyboard', 'Orbit Headphones']);

    await store.sortBy('price-desc');
    await expect(store.productNames).toHaveText(['Orbit Headphones', 'Field Keyboard', 'Arc Mouse']);
  });

  test('CAT-05 Каталог помещается на экране без горизонтальной прокрутки', async ({ store }) => {
    await expect(store.product('Arc Mouse')).toBeVisible();

    const size = await store.viewportSize();

    expect(size.scroll).toBeLessThanOrEqual(size.width);
  });
});

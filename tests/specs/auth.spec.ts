import { test, expect } from '../fixtures.js';
import { customer, demoUser } from '../data/customer.js';

test.afterEach('Завершить сессию пользователя', async ({ api }) => {
  await api.logout();
});

test.describe('Вход в аккаунт', () => {
  test.beforeEach('Открыть страницу входа', async ({ login }) => {
    await login.open();
  });

  test('AUTH-01 @smoke Пользователь входит с правильным email и паролем', async ({ login, store }) => {
    await login.signIn();

    await expect(store.heading).toBeVisible();
    await expect(store.signOutButton).toBeVisible();
  });

  test('AUTH-02 Неверный пароль вызывает ошибку и не даёт войти', async ({ login, store }) => {
    await login.signIn(demoUser.email, 'incorrect');

    await expect(login.error).toHaveText('Incorrect email or password');
    await expect(store.signOutButton).toBeHidden();
  });
});

test.describe('Выход из аккаунта', () => {
  test.beforeEach('Авторизоваться через API и открыть магазин', async ({ api, store }) => {
    await api.login();
    await store.open();
  });

  test('AUTH-03 После выхода сессия больше не даёт доступ к корзине', async ({ store, login, api }) => {
    await expect(store.cart.total).toHaveText('$0.00');

    await store.signOut();

    await expect(login.signInButton).toBeVisible();
    expect((await api.cart()).status()).toBe(401);
  });
});

test('AUTH-04 Гость не может оформить заказ через API', async ({ api }) => {
  const response = await api.createOrder(customer());

  expect(response.status()).toBe(401);
});

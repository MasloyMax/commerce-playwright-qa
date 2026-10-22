import { test as base, expect } from '@playwright/test';
import { StoreApi } from './support/store-api.js';
import { StorePage } from './pages/store.page.js';
import { LoginPage } from './pages/login.page.js';
type Fixtures = {
  api: StoreApi;
  secondSessionApi: StoreApi;
  store: StorePage;
  login: LoginPage;
};

export const test = base.extend<Fixtures>({
  api: async ({ context }, use) => {
    // API и UI используют cookies одного тестового контекста.
    // Авторизация выполняется явно в beforeEach, выход — в afterEach.
    await use(new StoreApi(context.request));
  },
  store: async ({ page }, use) => {
    await use(new StorePage(page));
  },
  login: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  secondSessionApi: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    const api = new StoreApi(context.request);
    try {
      await use(api);
    } finally {
      try {
        await api.logout();
      } finally {
        // Контекст создан вручную, поэтому закрываем его даже при ошибке очистки.
        await context.close();
      }
    }
  },
});

// Встроенные page/context закрываются после afterEach даже при падении теста.
// browser принадлежит worker: Playwright закрывает его при завершении worker.
export { expect };

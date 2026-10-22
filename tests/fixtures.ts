import { test as base, expect } from '@playwright/test';
import { StoreApi } from './support/store-api.js';
import { StorePage } from './pages/store.page.js';
import { LoginPage } from './pages/login.page.js';
type Fixtures = { api: StoreApi; store: StorePage; login: LoginPage };
export const test = base.extend<Fixtures>({
  api: async ({ page }, use) => {
    // Shares cookies only with the current test's browser context.
    const api = new StoreApi(page.request);
    await api.login();
    await use(api);
    await page.request.post('/api/logout');
  },
  store: async ({ page, api }, use) => {
    void api; // Explicit fixture dependency: authenticate before navigation.
    const store = new StorePage(page);
    await store.open();
    await expect(store.product('Arc Mouse')).toBeVisible();
    await use(store);
  },
  login: async ({ page }, use) => { await use(new LoginPage(page)); },
});
export { expect };

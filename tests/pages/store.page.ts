import type { Locator, Page } from '@playwright/test';
import { CartComponent } from './cart.component.js';

type ProductSort = 'name' | 'price-asc' | 'price-desc';

export class StorePage {
  readonly cart: CartComponent;
  readonly heading: Locator;
  readonly signOutButton: Locator;
  readonly products: Locator;
  readonly productNames: Locator;
  readonly noResults: Locator;
  readonly catalogError: Locator;
  private readonly searchInput: Locator;
  private readonly sortSelect: Locator;
  private readonly retryCatalogButton: Locator;

  constructor(private readonly page: Page) {
    const catalog = page.getByRole('region', { name: 'Catalog', exact: true });
    this.cart = new CartComponent(page.getByRole('complementary', { name: 'Shopping cart' }));
    this.heading = page.getByRole('heading', { name: 'Make room for focus.' });
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
    this.products = catalog.getByRole('article');
    this.productNames = this.products.getByRole('heading');
    this.noResults = catalog.getByText('No products found', { exact: true });
    this.catalogError = catalog.getByRole('alert');
    this.searchInput = catalog.getByLabel('Search products');
    this.sortSelect = catalog.getByLabel('Sort products');
    this.retryCatalogButton = catalog.getByRole('button', { name: 'Retry catalog' });
  }

  async open() {
    await this.page.goto('/');
    await this.waitForReady();
  }

  async reload() {
    await this.page.reload();
    await this.waitForReady();
  }

  product(name: string) {
    return this.products.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  async addToCart(name: string) {
    await this.product(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async sortBy(value: ProductSort) {
    await this.sortSelect.selectOption(value);
  }

  async signOut() {
    await this.signOutButton.click();
  }

  async retryCatalog() {
    await this.retryCatalogButton.click();
  }

  async viewportSize() {
    return this.page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
  }

  private async waitForReady() {
    // Готовность страницы не зависит от успешной загрузки каталога.
    await this.heading.waitFor({ state: 'visible' });
    await this.cart.root.waitFor({ state: 'visible' });
  }
}

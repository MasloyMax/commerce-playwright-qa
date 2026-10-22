import type { Page } from '@playwright/test';
import { CartComponent } from './cart.component.js';
export class StorePage {
  readonly cart: CartComponent;
  constructor(readonly page: Page) {
    this.cart = new CartComponent(page.getByRole('complementary', { name: 'Shopping cart' }));
  }
  async open() { await this.page.goto('/'); }
  product(name: string) { return this.page.getByRole('article', { name, exact: true }); }
  async add(name: string) { await this.product(name).getByRole('button', { name: 'Add to cart' }).click(); }
  async search(query: string) { await this.page.getByLabel('Search products').fill(query); }
  async sort(value: string) { await this.page.getByLabel('Sort products').selectOption(value); }
}

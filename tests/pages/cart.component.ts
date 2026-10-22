import type { Locator } from '@playwright/test';
export class CartComponent {
  constructor(readonly root: Locator) {}
  item(name: string) { return this.root.getByRole('region', { name, exact: true }); }
  async quantity(name: string, quantity: string) {
    const field = this.item(name).getByRole('spinbutton');
    await field.fill(quantity); await field.press('Tab');
  }
  async remove(name: string) { await this.item(name).getByRole('button', { name: 'Remove' }).click(); }
  async checkout(customer: { name: string; address: string }) {
    await this.root.getByLabel('Full name').fill(customer.name);
    await this.root.getByLabel('Delivery address').fill(customer.address);
    await this.root.getByRole('button', { name: 'Place order' }).click();
  }
  get total() { return this.root.getByTestId('cart-total'); }
  get error() { return this.root.getByRole('alert'); }
}

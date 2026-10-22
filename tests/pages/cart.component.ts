import type { Locator } from '@playwright/test';
import type { Customer } from '../data/customer.js';

export class CartComponent {
  readonly total: Locator;
  readonly error: Locator;
  readonly checkoutButton: Locator;
  readonly confirmationHeading: Locator;
  readonly orderId: Locator;
  private readonly nameInput: Locator;
  private readonly addressInput: Locator;

  constructor(readonly root: Locator) {
    this.total = root.getByTestId('cart-total');
    this.error = root.getByRole('alert');
    this.checkoutButton = root.getByRole('button', { name: 'Place order' });
    this.confirmationHeading = root.getByRole('heading', { name: 'Order confirmed' });
    this.orderId = root.getByTestId('order-id');
    this.nameInput = root.getByLabel('Full name');
    this.addressInput = root.getByLabel('Delivery address');
  }

  item(name: string) {
    return this.root.getByRole('region', { name, exact: true });
  }

  quantityInput(name: string) {
    return this.item(name).getByRole('spinbutton');
  }

  async setQuantity(name: string, quantity: number) {
    const field = this.quantityInput(name);
    await field.fill(String(quantity));
    await field.press('Tab');
  }

  async remove(name: string) {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async checkout(customer: Customer) {
    await this.nameInput.fill(customer.name);
    await this.addressInput.fill(customer.address);
    await this.checkoutButton.click();
  }
}

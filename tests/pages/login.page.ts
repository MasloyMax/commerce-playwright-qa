import type { Page } from '@playwright/test';
import { demoUser } from '../data/customer.js';
export class LoginPage {
  constructor(private readonly page: Page) {}
  async open() { await this.page.goto('/'); }
  async signIn(email: string = demoUser.email, password: string = demoUser.password) {
    await this.page.getByLabel('Email', { exact: true }).fill(email);
    await this.page.getByLabel('Password', { exact: true }).fill(password);
    await this.page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
}

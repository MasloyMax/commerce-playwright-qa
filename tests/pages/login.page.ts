import type { Locator, Page } from '@playwright/test';
import { demoUser } from '../data/customer.js';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    const root = page.locator('#login-view');
    this.emailInput = root.getByLabel('Email', { exact: true });
    this.passwordInput = root.getByLabel('Password', { exact: true });
    this.signInButton = root.getByRole('button', { name: 'Sign in', exact: true });
    this.error = root.getByRole('alert');
  }

  async open() {
    await this.page.goto('/');
    await this.signInButton.waitFor({ state: 'visible' });
  }

  async signIn(email: string = demoUser.email, password: string = demoUser.password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async focusSignInWithKeyboard() {
    await this.passwordInput.focus();
    await this.page.keyboard.press('Tab');
  }

  async submitWithKeyboard() {
    await this.page.keyboard.press('Enter');
  }
}

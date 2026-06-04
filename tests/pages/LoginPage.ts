import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../src/lib/BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page
      .locator('[data-testid="username"], input[type="text"], input[name="username"]')
      .first();
    this.passwordInput = page.locator('[data-testid="password"], input[type="password"]').first();
    this.loginButton = page
      .locator('[data-testid="login-btn"], button[type="submit"], button:has-text("Login")')
      .first();
    this.errorMessage = page
      .locator('[data-testid="error-msg"], .error-message, .error')
      .first();
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForVisible(this.loginButton, 5_000);
      return true;
    } catch {
      return false;
    }
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.info(`Login: ${username}`);
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }
}

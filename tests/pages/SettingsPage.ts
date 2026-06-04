import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../src/lib/BasePage';

export class SettingsPage extends BasePage {
  readonly header: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly themeSelect: Locator;
  readonly languageSelect: Locator;
  readonly notificationsToggle: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator('[data-testid="settings-header"]').first();
    this.saveButton = page.locator('[data-testid="save-btn"], button:has-text("Save")').first();
    this.cancelButton = page.locator('[data-testid="cancel-btn"], button:has-text("Cancel")').first();
    this.themeSelect = page.locator('[data-testid="theme-select"], select[name="theme"]').first();
    this.languageSelect = page.locator('[data-testid="lang-select"], select[name="language"]').first();
    this.notificationsToggle = page
      .locator('[data-testid="notifications-toggle"], input[type="checkbox"][name="notifications"]')
      .first();
    this.successToast = page.locator('[data-testid="success-toast"], .toast-success, .toast').first();
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForVisible(this.header, 5_000);
      return true;
    } catch {
      return false;
    }
  }

  async setTheme(theme: string): Promise<void> {
    await this.selectOption(this.themeSelect, theme);
  }

  async setLanguage(language: string): Promise<void> {
    await this.selectOption(this.languageSelect, language);
  }

  async toggleNotifications(): Promise<void> {
    await this.click(this.notificationsToggle);
  }

  async save(): Promise<void> {
    await this.click(this.saveButton);
    await this.waitForVisible(this.successToast);
  }

  async cancel(): Promise<void> {
    await this.click(this.cancelButton);
  }

  async isNotificationsEnabled(): Promise<boolean> {
    return this.isChecked(this.notificationsToggle);
  }
}

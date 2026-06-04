import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class Assertions {
  static async elementVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  static async elementHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  static async textEquals(locator: Locator, expected: string): Promise<void> {
    await expect(locator).toHaveText(expected);
  }

  static async textContains(locator: Locator, substring: string): Promise<void> {
    await expect(locator).toContainText(substring);
  }

  static async isEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  static async isDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }

  static async titleMatches(page: Page, expected: string | RegExp): Promise<void> {
    await expect(page).toHaveTitle(expected);
  }
}

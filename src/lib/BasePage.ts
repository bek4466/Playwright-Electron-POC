import { Page, Locator, expect } from '@playwright/test';
import { AppConfig } from '../config/app.config';
import { Logger } from '../utils/logger';

export abstract class BasePage {
  protected readonly logger: Logger;

  constructor(protected readonly page: Page) {
    this.logger = new Logger(this.constructor.name);
  }

  async waitForVisible(locator: Locator, timeout: number = AppConfig.defaultTimeout): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(locator: Locator, timeout: number = AppConfig.defaultTimeout): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  async click(locator: Locator): Promise<void> {
    this.logger.debug(`Clicking element`);
    await this.waitForVisible(locator);
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    this.logger.debug(`Filling: ${value}`);
    await this.waitForVisible(locator);
    await locator.clear();
    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    await this.waitForVisible(locator);
    return (await locator.textContent()) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async assertText(locator: Locator, expected: string): Promise<void> {
    await expect(locator).toHaveText(expected);
  }

  async screenshot(name: string): Promise<Buffer> {
    this.logger.info(`Screenshot: ${name}`);
    return this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  abstract isLoaded(): Promise<boolean>;
}

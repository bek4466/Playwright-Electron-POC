import { Page, Locator, expect } from '@playwright/test';
import { AppConfig } from '../config/app.config';
import { Logger } from '../utils/logger';

export abstract class BasePage {
  protected readonly logger: Logger;

  constructor(protected readonly page: Page) {
    this.logger = new Logger(this.constructor.name);
  }

  // ── Waits ─────────────────────────────────────────────────────────────────

  async waitForVisible(locator: Locator, timeout: number = AppConfig.defaultTimeout): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(locator: Locator, timeout: number = AppConfig.defaultTimeout): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  async waitForText(locator: Locator, text: string, timeout: number = AppConfig.defaultTimeout): Promise<void> {
    await expect(locator).toContainText(text, { timeout });
  }

  async waitForCount(locator: Locator, count: number, timeout: number = AppConfig.defaultTimeout): Promise<void> {
    await expect(locator).toHaveCount(count, { timeout });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async click(locator: Locator): Promise<void> {
    this.logger.debug(`click`);
    await this.waitForVisible(locator);
    await locator.click();
  }

  async doubleClick(locator: Locator): Promise<void> {
    this.logger.debug(`doubleClick`);
    await this.waitForVisible(locator);
    await locator.dblclick();
  }

  async rightClick(locator: Locator): Promise<void> {
    this.logger.debug(`rightClick`);
    await this.waitForVisible(locator);
    await locator.click({ button: 'right' });
  }

  async hover(locator: Locator): Promise<void> {
    await this.waitForVisible(locator);
    await locator.hover();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    this.logger.debug(`fill: ${value}`);
    await this.waitForVisible(locator);
    await locator.clear();
    await locator.fill(value);
  }

  async selectOption(locator: Locator, value: string): Promise<void> {
    this.logger.debug(`select: ${value}`);
    await this.waitForVisible(locator);
    await locator.selectOption(value);
  }

  async pressKey(key: string): Promise<void> {
    this.logger.debug(`key: ${key}`);
    await this.page.keyboard.press(key);
  }

  async pressKeyOn(locator: Locator, key: string): Promise<void> {
    await this.waitForVisible(locator);
    await locator.press(key);
  }

  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  async getText(locator: Locator): Promise<string> {
    await this.waitForVisible(locator);
    return (await locator.textContent()) ?? '';
  }

  async getValue(locator: Locator): Promise<string> {
    await this.waitForVisible(locator);
    return (await locator.inputValue()) ?? '';
  }

  async getAttribute(locator: Locator, attr: string): Promise<string> {
    await this.waitForVisible(locator);
    return (await locator.getAttribute(attr)) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  async isChecked(locator: Locator): Promise<boolean> {
    return locator.isChecked();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  async assertText(locator: Locator, expected: string): Promise<void> {
    await expect(locator).toHaveText(expected);
  }

  async assertContains(locator: Locator, substring: string): Promise<void> {
    await expect(locator).toContainText(substring);
  }

  async assertEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  async assertDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }

  // ── Screenshot ────────────────────────────────────────────────────────────

  async screenshot(name: string): Promise<Buffer> {
    this.logger.info(`screenshot: ${name}`);
    return this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  abstract isLoaded(): Promise<boolean>;
}

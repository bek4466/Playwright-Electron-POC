import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../src/lib/BasePage';

export class MainPage extends BasePage {
  readonly contentArea: Locator;
  readonly navigationMenu: Locator;
  readonly titleBar: Locator;
  readonly statusBar: Locator;

  constructor(page: Page) {
    super(page);
    this.contentArea = page.locator('[data-testid="content"], .content, main').first();
    this.navigationMenu = page.locator('[data-testid="nav-menu"], .nav-menu, nav').first();
    this.titleBar = page.locator('[data-testid="app-title"], .title-bar, h1').first();
    this.statusBar = page.locator('[data-testid="status-bar"], .status-bar').first();
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForVisible(this.navigationMenu, 5_000);
      return true;
    } catch {
      return false;
    }
  }

  async getTitle(): Promise<string> {
    return this.getText(this.titleBar);
  }

  async navigateTo(section: string): Promise<void> {
    const item = this.page
      .locator(`[data-testid="nav-${section}"], .nav-item:has-text("${section}")`)
      .first();
    await this.click(item);
  }
}

import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../src/lib/BasePage';

export class DashboardPage extends BasePage {
  readonly header: Locator;
  readonly summaryCards: Locator;
  readonly activityFeed: Locator;
  readonly refreshButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.locator('[data-testid="dashboard-header"]').first();
    this.summaryCards = page.locator('[data-testid="summary-card"], .summary-card, .card');
    this.activityFeed = page.locator('[data-testid="activity-feed"], .activity-feed').first();
    this.refreshButton = page.locator('[data-testid="refresh-btn"], button:has-text("Refresh")').first();
    this.searchInput = page.locator('[data-testid="search"], input[placeholder*="Search"]').first();
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForVisible(this.header, 5_000);
      return true;
    } catch {
      return false;
    }
  }

  async getSummaryCardCount(): Promise<number> {
    return this.summaryCards.count();
  }

  async refresh(): Promise<void> {
    await this.click(this.refreshButton);
  }

  async search(query: string): Promise<void> {
    await this.fill(this.searchInput, query);
    await this.pressKey('Enter');
  }

  async getCardText(index: number): Promise<string> {
    return this.getText(this.summaryCards.nth(index));
  }
}

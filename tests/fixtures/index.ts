import { test as base } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { allure } from 'allure-playwright';
import { AppConfig } from '../../src/config/app.config';
import { Logger } from '../../src/utils/logger';

type ElectronFixtures = {
  electronApp: ElectronApplication;
  electronPage: Page;
  secondaryWindow: Page;
  loggedInPage: Page;
};

const logger = new Logger('Fixture');

async function attachPageScreenshot(page: Page, label: string): Promise<void> {
  try {
    const buf = await page.screenshot({ fullPage: true });
    await allure.attachment(label, buf, 'image/png');
  } catch {
    // page may already be closed
  }
}

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    logger.info(AppConfig.devMode ? `Dev mode: ${AppConfig.mainJsPath}` : `Exe: ${AppConfig.executablePath}`);

    const app = AppConfig.devMode
      ? await electron.launch({ args: [AppConfig.mainJsPath], timeout: AppConfig.launchTimeout })
      : await electron.launch({ executablePath: AppConfig.executablePath, timeout: AppConfig.launchTimeout });

    await use(app);
    logger.info('Closing app');
    await app.close();
  },

  electronPage: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    const consoleLogs: string[] = [];
    window.on('console', msg => consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`));

    await window.waitForLoadState('domcontentloaded');
    await use(window);

    if (consoleLogs.length > 0) {
      await allure.attachment('Console Logs', consoleLogs.join('\n'), 'text/plain');
    }
    await attachPageScreenshot(window, 'Final State');
    // Note: video recording is not supported for Electron apps in Playwright.
    // Use the Playwright trace viewer (Traces tab) for step-by-step visual replay.
    await allure.attachment(
      'Video — Not Available',
      'Playwright video recording is not supported for Electron apps.\nUse the Playwright HTML report trace viewer instead:\n  npx playwright show-report',
      'text/plain',
    );
  },

  secondaryWindow: async ({ electronApp }, use) => {
    const windows = await electronApp.windows();
    const secondary = windows.length > 1 ? windows[1] : await electronApp.firstWindow();
    await secondary.waitForLoadState('domcontentloaded');
    await use(secondary);
  },

  loggedInPage: async ({ electronPage }, use) => {
    const loginBtn = electronPage.locator('[data-testid="login-btn"]');
    if (await loginBtn.isVisible()) {
      await electronPage.locator('[data-testid="username"]').fill('admin');
      await electronPage.locator('[data-testid="password"]').fill('admin123');
      await loginBtn.click();
      await electronPage.locator('[data-testid="nav-menu"]').waitFor({ state: 'visible', timeout: 5_000 });
    }
    await use(electronPage);
    await attachPageScreenshot(electronPage, 'Post-Test State');
  },
});

export { expect } from '@playwright/test';

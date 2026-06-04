import { test as base } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { AppConfig } from '../../src/config/app.config';
import { Logger } from '../../src/utils/logger';

type ElectronFixtures = {
  electronApp: ElectronApplication;
  electronPage: Page;
  secondaryWindow: Page;
  loggedInPage: Page;
};

const logger = new Logger('Fixture');

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
    await window.waitForLoadState('domcontentloaded');
    await use(window);
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
  },
});

export { expect } from '@playwright/test';

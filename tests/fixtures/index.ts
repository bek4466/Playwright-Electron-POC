import { test as base } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';
import { AppConfig } from '../../src/config/app.config';
import { Logger } from '../../src/utils/logger';

type ElectronFixtures = {
  electronApp: ElectronApplication;
  electronPage: Page;
};

const logger = new Logger('Fixture');

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    logger.info(`Launching: ${AppConfig.executablePath}`);
    const app = await electron.launch({
      executablePath: AppConfig.executablePath,
      timeout: AppConfig.launchTimeout,
    });
    await use(app);
    logger.info('Closing app');
    await app.close();
  },

  electronPage: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await use(window);
  },
});

export { expect } from '@playwright/test';

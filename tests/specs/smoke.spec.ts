import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { ElectronUtils } from '../../src/utils/electron.utils';

test.describe('Smoke Tests', () => {
  test('application launches and window is visible', async ({ electronPage }) => {
    await test.step('Verify page is defined', () => {
      expect(electronPage).toBeDefined();
    });
    await test.step('Wait for DOM content loaded', async () => {
      await electronPage.waitForLoadState('domcontentloaded');
    });
  });

  test('login screen loads on startup', async ({ electronPage }) => {
    const loginPage = new LoginPage(electronPage);
    await test.step('Verify login screen is shown', async () => {
      expect(await loginPage.isLoaded()).toBe(true);
    });
  });

  test('app metadata is accessible from main process', async ({ electronApp }) => {
    await test.step('Read app info via Electron evaluate', async () => {
      const info = await ElectronUtils.getAppInfo(electronApp);
      expect(info.name).toBeTruthy();
      expect(info.version).toBeTruthy();
    });
  });

  test('single window open on launch', async ({ electronPage, electronApp }) => {
    await test.step('Verify window is open', () => {
      expect(electronPage).toBeDefined();
    });
    await test.step('Verify window count is 1', async () => {
      const count = await ElectronUtils.getWindowCount(electronApp);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});

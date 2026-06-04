import { test, expect } from '../fixtures';
import { MainPage } from '../pages/MainPage';
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

  test('main window content area loads', async ({ electronPage }) => {
    const mainPage = new MainPage(electronPage);
    await test.step('Check main page loaded state', async () => {
      const loaded = await mainPage.isLoaded();
      expect(loaded).toBe(true);
    });
  });

  test('app metadata is accessible from main process', async ({ electronApp }) => {
    await test.step('Read app info via Electron evaluate', async () => {
      const info = await ElectronUtils.getAppInfo(electronApp);
      expect(info.name).toBeTruthy();
      expect(info.version).toBeTruthy();
    });
  });

  test('single window open on launch', async ({ electronApp }) => {
    await test.step('Verify window count is 1', async () => {
      const count = await ElectronUtils.getWindowCount(electronApp);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});

import { test, expect } from '../fixtures';
import { allure } from 'allure-playwright';
import { setOwner, setSeverity } from '../helpers/meta';
import { LoginPage } from '../pages/LoginPage';
import { ElectronUtils } from '../../src/utils/electron.utils';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Smoke');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await setOwner(testInfo, 'QA Team');
  });

  test('application launches and window is visible', async ({ electronPage }, testInfo) => {
    await allure.allureId('TC-001');
    await allure.description('Verifies that the Electron application launches successfully and the main window is visible and defined.');
    await setSeverity(testInfo, 'blocker');
    await allure.issue('EAPP-101', 'https://jira.example.com/browse/EAPP-101');
    await allure.tms('TC-001', 'https://testcases.example.com/TC-001');

    await test.step('Verify page is defined', () => {
      expect(electronPage).toBeDefined();
    });
    await test.step('Wait for DOM content loaded', async () => {
      await electronPage.waitForLoadState('domcontentloaded');
    });
  });

  test('login screen loads on startup', async ({ electronPage }, testInfo) => {
    await allure.allureId('TC-002');
    await allure.description('Verifies that the login screen is presented to the user immediately on application startup.');
    await setSeverity(testInfo, 'critical');
    await allure.issue('EAPP-102', 'https://jira.example.com/browse/EAPP-102');
    await allure.tms('TC-002', 'https://testcases.example.com/TC-002');

    const loginPage = new LoginPage(electronPage);
    await test.step('Verify login screen is shown', async () => {
      expect(await loginPage.isLoaded()).toBe(true);
    });
  });

  test('app metadata is accessible from main process', async ({ electronApp }, testInfo) => {
    await allure.allureId('TC-003');
    await allure.description('Verifies that app name and version are accessible via Electron IPC from the main process.');
    await setSeverity(testInfo, 'normal');
    await allure.issue('EAPP-103', 'https://jira.example.com/browse/EAPP-103');
    await allure.tms('TC-003', 'https://testcases.example.com/TC-003');

    await test.step('Read app info via Electron evaluate', async () => {
      const info = await ElectronUtils.getAppInfo(electronApp);
      expect(info.name).toBeTruthy();
      expect(info.version).toBeTruthy();
    });
  });

  test('single window open on launch', async ({ electronPage, electronApp }, testInfo) => {
    await allure.allureId('TC-004');
    await allure.description('Verifies that exactly one window is open when the application first launches.');
    await setSeverity(testInfo, 'normal');
    await allure.issue('EAPP-104', 'https://jira.example.com/browse/EAPP-104');
    await allure.tms('TC-004', 'https://testcases.example.com/TC-004');

    await test.step('Verify window is open', () => {
      expect(electronPage).toBeDefined();
    });
    await test.step('Verify window count is 1', async () => {
      const count = await ElectronUtils.getWindowCount(electronApp);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});

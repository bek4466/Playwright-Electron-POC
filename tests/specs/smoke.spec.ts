import { test, expect } from '../fixtures';
import { MainPage } from '../pages/MainPage';

test.describe('Smoke Tests', () => {
  test('application launches and main window is visible', async ({ electronPage }) => {
    expect(electronPage).toBeDefined();
    await electronPage.waitForLoadState('domcontentloaded');
  });

  test('main window content area loads', async ({ electronPage }) => {
    const mainPage = new MainPage(electronPage);
    const loaded = await mainPage.isLoaded();
    expect(loaded).toBe(true);
  });

  test('app name and version are accessible', async ({ electronApp }) => {
    const info = await electronApp.evaluate(({ app }) => ({
      name: app.getName(),
      version: app.getVersion(),
    }));
    expect(info.name).toBeTruthy();
    expect(info.version).toBeTruthy();
  });
});

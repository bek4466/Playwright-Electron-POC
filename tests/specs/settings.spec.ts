import { test, expect } from '../fixtures';
import { allure } from 'allure-playwright';
import { setOwner, setSeverity } from '../helpers/meta';
import { SettingsPage } from '../pages/SettingsPage';
import testData from '../data/test-data.json';

test.describe('Settings', () => {
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Settings');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await allure.issue('EAPP-500', 'https://jira.example.com/browse/EAPP-500');
    await setOwner(testInfo, 'QA Team');
  });

  test('settings page loads', async ({ loggedInPage }, testInfo) => {
    await allure.allureId('TC-501');
    await allure.description('Verifies that the Settings page loads and is visible after navigating via the nav bar.');
    await setSeverity(testInfo, 'critical');
    await allure.tms('TC-501', 'https://testcases.example.com/TC-501');

    const settings = new SettingsPage(loggedInPage);
    await test.step('Navigate to settings', async () => {
      await loggedInPage.locator('[data-testid="nav-Settings"]').click();
    });
    await test.step('Verify settings loaded', async () => {
      expect(await settings.isLoaded()).toBe(true);
    });
  });

  test.describe('Theme — Data Driven', () => {
    test.beforeEach(async ({}, testInfo) => {
      await allure.story('Theme');
      await allure.issue('EAPP-510', 'https://jira.example.com/browse/EAPP-510');
      testInfo.annotations.push({ type: 'owner', description: 'QA Team' });
    });

    for (const theme of testData.settings.themes) {
      test(`apply theme: ${theme}`, async ({ loggedInPage }, testInfo) => {
        await allure.description(`Verifies that selecting and saving theme "${theme}" persists and triggers a success notification.`);
        await setSeverity(testInfo, 'minor');
        await allure.parameter('theme', theme);
        await allure.tms('TC-510', 'https://testcases.example.com/TC-510');

        const settings = new SettingsPage(loggedInPage);
        await loggedInPage.locator('[data-testid="nav-Settings"]').click();
        await test.step(`Select theme "${theme}"`, async () => {
          await settings.setTheme(theme);
        });
        await test.step('Save settings', async () => {
          await settings.save();
          await settings.assertVisible(settings.successToast);
        });
      });
    }
  });

  test.describe('Language — Data Driven', () => {
    test.beforeEach(async ({}, testInfo) => {
      await allure.story('Language');
      await allure.issue('EAPP-520', 'https://jira.example.com/browse/EAPP-520');
      testInfo.annotations.push({ type: 'owner', description: 'QA Team' });
    });

    for (const lang of testData.settings.languages) {
      test(`set language: ${lang}`, async ({ loggedInPage }, testInfo) => {
        await allure.description(`Verifies that language "${lang}" can be selected and saved in settings.`);
        await setSeverity(testInfo, 'minor');
        await allure.parameter('language', lang);
        await allure.tms('TC-520', 'https://testcases.example.com/TC-520');

        const settings = new SettingsPage(loggedInPage);
        await loggedInPage.locator('[data-testid="nav-Settings"]').click();
        await test.step(`Select language "${lang}"`, async () => {
          await settings.setLanguage(lang);
        });
        await test.step('Save settings', async () => {
          await settings.save();
        });
      });
    }
  });

  test('notifications toggle persists after save', async ({ loggedInPage }, testInfo) => {
    await allure.allureId('TC-530');
    await allure.description('Verifies that toggling notifications and saving persists the new state across a read-back check.');
    await setSeverity(testInfo, 'normal');
    await allure.story('Notifications');
    await allure.issue('EAPP-530', 'https://jira.example.com/browse/EAPP-530');
    await allure.tms('TC-530', 'https://testcases.example.com/TC-530');

    const settings = new SettingsPage(loggedInPage);
    await loggedInPage.locator('[data-testid="nav-Settings"]').click();
    const initial = await settings.isNotificationsEnabled();
    await test.step('Toggle notifications', async () => {
      await settings.toggleNotifications();
    });
    await test.step('Save', async () => {
      await settings.save();
    });
    await test.step('Verify toggled state persisted', async () => {
      expect(await settings.isNotificationsEnabled()).toBe(!initial);
    });
  });
});

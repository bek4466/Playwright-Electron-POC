import { test, expect } from '../fixtures';
import { SettingsPage } from '../pages/SettingsPage';
import testData from '../data/test-data.json';

test.describe('Settings', () => {
  test('settings page loads', async ({ electronPage }) => {
    test.info().annotations.push({ type: 'feature', description: 'Settings' });

    const settings = new SettingsPage(electronPage);
    await test.step('Verify settings loaded', async () => {
      expect(await settings.isLoaded()).toBe(true);
    });
  });

  test.describe('Theme — Data Driven', () => {
    for (const theme of testData.settings.themes) {
      test(`apply theme: ${theme}`, async ({ electronPage }) => {
        test.info().annotations.push({ type: 'feature', description: 'Settings' });
        test.info().annotations.push({ type: 'story', description: 'Theme' });

        const settings = new SettingsPage(electronPage);

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
    for (const lang of testData.settings.languages) {
      test(`set language: ${lang}`, async ({ electronPage }) => {
        test.info().annotations.push({ type: 'feature', description: 'Settings' });
        test.info().annotations.push({ type: 'story', description: 'Language' });

        const settings = new SettingsPage(electronPage);

        await test.step(`Select language "${lang}"`, async () => {
          await settings.setLanguage(lang);
        });

        await test.step('Save settings', async () => {
          await settings.save();
        });
      });
    }
  });

  test('notifications toggle persists after save', async ({ electronPage }) => {
    const settings = new SettingsPage(electronPage);

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

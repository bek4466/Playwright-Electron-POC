import { test, expect } from '../fixtures';
import { MainPage } from '../pages/MainPage';
import testData from '../data/test-data.json';

test.describe('Navigation', () => {
  test('all nav sections are reachable', async ({ electronPage }) => {
    test.info().annotations.push({ type: 'feature', description: 'Navigation' });

    const mainPage = new MainPage(electronPage);

    for (const section of testData.navigation.sections) {
      await test.step(`Navigate to ${section}`, async () => {
        await mainPage.navigateTo(section);
        expect(await mainPage.isLoaded()).toBe(true);
      });
    }
  });

  for (const section of testData.navigation.sections) {
    test(`section "${section}" loads content area`, async ({ electronPage }) => {
      test.info().annotations.push({ type: 'feature', description: 'Navigation' });
      test.info().annotations.push({ type: 'story', description: section });

      const mainPage = new MainPage(electronPage);

      await test.step(`Navigate to ${section}`, async () => {
        await mainPage.navigateTo(section);
      });

      await test.step('Content area visible', async () => {
        await mainPage.assertVisible(mainPage.contentArea);
      });
    });
  }
});

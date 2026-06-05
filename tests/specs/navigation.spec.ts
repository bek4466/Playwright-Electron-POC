import { test, expect } from '../fixtures';
import { allure } from 'allure-playwright';
import { setOwner, setSeverity } from '../helpers/meta';
import { MainPage } from '../pages/MainPage';
import testData from '../data/test-data.json';

test.describe('Navigation', () => {
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Navigation');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await allure.issue('EAPP-400', 'https://jira.example.com/browse/EAPP-400');
    await setOwner(testInfo, 'QA Team');
  });

  test('all nav sections are reachable', async ({ loggedInPage }, testInfo) => {
    await allure.allureId('TC-401');
    await allure.description('Verifies that every navigation section defined in test data can be reached and that the page remains loaded after each navigation.');
    await setSeverity(testInfo, 'critical');
    await allure.tms('TC-401', 'https://testcases.example.com/TC-401');

    const mainPage = new MainPage(loggedInPage);
    for (const section of testData.navigation.sections) {
      await test.step(`Navigate to ${section}`, async () => {
        await mainPage.navigateTo(section);
        expect(await mainPage.isLoaded()).toBe(true);
      });
    }
  });

  for (const section of testData.navigation.sections) {
    test(`section "${section}" loads content area`, async ({ loggedInPage }, testInfo) => {
      await allure.description(`Verifies that navigating to "${section}" renders the content area and it is visible.`);
      await setSeverity(testInfo, 'normal');
      await allure.parameter('section', section);
      await allure.story(section);
      await allure.tms(`TC-NAV-${section.toUpperCase()}`, 'https://testcases.example.com/navigation');

      const mainPage = new MainPage(loggedInPage);
      await test.step(`Navigate to ${section}`, async () => {
        await mainPage.navigateTo(section);
      });
      await test.step('Content area visible', async () => {
        await mainPage.assertVisible(mainPage.contentArea);
      });
    });
  }
});

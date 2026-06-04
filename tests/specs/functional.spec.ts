import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { MainPage } from '../pages/MainPage';
import { TestDataHelper } from '../../src/utils/test-data.helpers';
import testData from '../data/test-data.json';

test.describe('Login — Valid Credentials', () => {
  for (const { username, password, role, expectedPage } of testData.validUsers) {
    test(`[${role}] ${username} can login`, async ({ electronPage }) => {
      test.info().annotations.push({ type: 'feature', description: 'Login' });

      const loginPage = new LoginPage(electronPage);
      const mainPage = new MainPage(electronPage);

      await test.step('Submit credentials', async () => {
        await loginPage.login(username, password);
      });

      await test.step(`Verify redirect to ${expectedPage}`, async () => {
        expect(await mainPage.isLoaded()).toBe(true);
      });
    });
  }
});

test.describe('Login — Invalid Credentials', () => {
  for (const { username, password, expectedError } of testData.invalidUsers) {
    test(`shows error: "${expectedError}"`, async ({ electronPage }) => {
      test.info().annotations.push({ type: 'feature', description: 'Login Validation' });

      const loginPage = new LoginPage(electronPage);

      await test.step('Submit invalid credentials', async () => {
        await loginPage.login(username, password);
      });

      await test.step('Verify error message', async () => {
        const error = await loginPage.getErrorMessage();
        expect(error).toContain(expectedError);
      });
    });
  }
});

test.describe('Login — Screenshot on Assertion', () => {
  test('captures screenshot on page state', async ({ electronPage }) => {
    const loginPage = new LoginPage(electronPage);

    await test.step('Navigate to login', async () => {
      expect(await loginPage.isLoaded()).toBe(true);
    });

    await test.step('Capture page screenshot', async () => {
      const name = TestDataHelper.screenshotName('login-state');
      await loginPage.screenshot(name);
    });
  });
});

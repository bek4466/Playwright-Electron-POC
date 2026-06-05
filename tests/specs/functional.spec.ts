import { test, expect } from '../fixtures';
import { allure } from 'allure-playwright';
import { setOwner, setSeverity } from '../helpers/meta';
import { LoginPage } from '../pages/LoginPage';
import { MainPage } from '../pages/MainPage';
import { TestDataHelper } from '../../src/utils/test-data.helpers';
import testData from '../data/test-data.json';

test.describe('Login — Valid Credentials', () => {
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Authentication');
    await allure.story('Valid Login');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await allure.issue('EAPP-200', 'https://jira.example.com/browse/EAPP-200');
    await setOwner(testInfo, 'QA Team');
  });

  for (const { username, password, role, expectedPage } of testData.validUsers) {
    test(`[${role}] ${username} can login`, async ({ electronPage }, testInfo) => {
      await allure.description(`Verifies that a user with role "${role}" can log in with valid credentials and is redirected to ${expectedPage}.`);
      await setSeverity(testInfo, 'critical');
      await allure.parameter('username', username);
      await allure.parameter('role', role);
      await allure.parameter('expectedPage', expectedPage);
      await allure.tms(`TC-${role.toUpperCase()}-LOGIN`, 'https://testcases.example.com/login-valid');

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
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Authentication');
    await allure.story('Login Validation');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await allure.issue('EAPP-201', 'https://jira.example.com/browse/EAPP-201');
    await setOwner(testInfo, 'QA Team');
  });

  for (const { username, password, expectedError } of testData.invalidUsers) {
    test(`"${username || 'empty'}":"${password || 'empty'}" → ${expectedError}`, async ({ electronPage }, testInfo) => {
      await allure.description(`Verifies that invalid credentials "${username || 'empty'}":"${password || 'empty'}" produce the expected error: "${expectedError}".`);
      await setSeverity(testInfo, 'normal');
      await allure.parameter('username', username || '(empty)');
      await allure.parameter('password', password ? '***' : '(empty)');
      await allure.parameter('expectedError', expectedError);
      await allure.tms('TC-LOGIN-INVALID', 'https://testcases.example.com/login-invalid');

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
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Authentication');
    await allure.story('Screenshot Capture');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await setOwner(testInfo, 'QA Team');
  });

  test('captures screenshot on page state', async ({ electronPage }, testInfo) => {
    await allure.allureId('TC-203');
    await allure.description('Verifies that screenshots can be captured and attached during test execution for state documentation.');
    await setSeverity(testInfo, 'minor');
    await allure.tms('TC-203', 'https://testcases.example.com/TC-203');

    const loginPage = new LoginPage(electronPage);

    await test.step('Navigate to login', async () => {
      expect(await loginPage.isLoaded()).toBe(true);
    });

    await test.step('Capture page screenshot', async () => {
      const name = TestDataHelper.screenshotName('login-state');
      await loginPage.screenshot(name);
      const buf = await electronPage.screenshot();
      await allure.attachment('Login State', buf, 'image/png');
    });
  });
});

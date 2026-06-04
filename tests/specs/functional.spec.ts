import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { MainPage } from '../pages/MainPage';
import testData from '../data/test-data.json';

test.describe('Login - Valid Credentials', () => {
  for (const { username, password, role } of testData.validUsers) {
    test(`login as ${role}: ${username}`, async ({ electronPage }) => {
      const loginPage = new LoginPage(electronPage);
      await loginPage.login(username, password);
      const mainPage = new MainPage(electronPage);
      expect(await mainPage.isLoaded()).toBe(true);
    });
  }
});

test.describe('Login - Invalid Credentials', () => {
  for (const { username, password, expectedError } of testData.invalidUsers) {
    test(`invalid login: "${username || 'empty'}"`, async ({ electronPage }) => {
      const loginPage = new LoginPage(electronPage);
      await loginPage.login(username, password);
      const error = await loginPage.getErrorMessage();
      expect(error).toContain(expectedError);
    });
  }
});

test.describe('Navigation', () => {
  test('all nav sections are accessible', async ({ electronPage }) => {
    const mainPage = new MainPage(electronPage);
    for (const section of testData.navigation.sections) {
      await mainPage.navigateTo(section);
      expect(await mainPage.isLoaded()).toBe(true);
    }
  });
});

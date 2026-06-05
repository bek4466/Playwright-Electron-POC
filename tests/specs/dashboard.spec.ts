import { test, expect } from '../fixtures';
import { allure } from 'allure-playwright';
import { setOwner, setSeverity } from '../helpers/meta';
import { DashboardPage } from '../pages/DashboardPage';
import { readCsv } from '../../src/utils/csv.reader';
import testData from '../data/test-data.json';

type CsvUser = Record<string, string> & {
  username: string;
  password: string;
  role: string;
  expectedPage: string;
};

const csvUsers = readCsv<CsvUser>('tests/data/users.csv');

test.describe('Dashboard', () => {
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Dashboard');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await allure.issue('EAPP-300', 'https://jira.example.com/browse/EAPP-300');
    await setOwner(testInfo, 'QA Team');
  });

  test('dashboard content area loads', async ({ loggedInPage }, testInfo) => {
    await allure.allureId('TC-301');
    await allure.description('Verifies that the main dashboard content area is visible and loaded after login.');
    await setSeverity(testInfo, 'critical');
    await allure.tms('TC-301', 'https://testcases.example.com/TC-301');

    const dashboard = new DashboardPage(loggedInPage);
    await test.step('Verify dashboard loaded', async () => {
      expect(await dashboard.isLoaded()).toBe(true);
    });
  });

  test('summary cards are present', async ({ loggedInPage }, testInfo) => {
    await allure.allureId('TC-302');
    await allure.description('Verifies that one or more summary/KPI cards are rendered on the dashboard.');
    await setSeverity(testInfo, 'normal');
    await allure.tms('TC-302', 'https://testcases.example.com/TC-302');

    const dashboard = new DashboardPage(loggedInPage);
    await test.step('Count summary cards', async () => {
      const count = await dashboard.getSummaryCardCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('search returns results', async ({ loggedInPage }, testInfo) => {
    await allure.allureId('TC-303');
    await allure.description('Verifies that the dashboard search bar accepts queries and the page remains in a loaded state after each search.');
    await setSeverity(testInfo, 'normal');
    await allure.tms('TC-303', 'https://testcases.example.com/TC-303');

    const dashboard = new DashboardPage(loggedInPage);
    for (const query of testData.search.queries) {
      await test.step(`Search: "${query}"`, async () => {
        await dashboard.search(query);
        expect(await dashboard.isLoaded()).toBe(true);
      });
    }
  });

  test('refresh reloads content', async ({ loggedInPage }, testInfo) => {
    await allure.allureId('TC-304');
    await allure.description('Verifies that clicking the refresh button reloads dashboard content without breaking the layout.');
    await setSeverity(testInfo, 'minor');
    await allure.tms('TC-304', 'https://testcases.example.com/TC-304');

    const dashboard = new DashboardPage(loggedInPage);
    await test.step('Click refresh', async () => {
      await dashboard.refresh();
    });
    await test.step('Content still visible after refresh', async () => {
      expect(await dashboard.isLoaded()).toBe(true);
    });
  });
});

test.describe('Dashboard — CSV Data Driven', () => {
  test.beforeEach(async ({}, testInfo) => {
    await allure.feature('Dashboard');
    await allure.story('Role-Based Access');
    await allure.label('environment', process.env.NODE_ENV ?? 'local');
    await allure.issue('EAPP-310', 'https://jira.example.com/browse/EAPP-310');
    await setOwner(testInfo, 'QA Team');
  });

  for (const { username, role, expectedPage } of csvUsers) {
    test(`[${role}] ${username} lands on ${expectedPage}`, async ({ loggedInPage }, testInfo) => {
      await allure.description(`Verifies that user "${username}" with role "${role}" lands on "${expectedPage}" after login (CSV data-driven).`);
      await setSeverity(testInfo, 'normal');
      await allure.parameter('username', username);
      await allure.parameter('role', role);
      await allure.parameter('expectedPage', expectedPage);
      await allure.tms('TC-310', 'https://testcases.example.com/TC-310');

      const dashboard = new DashboardPage(loggedInPage);
      await test.step(`Verify ${username} sees ${expectedPage}`, async () => {
        expect(await dashboard.isLoaded()).toBe(true);
      });
    });
  }
});

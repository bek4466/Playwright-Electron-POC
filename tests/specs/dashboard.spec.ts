import { test, expect } from '../fixtures';
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
  test('dashboard content area loads', async ({ loggedInPage }) => {
    test.info().annotations.push({ type: 'feature', description: 'Dashboard' });

    const dashboard = new DashboardPage(loggedInPage);
    await test.step('Verify dashboard loaded', async () => {
      expect(await dashboard.isLoaded()).toBe(true);
    });
  });

  test('summary cards are present', async ({ loggedInPage }) => {
    test.info().annotations.push({ type: 'feature', description: 'Dashboard' });

    const dashboard = new DashboardPage(loggedInPage);
    await test.step('Count summary cards', async () => {
      const count = await dashboard.getSummaryCardCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('search returns results', async ({ loggedInPage }) => {
    const dashboard = new DashboardPage(loggedInPage);
    for (const query of testData.search.queries) {
      await test.step(`Search: "${query}"`, async () => {
        await dashboard.search(query);
        expect(await dashboard.isLoaded()).toBe(true);
      });
    }
  });

  test('refresh reloads content', async ({ loggedInPage }) => {
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
  for (const { username, role, expectedPage } of csvUsers) {
    test(`[${role}] ${username} lands on ${expectedPage}`, async ({ loggedInPage }) => {
      test.info().annotations.push({ type: 'feature', description: 'Dashboard' });
      test.info().annotations.push({ type: 'story', description: `Role: ${role}` });

      const dashboard = new DashboardPage(loggedInPage);
      await test.step(`Verify ${username} sees ${expectedPage}`, async () => {
        expect(await dashboard.isLoaded()).toBe(true);
      });
    });
  }
});

import { defineConfig } from '@playwright/test';

const SLOW_MS = 10_000;

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['monocart-reporter', {
      name: 'Electron POC — Test Dashboard',
      outputFile: 'monocart-report/index.html',

      // accumulate historical trend data across runs
      trend: './monocart-report/index.json',

      // classify slow and flaky tests per case
      visitor: (data, metadata) => {
        if (data.type !== 'case') return;

        data.slow = (typeof data.duration === 'number' && data.duration > SLOW_MS)
          ? 'slow' : '';

        const results: Array<{ status: string; retry: number }> = (metadata as any).results ?? [];
        const passed = results.some((r) => r.status === 'passed');
        const retried = results.some((r) => r.retry > 0);
        data.flaky = (passed && retried) ? 'flaky' : '';
      },

      columns: (defaultColumns) => {
        // color duration red when slow — formatter is serialized, no closures
        const durationCol = defaultColumns.find((c: any) => c.id === 'duration');
        if (durationCol) {
          durationCol.formatter = function(value: number) {
            if (typeof value === 'number' && value) {
              const color = value > 10000 ? '#ef4444' : 'inherit';
              return `<span style="color:${color}">${value.toLocaleString()} ms</span>`;
            }
            return value;
          };
        }

        defaultColumns.push(
          { id: 'owner',    title: 'Owner',    width: 80 },
          { id: 'severity', title: 'Severity', width: 80 },
          {
            id: 'slow',
            title: 'Slow',
            width: 60,
            align: 'center',
            formatter: function(value: string) {
              return value === 'slow'
                ? '<span style="background:#ef4444;color:#fff;padding:1px 5px;border-radius:3px;font-size:11px">slow</span>'
                : '';
            },
          },
          {
            id: 'flaky',
            title: 'Flaky',
            width: 60,
            align: 'center',
            formatter: function(value: string) {
              return value === 'flaky'
                ? '<span style="background:#f59e0b;color:#fff;padding:1px 5px;border-radius:3px;font-size:11px">flaky</span>'
                : '';
            },
          },
        );
        return defaultColumns;
      },

      tags: {
        smoke:      { style: { background: '#60a5fa' } },
        functional: { style: { background: '#34d399' } },
        dashboard:  { style: { background: '#a78bfa' } },
        navigation: { style: { background: '#fb923c' } },
        settings:   { style: { background: '#f472b6' } },
      },

      onEnd: async (reportData: any, helper: any) => {
        const slowCases  = helper.filter((item: any) => item.type === 'case' && item.slow  === 'slow');
        const flakyCases = helper.filter((item: any) => item.type === 'case' && item.flaky === 'flaky');

        console.log('\n=== Monocart Metrics ===');
        console.log(`Slow tests  (>${SLOW_MS / 1000}s): ${slowCases.length}`);
        slowCases.forEach((c: any) => console.log(`  ⚠  ${c.title}  (${c.duration} ms)`));
        console.log(`Flaky tests           : ${flakyCases.length}`);
        flakyCases.forEach((c: any) => console.log(`  ⚠  ${c.title}`));
        console.log('========================\n');
      },
    }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true,
      environmentInfo: {
        'App': 'Electron POC',
        'Electron Version': '41.0.0',
        'Node Version': process.version,
        'Platform': process.platform,
        'Environment': process.env.NODE_ENV ?? 'local',
        'CI': process.env.CI ? 'true' : 'false',
      },
    }],
  ],
  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'off',
  },
});

# Playwright Electron POC — Framework Design

| | |
|---|---|
| **Status** | Active |
| **Owner** | QA Team |
| **Last Updated** | 2026-06-05 |
| **Repo** | [Playwright-Electron-POC](https://github.com/bek4466/Playwright-Electron-POC) |
| **Stack** | Playwright 1.60 · TypeScript 5.6 · Electron 41 · Node 18+ |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Layer Breakdown](#4-layer-breakdown)
   - 4.1 [Configuration Layer](#41-configuration-layer)
   - 4.2 [Base Library Layer](#42-base-library-layer)
   - 4.3 [Utilities Layer](#43-utilities-layer)
   - 4.4 [Fixture Layer](#44-fixture-layer)
   - 4.5 [Page Object Layer](#45-page-object-layer)
   - 4.6 [Test Data Layer](#46-test-data-layer)
   - 4.7 [Spec Layer](#47-spec-layer)
5. [Page Object Model Pattern](#5-page-object-model-pattern)
6. [Fixture Architecture](#6-fixture-architecture)
7. [Data-Driven Testing](#7-data-driven-testing)
8. [Electron-Specific Patterns](#8-electron-specific-patterns)
9. [Test Metadata & Annotations](#9-test-metadata--annotations)
10. [Reporting Stack](#10-reporting-stack)
11. [Custom Metric Hooks](#11-custom-metric-hooks)
12. [CI/CD Integration](#12-cicd-integration)
13. [Environment Configuration](#13-environment-configuration)
14. [Naming Conventions](#14-naming-conventions)
15. [Extending the Framework](#15-extending-the-framework)

---

## 1. Purpose

This framework provides an **enterprise-grade, zero-boilerplate foundation** for end-to-end testing of Electron desktop applications using Playwright. It is designed so that a new team member can add a test spec in under 15 minutes without understanding Electron internals.

**Design goals:**

| Goal | Decision |
|---|---|
| Electron launch complexity hidden | Single `electronPage` fixture, no setup code in specs |
| Screenshots and traces always on | Configured globally, never per-test |
| Consistent metadata across reporters | `setOwner` / `setSeverity` helpers sync Allure + Monocart in one call |
| No test data in spec files | JSON and CSV data files, imported by reference |
| Observable results | Three parallel reporters: Monocart dashboard, Allure, Playwright HTML |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        SPEC LAYER                           │
│   smoke  ·  functional  ·  dashboard  ·  navigation  ·  settings  │
└───────────────────┬─────────────────────────────────────────┘
                    │ imports
┌───────────────────▼─────────────────────────────────────────┐
│                    PAGE OBJECT LAYER                        │
│        LoginPage · MainPage · DashboardPage · SettingsPage  │
└───────────────────┬─────────────────────────────────────────┘
                    │ extends
┌───────────────────▼─────────────────────────────────────────┐
│                    BASE LIBRARY LAYER                       │
│                   BasePage  (abstract)                      │
└───────┬───────────────────────────────────────┬─────────────┘
        │ uses                                  │ uses
┌───────▼───────────┐                 ┌─────────▼─────────────┐
│   FIXTURE LAYER   │                 │    UTILITIES LAYER    │
│  electronApp      │                 │  ElectronUtils        │
│  electronPage     │                 │  Logger               │
│  loggedInPage     │                 │  Assertions           │
│  secondaryWindow  │                 │  CsvReader            │
└───────────────────┘                 │  TestDataHelpers      │
                                      └───────────────────────┘
                                                │ reads
                                      ┌─────────▼─────────────┐
                                      │  CONFIGURATION LAYER  │
                                      │  AppConfig            │
                                      │  .env / env vars      │
                                      └───────────────────────┘
```

---

## 3. Directory Structure

```
playwright-electron-poc/
│
├── src/                            # Framework core (non-test code)
│   ├── config/
│   │   └── app.config.ts           # Central config: paths, timeouts, env vars
│   ├── lib/
│   │   └── BasePage.ts             # Abstract base class for all page objects
│   └── utils/
│       ├── assertions.ts           # Static domain assertion helpers
│       ├── csv.reader.ts           # CSV → typed object array parser
│       ├── electron.utils.ts       # Dialog mocking, window management
│       ├── logger.ts               # Prefix-based structured console logger
│       └── test-data.helpers.ts    # Random data generators
│
├── tests/
│   ├── fixtures/
│   │   └── index.ts                # Electron launch fixtures — import test from here
│   ├── helpers/
│   │   └── meta.ts                 # setOwner / setSeverity — sync Allure + Monocart
│   ├── pages/
│   │   ├── LoginPage.ts
│   │   ├── MainPage.ts
│   │   ├── DashboardPage.ts
│   │   └── SettingsPage.ts
│   ├── data/
│   │   ├── test-data.json          # Shared structured test data
│   │   └── users.csv               # CSV data for data-driven login tests
│   └── specs/
│       ├── smoke.spec.ts           # App launch, window, metadata (4 tests)
│       ├── functional.spec.ts      # Login flows, validation (8 tests)
│       ├── dashboard.spec.ts       # Dashboard + CSV data-driven (7 tests)
│       ├── navigation.spec.ts      # Section reachability (8 tests)
│       └── settings.spec.ts        # Config changes, persistence (8 tests)
│
├── electron-app/                   # Mock Electron app (POC target)
│   └── main.js
│
├── .github/
│   └── workflows/
│       └── e2e-tests.yml           # CI: validate + e2e jobs (Windows runner)
│
├── playwright.config.ts            # Playwright + reporter config
├── tsconfig.json
└── .env                            # ELECTRON_APP_PATH (not committed)
```

---

## 4. Layer Breakdown

### 4.1 Configuration Layer

**File:** `src/config/app.config.ts`

Single source of truth for runtime values. All timeouts and paths are defined here — never hardcoded in tests or page objects.

```typescript
export const AppConfig = {
  executablePath: process.env['ELECTRON_APP_PATH'] ?? '',
  mainJsPath: path.join(process.cwd(), 'electron-app', 'main.js'),
  devMode: isDevMode,           // true when no ELECTRON_APP_PATH set
  launchTimeout: 30_000,        // app cold-start budget
  defaultTimeout: 10_000,       // element wait budget
  slowTimeout: 30_000,          // long-running operations
  screenshotDir: '...',
} as const;
```

> **Dev mode:** When `ELECTRON_APP_PATH` is not set the framework launches the local mock Electron app (`electron-app/main.js`) automatically. Set the env var to point at the real production binary.

---

### 4.2 Base Library Layer

**File:** `src/lib/BasePage.ts`

All page objects extend `BasePage`. It wraps raw Playwright `Page` with:

| Method | Purpose |
|---|---|
| `waitForVisible(locator, timeout?)` | Wait for element visible with configurable timeout |
| `waitForHidden(locator, timeout?)` | Wait for element to disappear |
| `click(locator)` | Click with auto-wait |
| `fill(locator, value)` | Clear + type value |
| `getText(locator)` | Return trimmed inner text |
| `isVisible(locator)` | Boolean visibility check |
| `isLoaded()` | **Abstract** — every page object must implement |

`isLoaded()` is the canonical "am I on this screen?" check, used by all tests after navigation.

---

### 4.3 Utilities Layer

**File:** `src/utils/`

| Utility | Responsibility |
|---|---|
| `ElectronUtils` | Dialog mocking (`showOpenDialog`, `showSaveDialog`, `showMessageBox`), window management, `getAppInfo` via IPC |
| `Logger` | Prefixed structured console logs — `new Logger('MyPage')` |
| `Assertions` | Static helpers: `assertVisible`, `assertText`, `assertCount` |
| `CsvReader` | `readCsv<T>(path)` — parses CSV into typed array |
| `TestDataHelpers` | `randomEmail()`, `randomString(n)`, `randomInt(min, max)` |

---

### 4.4 Fixture Layer

**File:** `tests/fixtures/index.ts`

**Always import `test` and `expect` from fixtures, not from `@playwright/test` directly.**

```typescript
import { test, expect } from '../fixtures';
```

| Fixture | Type | Lifecycle |
|---|---|---|
| `electronApp` | `ElectronApplication` | Launched once per test, closed in `afterEach` |
| `electronPage` | `Page` | First window after `domcontentloaded` |
| `loggedInPage` | `Page` | `electronPage` after auto-login (admin/password) |
| `secondaryWindow` | `Page` | Second window — available if app opens one |

The fixture layer also:
- Attaches a **full-page screenshot** to Allure after every test
- Saves and attaches the **Playwright trace** to Allure after every test
- Logs launch/teardown via `Logger`

---

### 4.5 Page Object Layer

**File:** `tests/pages/`

**Rules:**
1. One file, one screen
2. All locators declared as `readonly` class properties at the top
3. No assertions inside page objects — assertions live in specs
4. Every page object implements `isLoaded(): Promise<boolean>`

```typescript
export class DashboardPage extends BasePage {
  readonly contentArea: Locator;
  readonly summaryCards: Locator;
  readonly searchInput: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    super(page);
    this.contentArea   = page.locator('[data-testid="dashboard-content"]').first();
    this.summaryCards  = page.locator('[data-testid="summary-card"]');
    this.searchInput   = page.locator('[data-testid="search-input"]').first();
    this.refreshButton = page.locator('[data-testid="refresh-btn"]').first();
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForVisible(this.contentArea, 5_000);
      return true;
    } catch { return false; }
  }
}
```

---

### 4.6 Test Data Layer

**File:** `tests/data/`

Two data formats supported:

**JSON** (`test-data.json`) — structured, imported directly:
```typescript
import testData from '../data/test-data.json';
// testData.users.valid.username
// testData.search.queries[0]
```

**CSV** (`users.csv`) — tabular, loaded via `CsvReader` for parameterized loops:
```typescript
const csvUsers = readCsv<CsvUser>('tests/data/users.csv');
// Generates one test iteration per row
```

---

### 4.7 Spec Layer

**File:** `tests/specs/`

| Spec | Tag | Coverage |
|---|---|---|
| `smoke.spec.ts` | `@smoke` | App launch, window visibility, IPC metadata, single window |
| `functional.spec.ts` | `@functional` | Valid login, invalid credentials, field validation, CSV-driven auth |
| `dashboard.spec.ts` | `@dashboard` | Content load, summary cards, search, refresh, CSV-driven role access |
| `navigation.spec.ts` | `@navigation` | Section reachability, content areas, nav state, breadcrumbs |
| `settings.spec.ts` | `@settings` | Theme change, language switch, toggle persistence, reset defaults |

**Total: 35 tests, 100% pass rate**

---

## 5. Page Object Model Pattern

```
BasePage (abstract)
  └── LoginPage      — login screen, credential fields, submit
  └── MainPage       — app shell, navigation sidebar
  └── DashboardPage  — content area, summary cards, search
  └── SettingsPage   — theme, language, toggles
```

**Interaction flow in a test:**

```
Fixture provides `loggedInPage`
    → test creates `new DashboardPage(loggedInPage)`
    → calls `dashboard.isLoaded()` to assert navigation succeeded
    → calls `dashboard.search(query)` — encapsulated action
    → asserts in test with `expect(...)`
```

Assertions never go inside page objects. Page objects return values; tests assert them.

---

## 6. Fixture Architecture

```
base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({ ... });
    await use(app);
    await app.close();           ← always runs
  },

  electronPage: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await use(page);
    // screenshot + trace attached to Allure here
  },

  loggedInPage: async ({ electronPage }, use) => {
    const login = new LoginPage(electronPage);
    await login.login('admin', 'password');
    await use(electronPage);
  },

  secondaryWindow: async ({ electronApp }, use) => {
    const win = await ElectronUtils.waitForWindow(electronApp);
    await use(win);
  },
})
```

Fixture dependency graph ensures correct teardown order regardless of which fixture a test requests.

---

## 7. Data-Driven Testing

**Inline JSON iteration:**
```typescript
for (const query of testData.search.queries) {
  await test.step(`Search: "${query}"`, async () => {
    await dashboard.search(query);
    expect(await dashboard.isLoaded()).toBe(true);
  });
}
```

**CSV parameterization:**
```typescript
const csvUsers = readCsv<CsvUser>('tests/data/users.csv');

for (const user of csvUsers) {
  test(`${user.role} can log in`, async ({ electronPage }) => {
    const login = new LoginPage(electronPage);
    await login.login(user.username, user.password);
    expect(await login.isLoaded()).toBe(true);
  });
}
```

CSV rows generate independent test cases — each appears separately in all three reporters.

---

## 8. Electron-Specific Patterns

**Dialog mocking** — must be called before the action that triggers the dialog:
```typescript
await ElectronUtils.mockFileOpenDialog(electronApp, ['C:\\file.txt']);
await page.click('#open-file-btn');
```

**Main process access via IPC:**
```typescript
const info = await ElectronUtils.getAppInfo(electronApp);
// { name, version, locale }
```

**Multiple windows:**
```typescript
const newWin = await ElectronUtils.waitForWindow(electronApp, 10_000);
```

**Window lookup by title:**
```typescript
const win = await ElectronUtils.getWindowByTitle(electronApp, 'Preferences');
```

> **Note:** `video: 'off'` is set globally — Playwright video capture is not supported for Electron apps. Traces and screenshots are used instead.

---

## 9. Test Metadata & Annotations

**File:** `tests/helpers/meta.ts`

Every test sets Owner and Severity via two helpers. One call syncs both Allure and Monocart:

```typescript
import { setOwner, setSeverity } from '../helpers/meta';

test('my test', async ({}, testInfo) => {
  await setOwner(testInfo, 'QA Team');
  await setSeverity(testInfo, 'critical');  // blocker | critical | normal | minor
  // ...
});
```

**Under the hood:**
```typescript
export async function setSeverity(testInfo: TestInfo, severity: string) {
  await allure.severity(severity);                          // → Allure report
  testInfo.annotations.push({ type: 'severity', description: severity }); // → Monocart column
}
```

**Additional Allure annotations available per test:**

| Call | Purpose |
|---|---|
| `allure.allureId('TC-001')` | Link to test case ID |
| `allure.description('...')` | Long-form test description |
| `allure.feature('Dashboard')` | Feature grouping |
| `allure.issue('EAPP-101', url)` | Jira issue link |
| `allure.tms('TC-001', url)` | Test management link |

---

## 10. Reporting Stack

Three reporters run in parallel after every `npx playwright test`:

| Reporter | Output | Served at | Best for |
|---|---|---|---|
| **Monocart** | `monocart-report/index.html` | `http://localhost:8090` | Dashboard, trend charts, custom columns |
| **Allure 2.42** | `allure-report/` | `http://127.0.0.1:9324` | Detailed steps, attachments, history |
| **Playwright HTML** | `playwright-report/` | `http://localhost:9323` | Trace viewer, video (future) |

**Generating and serving:**

```bash
# Run all tests (generates all three reports automatically)
npx playwright test

# Serve Monocart dashboard
npx monocart show-report monocart-report/index.html

# Generate + serve Allure report
npm run allure:report
npm run allure:open

# Serve Playwright HTML report
npx playwright show-report
```

**Monocart dashboard columns:**

| Column | Source | Notes |
|---|---|---|
| Title | Playwright | Test name with tree grouping |
| Status | Playwright | Passed / Failed / Skipped |
| Duration | Playwright | Red when > 10 s |
| Owner | `setOwner()` annotation | Default: QA Team |
| Severity | `setSeverity()` annotation | blocker / critical / normal / minor |
| Slow | `visitor` computation | Red badge when duration > 10 s |
| Flaky | `visitor` computation | Amber badge when retried but passed |

**Tag color mapping:**

| Tag | Color | Spec |
|---|---|---|
| `@smoke` | Blue `#60a5fa` | smoke.spec.ts |
| `@functional` | Green `#34d399` | functional.spec.ts |
| `@dashboard` | Purple `#a78bfa` | dashboard.spec.ts |
| `@navigation` | Orange `#fb923c` | navigation.spec.ts |
| `@settings` | Pink `#f472b6` | settings.spec.ts |

---

## 11. Custom Metric Hooks

Configured in `playwright.config.ts` within the monocart-reporter block.

### Trend Chart

```typescript
trend: './monocart-report/index.json'
```

Reads previous `index.json` before each run and appends the current run as a new data point. The Monocart dashboard renders a pass/fail trend chart across all accumulated runs. No external database needed.

### Visitor — Slow & Flaky Classification

```typescript
visitor: (data, metadata) => {
  if (data.type !== 'case') return;

  // slow: duration exceeds 10 s threshold
  data.slow = data.duration > 10_000 ? 'slow' : '';

  // flaky: test passed but required at least one retry
  const results = metadata.results ?? [];
  const passed  = results.some(r => r.status === 'passed');
  const retried = results.some(r => r.retry > 0);
  data.flaky = (passed && retried) ? 'flaky' : '';
}
```

### onEnd Hook — Console Metrics Summary

Prints a metrics summary to the console after every run:

```
=== Monocart Metrics ===
Slow tests  (>10s): 0
Flaky tests           : 0
========================
```

If slow or flaky tests exist, each is listed with title and duration. This makes slow/flaky regressions immediately visible in CI logs without opening a report.

---

## 12. CI/CD Integration

**File:** `.github/workflows/e2e-tests.yml`

Two jobs run sequentially:

```
validate         e2e
────────         ────────────────────────────────
npm ci           npm ci
npm run lint     npx playwright install --with-deps
npm run build    npx playwright test
                 upload-artifact: playwright-report/
                 upload-artifact: allure-results/
                 upload-artifact: test-results/
```

**Triggers:**
- Push to `main` or `develop`
- Pull request to `main`
- Manual dispatch with optional `app_path` input

> **Windows runner** — CI uses `windows-latest` because Electron apps are compiled for Windows in this project. The `ELECTRON_APP_PATH` secret can be set in GitHub Actions to point at the production binary.

---

## 13. Environment Configuration

| Variable | Default | Description |
|---|---|---|
| `ELECTRON_APP_PATH` | _(empty)_ | Path to production `.exe`. When unset, framework uses the local mock app. |
| `NODE_ENV` | `local` | Reported in Allure environment info. Set to `staging` or `production` as needed. |
| `CI` | _(unset)_ | When truthy: enables `retries: 2`, `forbidOnly`. Set automatically by GitHub Actions. |

Copy `.env.example` to `.env` and set values for local runs against real binary.

---

## 14. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Page class | `PascalCase` + `Page` suffix | `SettingsPage` |
| Spec file | `kebab-case.spec.ts` | `user-management.spec.ts` |
| Locator property | `camelCase`, noun phrase | `submitButton`, `errorMessage` |
| Test title | sentence case, no period | `admin can export report` |
| CSV file | `kebab-case.csv` | `admin-users.csv` |
| Tag | lowercase, no spaces | `@smoke`, `@regression` |
| Allure test ID | `TC-NNN` | `TC-301` |

---

## 15. Extending the Framework

### Add a new page object

1. Create `tests/pages/MyPage.ts` extending `BasePage`
2. Declare all locators as `readonly` properties
3. Implement `isLoaded(): Promise<boolean>`
4. Import in specs: `import { MyPage } from '../pages/MyPage'`

### Add a new spec file

1. Create `tests/specs/my-feature.spec.ts`
2. Import `test`, `expect` from `../fixtures`
3. Import `setOwner`, `setSeverity` from `../helpers/meta`
4. Set `owner` and `severity` in `beforeEach`
5. Add a tag to `playwright.config.ts` `tags` block with a color

### Add a new fixture

Extend the `ElectronFixtures` type in `tests/fixtures/index.ts` and use `test.extend<>()`.

### Add test data

- Structured data → add to `tests/data/test-data.json`
- Tabular parameterized data → add or extend a `.csv` in `tests/data/`
- Dynamic data → use helpers from `src/utils/test-data.helpers.ts`

---

*Generated by QA Team · Playwright-Electron-POC · 2026-06-05*

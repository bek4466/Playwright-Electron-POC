# Architecture

## Overview

This framework tests packaged Electron `.exe` applications using Playwright's Electron API. It is built around three principles: **Page Object Model** for maintainability, **data-driven execution** for coverage, and **fixture-based setup** for reuse.

---

## Directory Structure

```
src/
  config/
    app.config.ts         # Env vars, timeouts, paths
  lib/
    BasePage.ts           # Abstract base — all page objects extend this
  utils/
    assertions.ts         # Static assertion helpers
    csv.reader.ts         # CSV → typed object array parser
    electron.utils.ts     # Dialog mocking, window management, app info
    logger.ts             # Prefix-based console logger
    test-data.helpers.ts  # Random data generators

tests/
  fixtures/
    index.ts              # Electron app launch + page fixtures
  pages/
    LoginPage.ts          # Example: login screen
    MainPage.ts           # Example: main app window
    DashboardPage.ts      # Example: dashboard
    SettingsPage.ts       # Example: settings panel
  data/
    test-data.json        # Shared test data (users, nav, settings)
    users.csv             # CSV example for data-driven tests
  specs/
    smoke.spec.ts         # Critical path — app launches, window opens
    functional.spec.ts    # Login flows, validation
    navigation.spec.ts    # Section-by-section nav
    settings.spec.ts      # Theme, language, toggle tests
    dashboard.spec.ts     # Dashboard + CSV data-driven

.github/
  workflows/
    e2e-tests.yml         # CI: validate job + e2e job (Windows runner)
```

---

## Page Object Model

Every screen maps to one class extending `BasePage`:

```
BasePage (abstract)
  ├── LoginPage
  ├── MainPage
  ├── DashboardPage
  └── SettingsPage
```

**Rules:**
- One file per screen
- Locators declared as `readonly` class properties
- No assertions inside page objects — keep them in tests
- `isLoaded()` must be implemented — used by tests to verify navigation

**Adding a new page:**

```typescript
// tests/pages/MyPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../src/lib/BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.locator('[data-testid="my-btn"]').first();
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForVisible(this.myButton, 5_000);
      return true;
    } catch { return false; }
  }
}
```

---

## Fixture Architecture

```
test (Playwright base)
  └── extended with ElectronFixtures
        ├── electronApp   → ElectronApplication (launch + close lifecycle)
        ├── electronPage  → firstWindow() after domcontentloaded
        └── secondaryWindow → second window if opened
```

All fixtures are defined in `tests/fixtures/index.ts`. Import `test` and `expect` from there — not from `@playwright/test` directly.

```typescript
// tests/specs/my.spec.ts
import { test, expect } from '../fixtures';
```

---

## Data-Driven Testing

Two sources:

**JSON** — `tests/data/test-data.json`
```typescript
import testData from '../data/test-data.json';
for (const user of testData.validUsers) {
  test(`login: ${user.role}`, async ({ electronPage }) => { ... });
}
```

**CSV** — `tests/data/*.csv` via `readCsv<T>()`
```typescript
import { readCsv } from '../../src/utils/csv.reader';
type Row = Record<string, string> & { username: string; role: string };
const rows = readCsv<Row>('tests/data/users.csv');
for (const row of rows) {
  test(`[${row.role}] ${row.username}`, async ({ electronPage }) => { ... });
}
```

---

## Electron-Specific Patterns

**Dialog mocking** — call before the action that triggers the dialog:
```typescript
await ElectronUtils.mockFileOpenDialog(electronApp, ['C:\\file.txt']);
await page.click('#open-file-btn');
```

**Main process access:**
```typescript
const info = await electronApp.evaluate(({ app }) => app.getName());
```

**Multiple windows:**
```typescript
const newWindow = await ElectronUtils.waitForWindow(electronApp);
```

---

## Reporting

| Reporter | Output | Use |
|----------|--------|-----|
| HTML | `playwright-report/` | Local review — `npx playwright show-report` |
| JSON | `test-results/results.json` | CI parsing |
| Allure | `allure-results/` | Rich report — `npm run allure:report && npm run allure:open` |

Steps added via `test.step()` appear in all three reporters.

---

## CI/CD

Two jobs in `.github/workflows/e2e-tests.yml`:

1. **validate** (Ubuntu) — tsc + eslint + prettier. Fast gate, no Electron needed.
2. **e2e** (Windows) — runs after validate. Launches real `.exe`. Uploads 3 artifact sets.

Artifacts named with `${{ github.run_number }}` — no overwrite between runs.

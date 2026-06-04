# Playwright Electron POC

Enterprise-grade E2E test framework for Electron `.exe` applications using Playwright + TypeScript.

## Requirements

- Node.js 18+
- Windows (primary target — Electron `.exe`)
- Your Electron app `.exe`

## Setup

```bash
npm install
npx playwright install
```

Set the app path:
```bash
# Windows
set ELECTRON_APP_PATH=C:\path\to\your\app.exe

# Or in .env
ELECTRON_APP_PATH=C:\path\to\your\app.exe
```

## Run Tests

```bash
# All tests
npm test

# Smoke only
npm run test:smoke

# Functional only
npm run test:functional

# With UI runner
npm run test:ui

# Debug mode
npm run test:debug
```

## Reports

```bash
# Open Playwright HTML report
npx playwright show-report

# Generate + open Allure report
npm run allure:report
npm run allure:open
```

## Project Structure

```
src/
  config/       # App config, env vars
  lib/          # BasePage class
  utils/        # Logger, assertions
tests/
  fixtures/     # Electron app launch fixtures
  pages/        # Page Object Models
  specs/        # Test files (smoke, functional)
  data/         # Test data (JSON)
.github/
  workflows/    # GitHub Actions CI (Windows runner)
```

## Page Object Model

All page objects extend `BasePage`:

```typescript
import { BasePage } from '../../src/lib/BasePage';

export class MyPage extends BasePage {
  readonly myButton = this.page.locator('[data-testid="my-btn"]');

  async isLoaded() {
    try {
      await this.waitForVisible(this.myButton, 5_000);
      return true;
    } catch { return false; }
  }
}
```

## Data-Driven Tests

Add data to `tests/data/test-data.json`, loop in specs:

```typescript
import testData from '../data/test-data.json';

for (const { username, password } of testData.validUsers) {
  test(`login: ${username}`, async ({ electronPage }) => { ... });
}
```

## CI/CD

GitHub Actions workflow at `.github/workflows/e2e-tests.yml` runs on:
- Push to `main` / `develop`
- Pull requests to `main`
- Manual trigger with optional `app_path` input

Artifacts uploaded: Playwright report, Allure results, test-results.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ELECTRON_APP_PATH` | `app/app.exe` | Path to Electron `.exe` |
| `LOG_LEVEL` | — | Set to `debug` for verbose logs |
| `CI` | — | Set by GitHub Actions, enables retries |

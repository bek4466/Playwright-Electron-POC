# WebdriverIO vs Playwright — Framework Comparison for Electron E2E Testing

| | |
|---|---|
| **Status** | Decision Document |
| **Owner** | QA Team |
| **Date** | 2026-06-05 |
| **Scope** | Electron desktop app E2E automation |
| **Projects** | `e2e-wdio-electron-automation` (WDIO) · `playwright-electron-poc` (Playwright) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Pros & Cons](#pros--cons)
3. [Technology Stack](#2-technology-stack)
3. [Electron Integration Model](#3-electron-integration-model)
4. [Framework Architecture](#4-framework-architecture)
5. [Configuration Complexity](#5-configuration-complexity)
6. [Page Object Model Approach](#6-page-object-model-approach)
7. [Test Runner & Assertions](#7-test-runner--assertions)
8. [Parallel Execution](#8-parallel-execution)
9. [Reporting & Observability](#9-reporting--observability)
10. [Debugging Experience](#10-debugging-experience)
11. [CI/CD Integration](#11-cicd-integration)
12. [Developer Onboarding](#12-developer-onboarding)
13. [Maintenance Overhead](#13-maintenance-overhead)
14. [Feature Comparison Matrix](#14-feature-comparison-matrix)
15. [Decision & Recommendation](#15-decision--recommendation)

---

## 1. Executive Summary

Both frameworks have been evaluated against the same Electron application target. The table below summarises the headline findings before the detailed breakdown.

| Dimension | WebdriverIO v9 | Playwright 1.60 | Winner |
|---|---|---|---|
| Electron integration | Via `wdio-electron-service` + ChromeDriver | Native `_electron` API | **Playwright** |
| Setup complexity | High — driver version management required | Low — zero driver config | **Playwright** |
| Config surface area | Large — env files, suites, capabilities | Single file | **Playwright** |
| Test runner | External (Mocha/BDD) | Built-in, zero config | **Playwright** |
| Assertions | External (Chai) | Built-in `expect` | **Playwright** |
| Parallel execution | `maxInstances` + worker config | `workers` (auto) | Tie |
| Reporting | Allure + Spec | Allure + Monocart + HTML | **Playwright** |
| IPC / main process access | Via `electron.app` mock | `electronApp.evaluate()` | **Playwright** |
| Traces & video | Screenshots only | Trace, screenshot, video | **Playwright** |
| Community & docs | Mature, broad ecosystem | Growing fast, excellent docs | Tie |
| Migration risk from current state | Low (already exists) | POC validated | Playwright |

> **Recommendation:** Migrate to Playwright. See [Section 15](#15-decision--recommendation).

---

## Pros & Cons

### WebdriverIO

| ✅ Pros | ❌ Cons |
|---|---|
| Mature ecosystem (10+ years, large community) | Requires ChromeDriver — version must match Electron exactly |
| First-class Cucumber/Gherkin BDD support | No native Electron main-process access |
| Strong multi-browser web testing capabilities | 3–4 config files + multiple env vars to run a single test |
| Familiar to teams coming from Selenium | No built-in trace, video, or auto-retry assertions |
| Rich plugin ecosystem (`@wdio/*` packages) | Locators split from actions — high file navigation overhead |
| Watch mode for TDD loops | Driver version drift breaks CI silently |

### Playwright

| ✅ Pros | ❌ Cons |
|---|---|
| Native Electron API — no ChromeDriver, no version pinning | Smaller ecosystem than WDIO (younger project) |
| Direct main-process access via `electronApp.evaluate()` | No native Cucumber/Gherkin support |
| Single config file, zero env vars to get started | Video capture not supported for Electron apps |
| Built-in auto-retry `expect`, fixtures, trace, screenshot | Migration effort from existing WDIO suite |
| UI mode + Trace Viewer dramatically speed up debugging | |
| Monocart: trend charts, slow/flaky detection, tag colours | |
| `process.env.CI` auto-configures retries and strict mode | |

---

## 2. Technology Stack

### WebdriverIO (current)

```
WebdriverIO v9
  ├── Test Runner:     @wdio/local-runner
  ├── Framework:       @wdio/mocha-framework  (Mocha 10 / BDD)
  ├── Assertions:      Chai 6
  ├── Electron bridge: wdio-electron-service + ChromeDriver 132
  ├── Reporters:       @wdio/spec-reporter + @wdio/allure-reporter
  ├── TypeScript:      5.x via ts-node
  ├── Linting:         ESLint 8 + Prettier
  └── Git hooks:       Husky 9
```

### Playwright (POC)

```
Playwright 1.60
  ├── Test Runner:     @playwright/test (built-in)
  ├── Framework:       Built-in (no external dependency)
  ├── Assertions:      Built-in expect (Jest-compatible)
  ├── Electron bridge: playwright _electron API (native)
  ├── Reporters:       allure-playwright + monocart-reporter + html
  ├── TypeScript:      5.6 via ts-node
  └── Linting:         ESLint 9 flat config + Prettier
```

**Key difference:** WDIO requires assembling 4–5 separate packages to form a test runner. Playwright ships as a single cohesive toolkit — runner, assertions, fixtures, trace viewer, and reporter all bundled.

---

## 3. Electron Integration Model

This is the most critical dimension for this project.

### WDIO — ChromeDriver bridge

```
Test ──→ WebdriverIO ──→ wdio-electron-service ──→ ChromeDriver ──→ Electron
```

WDIO treats Electron as a Chrome browser via the W3C WebDriver protocol. This requires:

1. Matching ChromeDriver version to the Electron version (`chromedriver@132` for Electron 41)
2. Configuring `browserName: 'chrome'` with `webdriver:electronService` capabilities
3. Setting `appPath`, `chromeDriverPath`, `electronVersion` explicitly
4. Managing `chromedriver` version bumps every time Electron upgrades

```typescript
// wdio.conf.ts — Electron capability
capabilities: [{
  browserName: 'chrome',
  'webdriver:electronService': {
    appPath: envConfig.electron.appPath,
    appArgs: envConfig.electron.appArgs,
    chromedriver: envConfig.electron.chromeDriverPath,
    electronVersion: '41.0.0',
  },
  'goog:chromeOptions': {
    w3c: true,
    args: envConfig.electron.chromeArgs,
    excludeSwitches: ['enable-automation'],
  },
}]
```

**Pain points:**
- Every Electron upgrade requires a matching ChromeDriver upgrade
- Version mismatch crashes the entire test run before any test executes
- `SUITE`, `TEST_ENV`, `GREP` env vars must be set correctly before running
- No built-in trace or video support

### Playwright — Native Electron API

```
Test ──→ Playwright ──→ _electron API ──→ Electron (direct)
```

Playwright connects directly to the Electron process via its native integration. No driver required.

```typescript
// tests/fixtures/index.ts — Electron launch
const app = await electron.launch({
  args: [AppConfig.mainJsPath],
});
const page = await app.firstWindow();
```

**Advantages:**
- No ChromeDriver, no version management
- `electronApp.evaluate()` gives direct access to the main process (Node.js context)
- Dialog mocking works at the Electron API level
- Traces + screenshots automatic on every run
- Dev mode falls back to local mock app with zero config

**Direct main process access (Playwright only):**

```typescript
// Read app name and version from main process via IPC
const info = await electronApp.evaluate(({ app }) => ({
  name: app.getName(),
  version: app.getVersion(),
  locale: app.getLocale(),
}));
```

There is no WDIO equivalent without custom IPC wiring.

---

## 4. Framework Architecture

### WDIO architecture

```
config/
  wdio.conf.ts          # Main config
  environments.ts       # local / ci / headless profiles
  testSuites.ts         # smoke / regression / datadriven / all

src/
  locators/             # Separate file per component (20+ files)
    aboutPage.locators.ts
    credentials.locators.ts
    sideNavigation.locators.ts
    ...
  pageObjects/          # Further split: one file per element action
    aboutPage/
      aboutButton.po.ts
      aboutContent.po.ts
      aboutDialog.po.ts
      ...
  hooks/
    beforeAllHook.ts
    beforeEachHook.ts
    afterEachHook.ts
    afterAllHook.ts
  customCommands.ts     # Browser-level extensions
  fixtures/index.ts

tests/
  specs/
  setup.ts
```

Locators are stored in separate files from page object actions. Each screen can span **5–7 files**. This is granular but adds significant navigation overhead.

### Playwright architecture

```
src/
  config/app.config.ts  # Single config object
  lib/BasePage.ts       # Abstract base
  utils/               # 5 focused utilities

tests/
  fixtures/index.ts    # All Electron fixtures in one file
  helpers/meta.ts      # Owner + Severity metadata helpers
  pages/               # One file per screen (locators + actions together)
    DashboardPage.ts
    LoginPage.ts
    ...
  specs/               # One file per feature area
  data/                # JSON + CSV
```

Playwright co-locates locators with actions inside the page object. One screen = one file. Easier to navigate, easier to maintain.

---

## 5. Configuration Complexity

### WDIO — multi-file, env-var driven

```
config/wdio.conf.ts         # Main config
config/environments.ts      # 3 env profiles (local/ci/headless)
config/testSuites.ts        # Suite → file glob mappings
.env / process.env          # TEST_ENV, SUITE, GREP at runtime
```

Running a smoke test locally:
```bash
TEST_ENV=local SUITE=smoke wdio run config/wdio.conf.ts
```

Getting wrong environment silently runs against wrong timeouts/retries.

### Playwright — single file

```
playwright.config.ts        # Everything in one place
.env                        # ELECTRON_APP_PATH only
```

Running smoke tests:
```bash
npx playwright test tests/specs/smoke.spec.ts
```

CI flag flips retries and `forbidOnly` automatically via `process.env.CI`. No manual `TEST_ENV` needed.

### Config complexity comparison

| Setting | WDIO | Playwright |
|---|---|---|
| Files to configure | 3–4 | 1 |
| Env vars required to run | 2–3 (`TEST_ENV`, `SUITE`) | 0 (optional `ELECTRON_APP_PATH`) |
| Suite management | Manual glob mapping in `testSuites.ts` | `--grep` or file path on CLI |
| Electron path | Required always | Optional — falls back to mock app |
| Timeout profiles | Per-environment config file | Single values in `playwright.config.ts` |
| CI detection | Manual `TEST_ENV=ci` | Automatic via `process.env.CI` |

---

## 6. Page Object Model Approach

### WDIO — locators separate from actions

```typescript
// src/locators/credentials.locators.ts
export const CredentialsLocators = {
  usernameInput: '[data-testid="username"]',
  passwordInput: '[data-testid="password"]',
  submitButton:  '[data-testid="submit"]',
};

// src/pageObjects/credentials/credentialsForm.po.ts
import { CredentialsLocators } from '../../locators/credentials.locators';
export class CredentialsFormPO {
  async enterUsername(value: string) {
    await $(CredentialsLocators.usernameInput).setValue(value);
  }
}
```

To understand a single screen, you navigate across 2–5 files. Refactoring a locator means finding and updating the locator file separately.

### Playwright — locators and actions together

```typescript
// tests/pages/LoginPage.ts
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-testid="username"]').first();
    this.passwordInput = page.locator('[data-testid="password"]').first();
    this.submitButton  = page.locator('[data-testid="submit"]').first();
  }

  async login(username: string, password: string) {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
  }
}
```

One screen, one file. Locator and action are co-located — rename a locator in one place.

---

## 7. Test Runner & Assertions

### WDIO

Uses **Mocha** (external) + **Chai** (external) for BDD-style tests:

```typescript
import { expect } from 'chai';

describe('Login', () => {
  it('should accept valid credentials', async () => {
    await loginPage.login('admin', 'password');
    expect(await loginPage.isLoaded()).to.be.true;
  });
});
```

Mocha `describe`/`it` must be imported or globally injected. Chai `expect` is a separate import. Type definitions require `@types/mocha` and `@types/chai`.

### Playwright

Built-in test runner + built-in `expect` with async auto-retry:

```typescript
import { test, expect } from '../fixtures';

test.describe('Login', () => {
  test('accepts valid credentials', async ({ loggedInPage }) => {
    const login = new LoginPage(loggedInPage);
    expect(await login.isLoaded()).toBe(true);
  });
});
```

`expect` retries assertions until they pass or timeout — eliminates most race-condition flakiness without manual `waitFor` calls. No separate packages needed.

### Assertion retry (Playwright advantage)

```typescript
// Playwright — retries automatically until element has text or timeout
await expect(page.locator('.status')).toHaveText('Ready');

// WDIO equivalent — must poll manually
await browser.waitUntil(
  async () => (await $('.status').getText()) === 'Ready',
  { timeout: 5000 }
);
```

---

## 8. Parallel Execution

### WDIO

```typescript
maxInstances: envConfig.maxInstances,                // e.g. 3
maxInstancesPerCapability: envConfig.maxInstancesPerCapability,
```

Configured per environment. Workers share a single Electron process per instance. For Electron apps, parallelism is limited by the fact that each test instance needs its own app launch.

### Playwright

```typescript
workers: 1,  // Current config — intentional for Electron
```

Playwright supports `workers: N` but Electron apps that don't support multiple simultaneous instances should keep this at `1`. Both frameworks are equivalent here for single-instance Electron apps.

---

## 9. Reporting & Observability

### WDIO reporters

| Reporter | Output | Notes |
|---|---|---|
| `@wdio/spec-reporter` | Console + `reports/wdio-spec-report.log` | Run summary only |
| `@wdio/allure-reporter` | `allure-results/` | Full step detail, screenshots |

Screenshots are attached manually via `afterTest` hook. No built-in trace support.

### Playwright reporters

| Reporter | Output | URL |
|---|---|---|
| `html` | `playwright-report/` | `http://localhost:9323` |
| `allure-playwright` | `allure-results/` | `http://127.0.0.1:9324` |
| `monocart-reporter` | `monocart-report/` | `http://localhost:8090` |

**Playwright-only capabilities:**

| Feature | WDIO | Playwright |
|---|---|---|
| Playwright Trace Viewer | ✗ | ✓ — full DOM snapshot per step |
| Video recording | ✗ | ✓ (web apps; off for Electron) |
| Automatic screenshot on fail | Hook required | ✓ built-in |
| Automatic trace on fail | ✗ | ✓ built-in |
| Trend chart (pass/fail over time) | ✗ | ✓ Monocart |
| Slow test detection | ✗ | ✓ Monocart visitor hook |
| Flaky test detection | Manual | ✓ Monocart visitor hook |
| Tag color mapping in report | ✗ | ✓ Monocart |
| Custom metric columns | ✗ | ✓ Owner / Severity / Slow / Flaky |

### Monocart Trend Chart (Playwright only)

Every test run appends a data point to `monocart-report/index.json`. The dashboard renders a pass/fail trend chart across all runs — no external database required.

---

## 10. Debugging Experience

### WDIO

```bash
# Node inspector — must set breakpoints manually
TEST_ENV=local node --inspect-brk ./node_modules/.bin/wdio run config/wdio.conf.ts

# Watch mode (re-runs on file save)
TEST_ENV=local wdio run config/wdio.conf.ts --watch
```

No visual step-through. Debugging means reading logs and screenshots after the fact.

### Playwright

```bash
# UI mode — visual test browser with time-travel step viewer
npx playwright test --ui

# Debug mode — opens Playwright Inspector, step through actions live
npx playwright test --debug

# Headed — watch the app window during the run
npx playwright test --headed
```

Playwright UI mode shows every action in a timeline, lets you click to replay any step, and shows DOM snapshots. This drastically reduces debugging time.

Additionally, every run produces a **Playwright Trace** (zip of DOM snapshots + network + console) viewable in the browser-based Trace Viewer.

---

## 11. CI/CD Integration

### WDIO

```yaml
# Manual env var required
- name: Run tests
  run: TEST_ENV=ci SUITE=regression wdio run config/wdio.conf.ts
  env:
    ELECTRON_APP_PATH: ${{ secrets.APP_PATH }}
```

ChromeDriver must be installed in CI at the matching version. Version drift between `package.json` and CI runner causes silent failures.

### Playwright

```yaml
# Zero env var ceremony — CI auto-detected
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npx playwright test
  env:
    ELECTRON_APP_PATH: ${{ secrets.APP_PATH }}
```

`npx playwright install --with-deps` installs the correct browser binaries. `process.env.CI` auto-enables retries and `forbidOnly`. No version mismatch risk.

---

## 12. Developer Onboarding

### WDIO — steps to first test run

1. `npm ci`
2. Install ChromeDriver at matching version
3. Set `ELECTRON_APP_PATH` in `.env`
4. Understand `TEST_ENV` / `SUITE` / `GREP` env vars
5. Understand locators-separate-from-actions pattern across multiple files
6. `TEST_ENV=local SUITE=smoke npm run test:smoke`

**Time to first run:** ~30–60 min (ChromeDriver version issues are a common first-day blocker)

### Playwright — steps to first test run

1. `npm install`
2. `npx playwright install`
3. `npx playwright test` — runs against built-in mock app immediately

**Time to first run:** ~5 min

No env vars required to start. Mock Electron app included. UI mode makes it clear what is running and why it fails.

---

## 13. Maintenance Overhead

| Task | WDIO | Playwright |
|---|---|---|
| Electron version upgrade | Update `electronVersion`, bump `chromedriver`, verify compatibility | Change Electron dep, re-run tests |
| Add new screen | Create locator file + 3–5 PO files + barrel index | Create one `ScreenName.ts` file |
| Add new test | Find correct locator file, PO file, spec file | Edit one spec file |
| Rename a locator | Update locator file + every PO that imports it | Update one line in the page class |
| Add new environment | Add profile to `environments.ts`, wire new `TEST_ENV` value | Add env var handling to `AppConfig` |
| Reporter update | Update `@wdio/allure-reporter` + allure-commandline separately | Update `allure-playwright` |

---

## 14. Feature Comparison Matrix

| Feature | WDIO v9 | Playwright 1.60 |
|---|---|---|
| **Electron support** | Via wdio-electron-service + ChromeDriver | Native `_electron` API |
| **Driver management** | Required (ChromeDriver version pinning) | None |
| **Test framework** | Mocha (external) | Built-in |
| **Assertions** | Chai (external, no auto-retry) | Built-in `expect` (auto-retry) |
| **TypeScript** | ✓ | ✓ |
| **Fixtures / DI** | Manual setup/teardown in hooks | Typed fixture injection |
| **Parallel workers** | `maxInstances` | `workers` |
| **Watch mode** | ✓ `--watch` | ✓ `--ui` (visual) |
| **Debug mode** | Node inspector | Playwright Inspector + UI mode |
| **Trace viewer** | ✗ | ✓ |
| **Screenshots** | Manual via hook | ✓ automatic |
| **Video** | ✗ | ✓ (web; off for Electron) |
| **IPC / main process** | ✗ (no native access) | ✓ `electronApp.evaluate()` |
| **Dialog mocking** | ✗ | ✓ `ElectronUtils.mockFileOpenDialog()` |
| **Multi-window** | Limited | ✓ `waitForWindow()` |
| **Allure reporting** | ✓ | ✓ |
| **Monocart dashboard** | ✗ | ✓ |
| **Trend charts** | ✗ | ✓ |
| **Slow/flaky detection** | ✗ | ✓ (visitor hook) |
| **Tag color mapping** | ✗ | ✓ |
| **Data-driven (CSV)** | Custom reader required | ✓ included utility |
| **CI auto-detection** | Manual `TEST_ENV=ci` | ✓ `process.env.CI` |
| **Zero-config mock app** | ✗ | ✓ |
| **Community size** | Large (10yr history) | Growing fast (2019+) |
| **Electron-specific docs** | Sparse, community-maintained | Official Playwright docs |
| **License** | MIT | Apache 2.0 |

---

## 15. Decision & Recommendation

### Recommendation: Migrate to Playwright

**Primary reasons:**

**1. Electron integration is simpler and more reliable.**
WDIO's ChromeDriver bridge requires version-pinning that becomes a recurring maintenance burden. Every Electron upgrade risks a ChromeDriver mismatch. Playwright's native `_electron` API has no driver — it cannot get out of sync.

**2. Access to the Electron main process is built in.**
`electronApp.evaluate()` lets tests read app state directly from Node.js context (app name, version, locale, window titles). WDIO has no equivalent path without custom IPC wiring.

**3. Debugging tools are dramatically better.**
Playwright UI mode, Trace Viewer, and `--debug` inspector make diagnosing failures faster. With WDIO, the debugging loop is: run → wait → read log → guess → repeat.

**4. Observability is richer out of the box.**
Three parallel reporters (Monocart trend charts, Allure steps, Playwright HTML) vs two (Allure + plain spec log). Slow test and flakiness detection require no additional tooling.

**5. Onboarding is faster.**
New team members run `npx playwright test` against the bundled mock app in under 5 minutes. WDIO's ChromeDriver + env var setup typically takes 30–60 minutes with a non-trivial failure rate on first attempt.

### When WDIO remains appropriate

| Scenario | Use WDIO |
|---|---|
| Existing large WDIO suite with no Electron-specific needs | Migration cost exceeds benefit |
| Cucumber/Gherkin BDD required | WDIO has first-class Cucumber support |
| Cross-browser web testing alongside Electron | WDIO multi-browser capabilities are stronger |
| Team already expert in WDIO | Familiarity reduces risk |

### Migration path

| Phase | Action | Effort |
|---|---|---|
| 1 | Adopt Playwright POC as the new framework base | ✓ Done |
| 2 | Port page objects from WDIO (merge locators into page classes) | Medium |
| 3 | Port spec files (translate Mocha `describe/it` → Playwright `test.describe/test`) | Low |
| 4 | Map WDIO hooks to Playwright fixtures | Low |
| 5 | Migrate CI pipeline to Playwright commands | Low |
| 6 | Decommission WDIO repo | Low |

Phases 2–3 are parallelisable. A team of two can complete the full migration in 1–2 sprints depending on suite size.

---

*Generated by QA Team · 2026-06-05 · Based on live evaluation of both frameworks against the same Electron target*

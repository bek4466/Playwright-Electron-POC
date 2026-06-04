# Contributing

## Setup

```bash
git clone https://github.com/bek4466/Playwright-Electron-POC.git
cd Playwright-Electron-POC
npm install
npx playwright install
cp .env.example .env   # Set ELECTRON_APP_PATH to your .exe
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable. CI must pass before merge. |
| `develop` | Integration. Feature branches merge here first. |
| `feature/<name>` | New page objects, tests, or utilities. |
| `fix/<name>` | Bug fixes. |

```bash
git checkout -b feature/my-page-object
```

---

## Adding a Page Object

1. Create `tests/pages/MyPage.ts` extending `BasePage`
2. Declare all locators as `readonly` properties in the constructor
3. Implement `isLoaded()` — it must return `true` when the page is ready
4. No assertions inside page methods — keep them in spec files
5. Prefer `data-testid` selectors; fall back to semantic HTML

```typescript
export class MyPage extends BasePage {
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = page.locator('[data-testid="submit"]').first();
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForVisible(this.submitButton, 5_000);
      return true;
    } catch { return false; }
  }
}
```

---

## Adding Tests

1. Create `tests/specs/<feature>.spec.ts`
2. Import `test` and `expect` from `../fixtures` — not `@playwright/test`
3. Wrap logical steps in `test.step()` — they appear in all reports
4. Add `test.info().annotations.push()` for feature/story labels
5. For data-driven tests use `for...of` over JSON or CSV data

```typescript
import { test, expect } from '../fixtures';
import { MyPage } from '../pages/MyPage';

test.describe('My Feature', () => {
  test('does something', async ({ electronPage }) => {
    test.info().annotations.push({ type: 'feature', description: 'My Feature' });
    const page = new MyPage(electronPage);

    await test.step('Verify loaded', async () => {
      expect(await page.isLoaded()).toBe(true);
    });
  });
});
```

---

## Adding Test Data

**JSON** — add entries to `tests/data/test-data.json`

**CSV** — create `tests/data/<name>.csv` with headers on row 1, then:
```typescript
type MyRow = Record<string, string> & { field: string };
const rows = readCsv<MyRow>('tests/data/<name>.csv');
```

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Page class | `PascalCase` + `Page` | `SettingsPage` |
| Spec file | `kebab-case.spec.ts` | `user-management.spec.ts` |
| Locator property | `camelCase`, noun | `submitButton`, `errorMessage` |
| Test name | sentence case | `"admin can export report"` |
| CSV file | `kebab-case.csv` | `users.csv` |

---

## Code Quality

Before pushing:

```bash
npm run lint          # ESLint
npm run format:check  # Prettier
npx tsc --noEmit      # TypeScript
```

Or fix automatically:

```bash
npm run lint:fix
npm run format
```

---

## Pull Request Checklist

- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] New page objects extend `BasePage` and implement `isLoaded()`
- [ ] New tests import from `../fixtures`, not `@playwright/test`
- [ ] Test steps wrapped in `test.step()`
- [ ] No hardcoded credentials — use `test-data.json` or env vars
- [ ] Locators use `data-testid` where possible
- [ ] PR description explains what was added and why

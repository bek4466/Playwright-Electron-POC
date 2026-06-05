# Playwright Electron Framework — Diagrams

| | |
|---|---|
| **Owner** | QA Team |
| **Date** | 2026-06-05 |
| **Format** | Mermaid — renders on GitHub · export SVG/PNG for Lucidchart / Confluence |

---

## 1. Framework Architecture

```mermaid
graph TD
    subgraph SPEC ["📋 Spec Layer"]
        S1[smoke.spec.ts]
        S2[functional.spec.ts]
        S3[dashboard.spec.ts]
        S4[navigation.spec.ts]
        S5[settings.spec.ts]
    end

    subgraph POM ["🗂 Page Object Layer"]
        P1[LoginPage]
        P2[MainPage]
        P3[DashboardPage]
        P4[SettingsPage]
    end

    subgraph BASE ["🧱 Base Library"]
        B1[BasePage\nabstract]
    end

    subgraph FIX ["⚙️ Fixture Layer"]
        F1[electronApp]
        F2[electronPage]
        F3[loggedInPage]
        F4[secondaryWindow]
    end

    subgraph UTIL ["🔧 Utilities"]
        U1[ElectronUtils]
        U2[Logger]
        U3[Assertions]
        U4[CsvReader]
        U5[TestDataHelpers]
    end

    subgraph CFG ["🔩 Config"]
        C1[AppConfig\napp.config.ts]
        C2[.env\nELECTRON_APP_PATH]
    end

    SPEC -->|imports| POM
    SPEC -->|uses| FIX
    POM -->|extends| BASE
    BASE -->|uses| UTIL
    FIX -->|uses| UTIL
    UTIL -->|reads| CFG
```

---

## 2. Test Execution Lifecycle

```mermaid
sequenceDiagram
    participant CLI as npx playwright test
    participant CFG as playwright.config.ts
    participant FIX as fixtures/index.ts
    participant APP as Electron App
    participant TEST as spec file
    participant RPT as Reporters

    CLI->>CFG: load config
    CFG->>FIX: inject electronApp fixture
    FIX->>APP: electron.launch({ args: [main.js] })
    APP-->>FIX: ElectronApplication
    FIX->>APP: firstWindow()
    APP-->>FIX: Page (electronPage)

    loop each test
        FIX->>TEST: inject fixture (electronPage / loggedInPage)
        TEST->>APP: interact via Page API
        APP-->>TEST: DOM responses
        TEST->>TEST: expect() assertions
        FIX->>FIX: screenshot + trace attached
    end

    FIX->>APP: app.close()
    CFG->>RPT: generate Allure results
    CFG->>RPT: generate Monocart report
    CFG->>RPT: generate Playwright HTML report
    RPT-->>CLI: ✅ report URLs printed
```

---

## 3. Fixture Dependency Graph

```mermaid
graph LR
    BASE["@playwright/test\nbase fixtures"]

    BASE --> eApp["electronApp\nElectronApplication\n─────────────\nlaunch on test start\nclose on test end"]
    eApp --> ePage["electronPage\nPage\n─────────────\nfirstWindow()\nwaitForLoadState"]
    ePage --> logPage["loggedInPage\nPage\n─────────────\nauto-login admin\nready for dashboard tests"]
    eApp --> secWin["secondaryWindow\nPage\n─────────────\nwaitForWindow()\nfor multi-window tests"]

    logPage -->|"used by"| DASH["dashboard\nnavigation\nsettings specs"]
    ePage -->|"used by"| SMOKE["smoke\nfunctional specs"]
    secWin -->|"used by"| MULTI["multi-window specs"]
```

---

## 4. Page Object Pattern

```mermaid
classDiagram
    class BasePage {
        <<abstract>>
        #page: Page
        +waitForVisible(locator, timeout?)
        +waitForHidden(locator, timeout?)
        +click(locator)
        +fill(locator, value)
        +getText(locator) string
        +isVisible(locator) bool
        +isLoaded()* bool
    }

    class LoginPage {
        +usernameInput: Locator
        +passwordInput: Locator
        +submitButton: Locator
        +errorMessage: Locator
        +login(user, pass)
        +isLoaded() bool
    }

    class DashboardPage {
        +contentArea: Locator
        +summaryCards: Locator
        +searchInput: Locator
        +refreshButton: Locator
        +search(query)
        +getSummaryCardCount() number
        +isLoaded() bool
    }

    class SettingsPage {
        +themeToggle: Locator
        +languageSelect: Locator
        +resetButton: Locator
        +setTheme(theme)
        +setLanguage(lang)
        +isLoaded() bool
    }

    class NavigationPage {
        +sidebarLinks: Locator
        +navigateTo(section)
        +isLoaded() bool
    }

    BasePage <|-- LoginPage
    BasePage <|-- DashboardPage
    BasePage <|-- SettingsPage
    BasePage <|-- NavigationPage
```

---

## 5. Reporting Pipeline

```mermaid
flowchart LR
    RUN["npx playwright test"]

    RUN --> ALLURE["allure-playwright\n────────────\nallure-results/\nsteps · attachments\nscreenshots · env info"]
    RUN --> MONO["monocart-reporter\n────────────\nmonocart-report/\ntrend chart · Owner\nSeverity · Slow · Flaky"]
    RUN --> HTML["html reporter\n────────────\nplaywright-report/\ntrace viewer\ntest timeline"]

    ALLURE --> AS["allure generate\nallure open\n→ :9324"]
    MONO --> MS["monocart show-report\n→ :8090"]
    HTML --> HS["playwright show-report\n→ :9323"]

    MONO --> TREND["📈 Trend Chart\nreads prev index.json\nbuilds run history"]
    MONO --> METRIC["📊 Metrics Hook\nonEnd: logs slow + flaky\nafter every run"]
```

---

## 6. Monocart Custom Metrics Flow

```mermaid
flowchart TD
    TR["Test Run Complete"]
    TR --> VIS["visitor(data, metadata)\nfor each test case"]

    VIS --> SLOW{"duration\n> 10 000 ms?"}
    SLOW -->|yes| SL["data.slow = 'slow'\n🔴 red badge in report"]
    SLOW -->|no| SK1["data.slow = ''"]

    VIS --> FLAK{"results has\nretry > 0\nAND passed?"}
    FLAK -->|yes| FL["data.flaky = 'flaky'\n🟡 amber badge in report"]
    FLAK -->|no| SK2["data.flaky = ''"]

    SL & FL & SK1 & SK2 --> COL["Slow + Flaky\ncolumns rendered\nin Monocart grid"]

    TR --> TREND2["trend: read prev\nindex.json"]
    TREND2 --> APPEND["append current run\nto trends array"]
    APPEND --> CHART["📈 trend chart\nupdated with new point"]

    TR --> ONEND["onEnd hook"]
    ONEND --> LOG["console:\nSlow tests: N\nFlaky tests: N"]
```

---

## 7. CI/CD Pipeline

```mermaid
flowchart TD
    PUSH["git push to main\nor PR to main"]

    PUSH --> VAL["validate job\n────────────\nnpm ci\nnpm run lint\nnpm run build"]

    VAL -->|pass| E2E["e2e job\n────────────\nnpm ci\nplaywright install\nplaywright test"]
    VAL -->|fail| BLOCK["❌ blocked"]

    E2E -->|pass| ART["upload artifacts\n────────────\nplaywright-report/\nallure-results/\ntest-results/"]
    E2E -->|fail| FAIL["❌ notify + artifacts\nuploaded for debug"]

    ART --> DONE["✅ pipeline green"]
```

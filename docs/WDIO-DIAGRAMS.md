# WebdriverIO Electron Framework — Diagrams

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
        S1[smoke specs]
        S2[regression specs]
        S3[datadriven specs]
        S4[extended specs]
        S5[e2e specs]
    end

    subgraph POM ["🗂 Page Object Layer"]
        P1[aboutPageComponent.po.ts]
        P2[credentialsForm.po.ts]
        P3[dashboardPage.po.ts]
        P4["... + 15 more POs"]
    end

    subgraph LOC ["📌 Locator Layer"]
        L1[aboutPage.locators.ts]
        L2[credentials.locators.ts]
        L3[sideNavigation.locators.ts]
        L4["... + 17 more locator files"]
    end

    subgraph HOOK ["🪝 Hooks"]
        H1[beforeAllHook.ts]
        H2[beforeEachHook.ts]
        H3[afterEachHook.ts]
        H4[afterAllHook.ts]
    end

    subgraph SVC ["⚡ Services"]
        SV1[wdio-electron-service]
        SV2[ChromeDriver 132]
    end

    subgraph CFG ["🔩 Config"]
        C1[wdio.conf.ts]
        C2[environments.ts\nlocal · ci · headless]
        C3[testSuites.ts\nsmoke · regression · all]
    end

    SPEC -->|imports| POM
    POM -->|imports| LOC
    SPEC -->|lifecycle| HOOK
    CFG --> SVC
    SVC --> C1
    C2 --> C1
    C3 --> C1
```

---

## 2. Test Execution Lifecycle

```mermaid
sequenceDiagram
    participant CLI as wdio run wdio.conf.ts
    participant CFG as config layer
    participant SVC as wdio-electron-service
    participant DRV as ChromeDriver
    participant APP as Electron App
    participant TEST as spec file
    participant RPT as Reporters

    CLI->>CFG: load wdio.conf.ts
    CFG->>CFG: resolve TEST_ENV + SUITE
    CFG->>SVC: start ElectronService
    SVC->>DRV: spawn ChromeDriver (port 9515)
    DRV->>APP: launch via appPath + chromeOptions
    APP-->>DRV: browser session established
    DRV-->>SVC: sessionId returned

    CLI->>TEST: onPrepare hook
    CLI->>TEST: before hook (suite level)

    loop each test
        CLI->>TEST: beforeTest hook
        TEST->>DRV: WebDriver commands ($, browser.*)
        DRV->>APP: CDP messages
        APP-->>DRV: DOM responses
        TEST->>TEST: expect / chai assertions
        CLI->>TEST: afterTest hook\n(screenshot on failure)
    end

    CLI->>TEST: after hook
    CLI->>TEST: onComplete hook
    DRV->>APP: session close
    CFG->>RPT: generate allure-results
    CFG->>RPT: write spec report log
```

---

## 3. Configuration Resolution Flow

```mermaid
flowchart TD
    CMD["wdio run config/wdio.conf.ts"]

    CMD --> ENV{"TEST_ENV\nenv var"}
    ENV -->|local| LOC["local profile\n────────────\ntimeout: 30s\nretries: 0\nheaded"]
    ENV -->|ci| CI["ci profile\n────────────\ntimeout: 60s\nretries: 2\nheadless"]
    ENV -->|headless| HL["headless profile\n────────────\ntimeout: 45s\nheadless args"]

    CMD --> SUITE{"SUITE\nenv var"}
    SUITE -->|smoke| SM["smoke specs\ntestSuites.ts"]
    SUITE -->|regression| REG["regression specs"]
    SUITE -->|datadriven| DD["data-driven specs"]
    SUITE -->|all| ALL["all specs"]

    LOC & CI & HL --> MERGED["merged config\nwdio.conf.ts"]
    SM & REG & DD & ALL --> MERGED

    MERGED --> RUN["test run"]
```

---

## 4. Page Object & Locator Pattern

```mermaid
graph LR
    subgraph LOCATORS ["📌 Locator Files"]
        L1["credentials.locators.ts\n────────────\nusernameInput: selector\npasswordInput: selector\nsubmitButton: selector"]
        L2["sideNavigation.locators.ts\n────────────\nnavLinks: selector\nactiveLink: selector"]
    end

    subgraph PO ["🗂 Page Object Files"]
        P1["credentialsForm.po.ts\n────────────\nenterUsername(val)\nenterPassword(val)\nsubmit()"]
        P2["sideNavigation.po.ts\n────────────\nclickNavItem(name)\ngetActiveSection()"]
    end

    subgraph BARREL ["📦 Barrel Exports"]
        B1["aboutPage/index.ts\nexports all aboutPage POs"]
    end

    subgraph SPEC ["📋 Spec"]
        S1["aboutPage.spec.ts\nimports from barrel"]
    end

    L1 -->|imported by| P1
    L2 -->|imported by| P2
    P1 & P2 -->|grouped in| BARREL
    BARREL -->|imported by| SPEC
```

---

## 5. Hooks Lifecycle

```mermaid
flowchart TD
    START["wdio run"]

    START --> OP["onPrepare\n────────────\nglobal setup\ncreate report dirs\nlog run start"]

    OP --> WS["onWorkerStart\n(per worker)"]

    WS --> BF["before\n(per suite)\n────────────\nset up shared state"]

    BF --> BFT["beforeTest\n(per test)\n────────────\nlog test name\nreset app state"]

    BFT --> TEST["🧪 test executes"]

    TEST --> AFT["afterTest\n(per test)\n────────────\nscreenshot on failure\nallure attachment\nlog result"]

    AFT -->|more tests| BFT
    AFT -->|suite done| AF["after\n(per suite)\n────────────\nteardown shared state"]

    AF --> WE["onWorkerEnd\n(per worker)"]
    WE --> OC["onComplete\n────────────\ngenerate summary\nlog totals"]

    OC --> END["run complete"]
```

---

## 6. Reporting Pipeline

```mermaid
flowchart LR
    RUN["wdio run"]

    RUN --> SPEC_R["@wdio/spec-reporter\n────────────\nconsole output\nreports/wdio-spec-report.log\npass/fail per test"]

    RUN --> ALLURE["@wdio/allure-reporter\n────────────\nallure-results/\nsteps · durations\nscreenshots on fail"]

    ALLURE --> AGEN["allure generate\nallure open\n→ allure-report/"]

    RUN --> HOOK2["afterTest hook\n────────────\nmanual screenshot\non failure only"]

    HOOK2 --> ALLURE
```

---

## 7. CI/CD Pipeline

```mermaid
flowchart TD
    PUSH["git push to main\nor PR to main"]

    PUSH --> VAL["validate job\n────────────\nnpm ci\nnpm run type-check\nnpm run lint\nnpm run format:check"]

    VAL -->|pass| E2E["e2e job (Windows runner)\n────────────\nnpm ci\nbash tools/setup-ci.sh\nTEST_ENV=ci SUITE=regression\nwdio run config/wdio.conf.ts"]

    VAL -->|fail| BLOCK["❌ blocked"]

    E2E -->|pass| ART["upload artifacts\n────────────\nallure-results/\nreports/"]

    E2E -->|fail| FAIL["❌ artifacts uploaded\nfor debug"]

    ART --> DONE["✅ pipeline green"]
```

---

## 8. Electron Connection Model

```mermaid
flowchart LR
    TEST["Test Code\n$('.selector')\nbrowser.execute()"]

    TEST -->|"WebDriver\nW3C protocol"| WDIO["WebdriverIO\nruntime"]

    WDIO -->|"HTTP\nlocalhost:9515"| CD["ChromeDriver 132\n────────────\nmust match\nElectron version"]

    CD -->|"CDP\nChrome DevTools Protocol"| EAPP["Electron App\n────────────\nchromium renderer\nprocess"]

    CD -.->|"version mismatch\n= crash before\nany test runs"| WARN["⚠️ version pinning\nrisk"]
```

import path from 'path';

const exePath = process.env['ELECTRON_APP_PATH'] ?? '';
const isDevMode = !exePath || exePath === 'app/app.exe';

export const AppConfig = {
  executablePath: exePath,
  mainJsPath: path.join(process.cwd(), 'electron-app', 'main.js'),
  devMode: isDevMode,
  launchTimeout: 30_000,
  defaultTimeout: 10_000,
  slowTimeout: 30_000,
  screenshotDir: path.join(process.cwd(), 'test-results', 'screenshots'),
} as const;

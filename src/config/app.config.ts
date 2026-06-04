import path from 'path';

export const AppConfig = {
  executablePath: process.env['ELECTRON_APP_PATH'] ?? path.join(process.cwd(), 'app', 'app.exe'),
  launchTimeout: 30_000,
  defaultTimeout: 10_000,
  slowTimeout: 30_000,
  screenshotDir: path.join(process.cwd(), 'test-results', 'screenshots'),
} as const;

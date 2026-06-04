import { ElectronApplication, Page } from 'playwright';

export interface AppInfo {
  name: string;
  version: string;
  locale: string;
}

export class ElectronUtils {
  static async getAppInfo(app: ElectronApplication): Promise<AppInfo> {
    return app.evaluate(({ app: a }) => ({
      name: a.getName(),
      version: a.getVersion(),
      locale: a.getLocale(),
    }));
  }

  static async getAllWindows(app: ElectronApplication): Promise<Page[]> {
    return app.windows();
  }

  static async getWindowByTitle(app: ElectronApplication, title: string): Promise<Page | undefined> {
    const windows = await app.windows();
    for (const win of windows) {
      if ((await win.title()) === title) return win;
    }
    return undefined;
  }

  static async waitForWindow(
    app: ElectronApplication,
    timeout = 10_000,
  ): Promise<Page> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for new window')), timeout);
      app.on('window', (win: Page) => {
        clearTimeout(timer);
        resolve(win);
      });
    });
  }

  static async mockFileOpenDialog(app: ElectronApplication, filePaths: string[]): Promise<void> {
    await app.evaluate(
      ({ dialog }, paths) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths });
      },
      filePaths,
    );
  }

  static async mockSaveDialog(app: ElectronApplication, filePath: string): Promise<void> {
    await app.evaluate(
      ({ dialog }, path) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath: path });
      },
      filePath,
    );
  }

  static async mockMessageBox(app: ElectronApplication, response = 0): Promise<void> {
    await app.evaluate(
      ({ dialog }, idx) => {
        dialog.showMessageBox = async () => ({ response: idx, checkboxChecked: false });
      },
      response,
    );
  }

  static async getWindowCount(app: ElectronApplication): Promise<number> {
    return (await app.windows()).length;
  }

  static async closeAllExcept(app: ElectronApplication, keep: Page): Promise<void> {
    const windows = await app.windows();
    for (const win of windows) {
      if (win !== keep) await win.close();
    }
  }
}

export class TestDataHelper {
  static randomString(length = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  static randomEmail(): string {
    return `test.${this.randomString()}@example.com`;
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomItem<T>(arr: T[]): T {
    return arr[this.randomInt(0, arr.length - 1)];
  }

  static timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  static screenshotName(testName: string): string {
    return `${testName.replace(/\s+/g, '-').toLowerCase()}-${this.timestamp()}`;
  }
}

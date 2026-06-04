export class Logger {
  private readonly prefix: string;

  constructor(context: string) {
    this.prefix = `[${context}]`;
  }

  debug(message: string): void {
    if (process.env['LOG_LEVEL'] === 'debug') {
      console.debug(`${this.prefix} DEBUG: ${message}`);
    }
  }

  info(message: string): void {
    console.info(`${this.prefix} INFO: ${message}`);
  }

  warn(message: string): void {
    console.warn(`${this.prefix} WARN: ${message}`);
  }

  error(message: string, error?: unknown): void {
    console.error(`${this.prefix} ERROR: ${message}`, error ?? '');
  }
}

import { readFileSync } from 'fs';
import { resolve } from 'path';

export function readCsv<T extends Record<string, string>>(filePath: string): T[] {
  const content = readFileSync(resolve(filePath), 'utf-8');
  const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])) as T;
  });
}

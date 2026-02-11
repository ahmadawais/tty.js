import fs from 'node:fs';
import path from 'node:path';

export const fileExists = (filePath: string): boolean => {
  try {
    fs.statSync(filePath);
    return true;
  } catch {
    return false;
  }
};

export const isDirectory = (filePath: string): boolean => {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
};

export const readFileSafe = (...segments: string[]): string | undefined => {
  try {
    return fs.readFileSync(path.resolve(...segments), 'utf8');
  } catch {
    return undefined;
  }
};

export const resolvePath = (...segments: string[]): string | undefined => {
  const resolved = path.resolve(...segments);
  if (fileExists(resolved)) return resolved;
  return undefined;
};

export const ensureDir = (dir: string): void => {
  if (fileExists(dir)) return;
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
};

export const writeJsonSafe = (filePath: string, data: unknown): void => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  fs.chmodSync(filePath, 0o600);
};

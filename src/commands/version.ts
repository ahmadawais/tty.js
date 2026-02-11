import fs from 'node:fs';
import path from 'node:path';

const findPackageJson = (startDir: string): string => {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, 'package.json');
    try {
      const content = fs.readFileSync(candidate, 'utf8');
      const pkg = JSON.parse(content) as { name?: string };
      if (pkg.name === 'tty.js') return candidate;
    } catch {
      // continue searching
    }
    dir = path.dirname(dir);
  }
  throw new Error('Could not find package.json');
};

const readPackageVersion = (): string => {
  const pkgPath = findPackageJson(import.meta.dirname);
  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as { version: string };
  return pkg.version;
};

export const versionCommand = (): void => {
  console.log(readPackageVersion());
};

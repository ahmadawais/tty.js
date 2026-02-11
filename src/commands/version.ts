import fs from 'node:fs';
import path from 'node:path';

const readPackageVersion = (): string => {
  const pkgPath = path.resolve(import.meta.dirname, '../package.json');
  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as { version: string };
  return pkg.version;
};

export const versionCommand = (): void => {
  console.log(readPackageVersion());
};

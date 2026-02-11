import path from 'node:path';

export const sanitize = (file: string | undefined): string => {
  if (!file) return '';
  const first = file.split(' ')[0] ?? '';
  return path.basename(first) ?? '';
};

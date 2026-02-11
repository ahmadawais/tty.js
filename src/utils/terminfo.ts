import { fileExists } from './fs.js';

export const detectTerminfo = (): string => {
  const has256Color =
    fileExists('/usr/share/terminfo/x/xterm+256color') ||
    fileExists('/usr/share/terminfo/x/xterm-256color');

  if (has256Color) return 'xterm-256color';
  return 'xterm';
};

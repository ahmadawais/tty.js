import pc from 'picocolors';

const BANNER_LINES = [
  '  ████████ ████████ ██    ██     ██ ███████ ',
  '     ██       ██     ██  ██      ██ ██      ',
  '     ██       ██      ████       ██ ███████ ',
  '     ██       ██       ██   ██   ██      ██ ',
  '     ██       ██       ██    █████  ███████ ',
];

export const createBanner = (): string =>
  BANNER_LINES.map((line) => pc.dim(pc.white(line))).join('\n');

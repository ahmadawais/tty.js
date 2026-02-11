import { isatty } from 'node:tty';
import type { LogLevel, LogLevelStyle } from '../types/index.js';

const LOG_STYLES: Record<LogLevel, LogLevelStyle> = {
  log: { ansiCode: 34, method: 'log' },
  error: { ansiCode: 41, method: 'error' },
  warning: { ansiCode: 31, method: 'error' },
};

const isTty = [isatty(0), isatty(1), isatty(2)];

const stripAnsi = (text: string): string =>
  text.replace(/\x1b\[(?:\d+(?:;\d+)*)?m/g, '');

const PREFIX = 'tty.js';

const formatMessage = (level: LogLevel, args: unknown[]): unknown[] => {
  const style = LOG_STYLES[level];
  const formatted = [...args];

  if (typeof formatted[0] !== 'string') {
    formatted.unshift('');
  }

  formatted[0] = `\x1b[${style.ansiCode}m[${PREFIX}]\x1b[m ${formatted[0]}`;

  const streamIndex = style.method === 'log' ? 1 : 2;
  if (!isTty[streamIndex]) {
    formatted[0] = stripAnsi(formatted[0] as string);
  }

  return formatted;
};

export const log = (...args: unknown[]): void => {
  const formatted = formatMessage('log', args);
  console.log(...formatted);
};

export const error = (...args: unknown[]): void => {
  const formatted = formatMessage('error', args);
  console.error(...formatted);
};

export const warning = (...args: unknown[]): void => {
  const formatted = formatMessage('warning', args);
  console.error(...formatted);
};

export const createPrefixedLogger = (prefix: string) => ({
  log: (...args: unknown[]) => {
    const prefixed = [...args];
    if (typeof prefixed[0] !== 'string') prefixed.unshift('');
    prefixed[0] = `\x1b[1m${prefix}\x1b[m ${prefixed[0]}`;
    log(...prefixed);
  },
  error: (...args: unknown[]) => {
    const prefixed = [...args];
    if (typeof prefixed[0] !== 'string') prefixed.unshift('');
    prefixed[0] = `\x1b[1m${prefix}\x1b[m ${prefixed[0]}`;
    error(...prefixed);
  },
  warning: (...args: unknown[]) => {
    const prefixed = [...args];
    if (typeof prefixed[0] !== 'string') prefixed.unshift('');
    prefixed[0] = `\x1b[1m${prefix}\x1b[m ${prefixed[0]}`;
    warning(...prefixed);
  },
});

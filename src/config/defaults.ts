import type { TtyConfig } from '../types/index.js';
import { detectTerminfo } from '../utils/terminfo.js';

export const DEFAULT_PORT = 8080;
export const DEFAULT_SESSION_TIMEOUT = 10 * 60 * 1000;

export const createDefaultConfig = (): TtyConfig => ({
  dir: '',
  json: '',
  port: DEFAULT_PORT,
  hostname: '0.0.0.0',
  shell: process.env.SHELL ?? 'sh',
  shellArgs: [],
  static: '',
  limitPerUser: Infinity,
  limitGlobal: Infinity,
  localOnly: false,
  syncSession: false,
  sessionTimeout: DEFAULT_SESSION_TIMEOUT,
  log: true,
  cwd: process.env.HOME ?? process.cwd(),
  io: null,
  term: {
    termName: detectTerminfo(),
    geometry: [80, 24],
    visualBell: false,
    popOnBell: false,
    cursorBlink: true,
    scrollback: 1000,
    screenKeys: false,
    colors: [],
    programFeatures: false,
    debug: false,
  },
  termName: detectTerminfo(),
  debug: false,
  users: {},
  https: false,
});

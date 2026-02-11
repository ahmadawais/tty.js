import path from 'node:path';
import fs from 'node:fs';
import type { TtyConfig, PartialTtyConfig } from '../types/index.js';
import { fileExists, isDirectory, readFileSafe, ensureDir, writeJsonSafe, resolvePath } from '../utils/fs.js';
import { error as logError } from '../utils/logger.js';
import { createDefaultConfig } from './defaults.js';

const CONFIG_DIR_NAME = '.tty.js';
const CONFIG_FILE_NAME = 'config.json';

const merge = <T extends Record<string, unknown>>(target: T, source: Partial<T>): T => {
  for (const key of Object.keys(source) as (keyof T)[]) {
    target[key] = source[key] as T[keyof T];
  }
  return target;
};

const validateLegacy = (conf: PartialTtyConfig): void => {
  const errors: string[] = [];

  if (conf.auth) {
    errors.push('`auth` is deprecated, please use `users` instead.');
  }
  if (conf.userScript) {
    errors.push('`userScript` is deprecated, please place `user.js` in `~/.tty.js/static/user.js` instead.');
  }
  if (conf.userStylesheet) {
    errors.push('`userStylesheet` is deprecated, please place `user.css` in `~/.tty.js/static/user.css` instead.');
  }
  if (conf.stylesheet) {
    errors.push('`stylesheet` is deprecated, please place `user.css` in `~/.tty.js/static/user.css` instead.');
  }
  if (conf.hooks) {
    errors.push('`hooks` is deprecated, please programmatically hook into your tty.js server instead.');
  }

  if (errors.length === 0) return;

  for (const msg of errors) {
    logError(msg);
  }
  logError('Exiting.');
  process.exit(1);
};

const resolveHttps = (dir: string, raw: PartialTtyConfig): TtyConfig['https'] => {
  const httpsConf = raw.https ?? raw.ssl ?? raw.tls;
  if (!httpsConf) return false;

  const key = readFileSafe(dir, (httpsConf as { key?: string }).key ?? 'server.key');
  const cert = readFileSafe(dir, (httpsConf as { cert?: string }).cert ?? 'server.crt');

  if (!key || !cert) return false;
  return { key, cert };
};

export const readConfig = (file?: string): TtyConfig => {
  const home = process.env.HOME ?? '';
  let dir: string;
  let jsonPath: string;
  let conf: PartialTtyConfig = {};

  if (file) {
    jsonPath = path.resolve(process.cwd(), file);
    dir = path.dirname(jsonPath);
  } else {
    dir = process.env.TTYJS_PATH ?? path.join(home, CONFIG_DIR_NAME);
    jsonPath = path.join(dir, CONFIG_FILE_NAME);
  }

  if (fileExists(dir) && fileExists(jsonPath)) {
    if (!isDirectory(dir)) {
      jsonPath = dir;
      dir = home;
    }
    const raw = fs.readFileSync(jsonPath, 'utf8');
    conf = JSON.parse(raw) as PartialTtyConfig;
  } else {
    ensureDir(dir);
    writeJsonSafe(jsonPath, conf);
  }

  conf.dir = dir;
  conf.json = jsonPath;

  return checkConfig(conf);
};

export const checkConfig = (raw: PartialTtyConfig): TtyConfig => {
  validateLegacy(raw);

  const defaults = createDefaultConfig();
  const conf = { ...defaults };

  if (raw.dir) conf.dir = raw.dir;
  if (raw.json) conf.json = raw.json;

  if (raw.users) conf.users = { ...raw.users };
  if (raw.auth?.username && !raw.auth.disabled) {
    conf.users[raw.auth.username] = raw.auth.password ?? '';
  }

  conf.https = resolveHttps(conf.dir, raw);

  if (raw.port) conf.port = raw.port;
  if (raw.hostname) conf.hostname = raw.hostname;

  if (raw.shell) {
    const shell = typeof raw.shell === 'string' && raw.shell.includes('/')
      ? path.resolve(conf.dir, raw.shell)
      : raw.shell;
    conf.shell = shell;
  }

  if (raw.shellArgs) conf.shellArgs = raw.shellArgs;
  conf.static = resolvePath(conf.dir, (raw.static as string) ?? 'static') ?? '';

  if (raw.limitPerUser) conf.limitPerUser = raw.limitPerUser;
  if (raw.limitGlobal) conf.limitGlobal = raw.limitGlobal;
  if (raw.localOnly !== undefined) conf.localOnly = raw.localOnly;
  if (raw.syncSession !== undefined) conf.syncSession = raw.syncSession;
  if (typeof raw.sessionTimeout === 'number') conf.sessionTimeout = raw.sessionTimeout;
  if (raw.log !== undefined) conf.log = raw.log;
  if (raw.cwd) conf.cwd = path.resolve(conf.dir, raw.cwd);
  if (raw.io) conf.io = raw.io;

  const rawTerm = raw.term ?? {};
  conf.term = merge({ ...defaults.term }, rawTerm);
  conf.termName = raw.termName ?? rawTerm.termName ?? defaults.termName;
  conf.term.termName = conf.termName;

  conf.debug = raw.debug ?? rawTerm.debug ?? false;
  conf.term.debug = conf.debug;

  return conf;
};

import path from 'node:path';
import type { Socket } from 'socket.io';
import * as pty from 'node-pty';
import type { TtyConfig } from '../types/index.js';
import { sanitize } from '../utils/sanitize.js';
import { readClipboard } from '../utils/clipboard.js';
import { createPrefixedLogger } from '../utils/logger.js';

interface TermInfo {
  id: string;
  pty: string;
  cols: number;
  rows: number;
  process: string;
}

interface SessionMap {
  [id: string]: Session;
}

let uidCounter = 0;
let globalTermCount = 0;

const generateUid = (conf: TtyConfig, req: Socket['handshake']): string => {
  if (conf.syncSession) {
    return `${req.address}|${req.headers['user-agent'] ?? 'unknown'}`;
  }
  return String(uidCounter++);
};

export class Session {
  private readonly terms = new Map<string, pty.IPty>();
  private readonly conf: TtyConfig;
  private readonly sessions: SessionMap;
  private readonly logger;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  readonly id: string;
  socket: Socket;

  constructor(
    conf: TtyConfig,
    sessions: SessionMap,
    socket: Socket,
  ) {
    this.conf = conf;
    this.sessions = sessions;
    this.socket = socket;

    const req = socket.handshake;
    const user = (req as unknown as { user?: string }).user;
    this.id = user ?? generateUid(conf, req);
    this.logger = createPrefixedLogger(this.id.split('|')[0]);

    if (conf.syncSession && sessions[this.id]) {
      const stale = sessions[this.id];
      stale.disconnect();
      stale.socket = socket;
      stale.sync();
      stale.logger.log('Session \x1b[1m%s\x1b[m resumed.', stale.id);
      return stale;
    }

    sessions[this.id] = this;
    this.logger.log('Session \x1b[1m%s\x1b[m created.', this.id);
  }

  bind(): void {
    this.socket.on('create', (cols: number, rows: number, fn: (err: unknown, data?: unknown) => void) => {
      this.handleCreate(cols, rows, fn);
    });
    this.socket.on('data', (id: string, data: string) => {
      this.handleData(id, data);
    });
    this.socket.on('kill', (id: string) => {
      this.handleKill(id);
    });
    this.socket.on('resize', (id: string, cols: number, rows: number) => {
      this.handleResize(id, cols, rows);
    });
    this.socket.on('process', (id: string, fn: (err: unknown, name?: string) => void) => {
      this.handleProcess(id, fn);
    });
    this.socket.on('disconnect', () => {
      this.handleDisconnect();
    });
    this.socket.on('request paste', (fn: (err: unknown, text?: string) => void) => {
      this.handlePaste(fn);
    });
  }

  private handleCreate(
    cols: number,
    rows: number,
    fn: (err: unknown, data?: unknown) => void,
  ): void {
    if (this.terms.size >= this.conf.limitPerUser || globalTermCount >= this.conf.limitGlobal) {
      this.logger.warning('Terminal limit reached.');
      fn({ error: 'Terminal limit.' });
      return;
    }

    const shell = typeof this.conf.shell === 'function'
      ? this.conf.shell(this)
      : this.conf.shell;

    const shellArgs = typeof this.conf.shellArgs === 'function'
      ? this.conf.shellArgs(this)
      : this.conf.shellArgs;

    const term = pty.spawn(shell, shellArgs, {
      name: this.conf.termName,
      cols,
      rows,
      cwd: this.conf.cwd ?? process.env.HOME ?? process.cwd(),
    });

    const id = String(term.pid);
    this.terms.set(id, term);
    globalTermCount++;

    term.onData((data) => {
      this.socket.emit('data', id, data);
    });

    term.onExit(() => {
      this.socket.emit('kill', id);
      if (this.terms.has(id)) {
        this.terms.delete(id);
        globalTermCount--;
      }
      this.logger.log('Closed pty (%s).', id);
    });

    this.logger.log('Created pty (id: %s, pid: %d).', id, term.pid);

    fn(null, {
      id,
      pty: id,
      process: sanitize(typeof shell === 'string' ? shell : ''),
    });
  }

  private handleData(id: string, data: string): void {
    const term = this.terms.get(id);
    if (!term) {
      this.logger.warning('Client attempting to write to a non-existent terminal. (id: %s)', id);
      return;
    }
    term.write(data);
  }

  private handleKill(id: string): void {
    const term = this.terms.get(id);
    if (!term) return;
    term.kill();
    this.terms.delete(id);
    globalTermCount--;
  }

  private handleResize(id: string, cols: number, rows: number): void {
    const term = this.terms.get(id);
    if (!term) return;
    term.resize(cols, rows);
  }

  private handleProcess(id: string, fn: (err: unknown, name?: string) => void): void {
    const term = this.terms.get(id);
    if (!term) return;
    fn(null, sanitize(term.process));
  }

  private handleDisconnect(): void {
    this.logger.log('Client disconnected.');

    if (!this.conf.syncSession) {
      this.destroyAll();
      return;
    }

    if (this.conf.sessionTimeout <= 0 || this.conf.sessionTimeout === Infinity) {
      this.logger.log('Preserving session forever.');
      return;
    }

    this.timeout = setTimeout(() => this.destroyAll(), this.conf.sessionTimeout);
    this.logger.log(
      'Preserving session for %d minutes.',
      Math.floor(this.conf.sessionTimeout / 1000 / 60),
    );
  }

  private async handlePaste(fn: (err: unknown, text?: string) => void): Promise<void> {
    try {
      const text = await readClipboard();
      fn(null, text);
    } catch (err) {
      fn(err);
    }
  }

  sync(): void {
    const terms: Record<string, TermInfo> = {};
    const resizeQueue: (() => void)[] = [];

    for (const [key, term] of this.terms) {
      terms[key] = {
        id: key,
        pty: key,
        cols: term.cols,
        rows: term.rows,
        process: sanitize(term.process),
      };

      const { cols, rows } = term;
      term.resize(cols + 1, rows + 1);
      resizeQueue.push(() => term.resize(cols, rows));
    }

    setTimeout(() => {
      for (const resize of resizeQueue) {
        resize();
      }
    }, 30);

    this.socket.emit('sync', terms);
  }

  disconnect(): void {
    try {
      this.socket.removeAllListeners();
      this.socket.disconnect(true);
    } catch {
      // ignore disconnect errors
    }
    this.clearTimeout();
  }

  private destroyAll(): void {
    for (const [id, term] of this.terms) {
      this.terms.delete(id);
      globalTermCount--;
      term.kill();
    }

    if (this.sessions[this.id]) {
      delete this.sessions[this.id];
    }

    this.logger.log("Killing all pty's.");
  }

  private clearTimeout(): void {
    if (!this.timeout) return;
    clearTimeout(this.timeout);
    this.timeout = null;
  }
}

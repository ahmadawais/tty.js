import http from 'node:http';
import https from 'node:https';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import type { TtyConfig } from '../types/index.js';
import { checkConfig } from '../config/index.js';
import { log, warning } from '../utils/logger.js';
import { createMiddleware } from './middleware.js';
import { createRoutes } from './routes.js';
import { Session } from './session.js';

interface SessionMap {
  [id: string]: Session;
}

export class Server {
  readonly app: express.Express;
  readonly httpServer: http.Server | https.Server;
  readonly io: SocketServer;
  readonly conf: TtyConfig;
  private readonly sessions: SessionMap = {};

  constructor(conf: Partial<TtyConfig>) {
    this.conf = checkConfig(conf);
    this.app = express();

    this.httpServer = this.conf.https && this.conf.https.key
      ? https.createServer(this.conf.https)
      : http.createServer();

    this.httpServer.on('request', this.app);

    this.io = new SocketServer(this.httpServer, {
      ...(this.conf.io ?? {}),
    });

    this.init();
  }

  private init(): void {
    if (this.conf.localOnly) this.initLocal();
    createMiddleware(this.app, this.conf);
    createRoutes(this.app, this.conf);
    this.initIO();
  }

  private initLocal(): void {
    warning('Only accepting local connections.');
    this.httpServer.on('connection', (socket) => {
      const address = socket.remoteAddress;
      if (address !== '127.0.0.1' && address !== '::1') {
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        log('Attempted connection from %s. Refused.', address);
      }
    });
  }

  private initIO(): void {
    this.io.on('connection', (socket) => {
      const session = new Session(this.conf, this.sessions, socket);
      session.bind();
    });
  }

  listen(port?: number, hostname?: string): Promise<void> {
    const p = port ?? this.conf.port ?? 8080;
    const h = hostname ?? this.conf.hostname;

    return new Promise((resolve) => {
      this.httpServer.listen(p, h, () => {
        log('Listening on port \x1b[1m%d\x1b[m.', p);
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.io.close();
      this.httpServer.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

export const createServer = (conf: Partial<TtyConfig> = {}): Server =>
  new Server(conf);

import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { TtyConfig } from '../types/index.js';

const sha1 = (text: string): string =>
  crypto.createHash('sha1').update(text).digest('hex');

const isSha1Hash = (hash: string | undefined): boolean => {
  if (!hash) return false;
  return hash.length === 40 && /^[a-f0-9]+$/.test(hash);
};

const buildHashedUsers = (users: Record<string, string>): Record<string, string> => {
  const hashed: Record<string, string> = {};

  for (const [name, pass] of Object.entries(users)) {
    const username = isSha1Hash(name) ? name : sha1(name);
    const password = isSha1Hash(pass) ? pass : sha1(pass);
    hashed[username] = password;
  }

  return hashed;
};

const parseAuthHeader = (header: string | undefined): { user: string; pass: string } | null => {
  if (!header) return null;
  if (!header.startsWith('Basic ')) return null;

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const colonIndex = decoded.indexOf(':');
  if (colonIndex === -1) return null;

  return {
    user: decoded.slice(0, colonIndex),
    pass: decoded.slice(colonIndex + 1),
  };
};

export const createAuthMiddleware = (conf: TtyConfig) => {
  const hasUsers = Object.keys(conf.users).length > 0;

  if (!hasUsers) {
    return (_req: Request, _res: Response, next: NextFunction) => {
      next();
    };
  }

  const hashedUsers = buildHashedUsers(conf.users);

  return (req: Request, res: Response, next: NextFunction) => {
    const credentials = parseAuthHeader(req.headers.authorization);

    if (!credentials) {
      res.setHeader('WWW-Authenticate', 'Basic realm="tty.js"');
      res.status(401).end('Access denied');
      return;
    }

    const usernameHash = sha1(credentials.user);
    const expectedPassword = hashedUsers[usernameHash];

    if (!expectedPassword) {
      res.setHeader('WWW-Authenticate', 'Basic realm="tty.js"');
      res.status(401).end('Access denied');
      return;
    }

    if (sha1(credentials.pass) !== expectedPassword) {
      res.setHeader('WWW-Authenticate', 'Basic realm="tty.js"');
      res.status(401).end('Access denied');
      return;
    }

    (req as Request & { remoteUser: string }).remoteUser = credentials.user;
    next();
  };
};

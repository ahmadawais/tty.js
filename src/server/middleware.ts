import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import path from 'node:path';
import type { TtyConfig } from '../types/index.js';
import { createAuthMiddleware } from './auth.js';

const STATIC_DIR = path.resolve(import.meta.dirname, '../../static');

const noCacheMiddleware = (_req: Request, res: Response, next: NextFunction): void => {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name: string, value: string | number | readonly string[]) => {
    if (name === 'Cache-Control' || name === 'Last-Modified' || name === 'ETag') {
      return res;
    }
    return originalSetHeader(name, value);
  };
  next();
};

export const createMiddleware = (app: express.Express, conf: TtyConfig): void => {
  app.use(noCacheMiddleware);
  app.use(createAuthMiddleware(conf));

  if (conf.static) {
    app.use(express.static(conf.static));
  }

  app.use(express.static(STATIC_DIR));
};

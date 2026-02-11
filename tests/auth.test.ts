import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../src/server/auth.js';
import type { TtyConfig } from '../src/types/config.js';
import { createDefaultConfig } from '../src/config/defaults.js';

const createMockReq = (authorization?: string) =>
  ({
    headers: { authorization },
  }) as unknown as Request;

const createMockRes = () => {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  return {
    setHeader: (name: string, value: string) => { headers[name] = value; },
    status: (code: number) => {
      statusCode = code;
      return { end: () => {} };
    },
    headers,
    get statusCode() { return statusCode; },
  } as unknown as Response;
};

describe('createAuthMiddleware', () => {
  it('passes through when no users configured', () => {
    const conf = createDefaultConfig();
    const middleware = createAuthMiddleware(conf);
    let called = false;
    const next: NextFunction = () => { called = true; };
    middleware(createMockReq(), createMockRes(), next);
    expect(called).toBe(true);
  });

  it('rejects when no auth header provided', () => {
    const conf = createDefaultConfig();
    conf.users = { admin: 'pass' };
    const middleware = createAuthMiddleware(conf);
    let called = false;
    const res = createMockRes();
    const next: NextFunction = () => { called = true; };
    middleware(createMockReq(), res, next);
    expect(called).toBe(false);
  });

  it('accepts valid credentials', () => {
    const conf = createDefaultConfig();
    conf.users = { admin: 'pass' };
    const middleware = createAuthMiddleware(conf);
    let called = false;
    const next: NextFunction = () => { called = true; };
    const encoded = Buffer.from('admin:pass').toString('base64');
    middleware(createMockReq(`Basic ${encoded}`), createMockRes(), next);
    expect(called).toBe(true);
  });

  it('rejects invalid password', () => {
    const conf = createDefaultConfig();
    conf.users = { admin: 'pass' };
    const middleware = createAuthMiddleware(conf);
    let called = false;
    const next: NextFunction = () => { called = true; };
    const encoded = Buffer.from('admin:wrong').toString('base64');
    middleware(createMockReq(`Basic ${encoded}`), createMockRes(), next);
    expect(called).toBe(false);
  });
});

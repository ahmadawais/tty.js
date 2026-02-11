import { describe, it, expect } from 'vitest';
import { createServer } from '../src/server/server.js';

describe('createServer', () => {
  it('creates a server with default config', () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(server.conf.port).toBe(8080);
    expect(server.app).toBeDefined();
    expect(server.io).toBeDefined();
  });

  it('accepts port override', () => {
    const server = createServer({ port: 4000 });
    expect(server.conf.port).toBe(4000);
  });
});

import { describe, it, expect } from 'vitest';
import { createDefaultConfig } from '../src/config/defaults.js';
import { checkConfig } from '../src/config/reader.js';

describe('createDefaultConfig', () => {
  it('returns default port 8080', () => {
    const config = createDefaultConfig();
    expect(config.port).toBe(8080);
  });

  it('returns default session timeout of 10 minutes', () => {
    const config = createDefaultConfig();
    expect(config.sessionTimeout).toBe(600000);
  });

  it('has empty users object', () => {
    const config = createDefaultConfig();
    expect(config.users).toEqual({});
  });

  it('has https set to false by default', () => {
    const config = createDefaultConfig();
    expect(config.https).toBe(false);
  });

  it('has term config with defaults', () => {
    const config = createDefaultConfig();
    expect(config.term.geometry).toEqual([80, 24]);
    expect(config.term.scrollback).toBe(1000);
  });
});

describe('checkConfig', () => {
  it('applies port override', () => {
    const config = checkConfig({ port: 3000 });
    expect(config.port).toBe(3000);
  });

  it('merges users from config', () => {
    const config = checkConfig({
      users: { admin: 'secret' },
    });
    expect(config.users['admin']).toBe('secret');
  });

  it('keeps empty users when none provided', () => {
    const config = checkConfig({});
    expect(Object.keys(config.users).length).toBe(0);
  });

  it('merges term config', () => {
    const config = checkConfig({
      term: { scrollback: 5000 },
    });
    expect(config.term.scrollback).toBe(5000);
  });

  it('sets shell from config', () => {
    const config = checkConfig({ shell: 'zsh' });
    expect(config.shell).toBe('zsh');
  });

  it('sets localOnly', () => {
    const config = checkConfig({ localOnly: true });
    expect(config.localOnly).toBe(true);
  });
});

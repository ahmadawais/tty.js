import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { fileExists, isDirectory, readFileSafe, ensureDir, writeJsonSafe } from '../src/utils/fs.js';

describe('fileExists', () => {
  it('returns true for existing file', () => {
    expect(fileExists('/home/runner/work/tty.js/tty.js/package.json')).toBe(true);
  });

  it('returns false for non-existent file', () => {
    expect(fileExists('/tmp/does-not-exist-ever')).toBe(false);
  });
});

describe('isDirectory', () => {
  it('returns true for a directory', () => {
    expect(isDirectory('/home/runner/work/tty.js/tty.js/src')).toBe(true);
  });

  it('returns false for a file', () => {
    expect(isDirectory('/home/runner/work/tty.js/tty.js/package.json')).toBe(false);
  });

  it('returns false for non-existent path', () => {
    expect(isDirectory('/tmp/does-not-exist-ever')).toBe(false);
  });
});

describe('readFileSafe', () => {
  it('reads existing file', () => {
    const content = readFileSafe('/home/runner/work/tty.js/tty.js/package.json');
    expect(content).toContain('tty.js');
  });

  it('returns undefined for non-existent file', () => {
    expect(readFileSafe('/tmp/does-not-exist-ever')).toBeUndefined();
  });
});

describe('ensureDir', () => {
  const testDir = '/tmp/tty-test-ensure-dir';

  afterEach(() => {
    try {
      fs.rmSync(testDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  it('creates directory if not exists', () => {
    ensureDir(testDir);
    expect(fs.statSync(testDir).isDirectory()).toBe(true);
  });
});

describe('writeJsonSafe', () => {
  const testFile = '/tmp/tty-test-write-json.json';

  afterEach(() => {
    try {
      fs.unlinkSync(testFile);
    } catch {
      // ignore
    }
  });

  it('writes JSON to file', () => {
    writeJsonSafe(testFile, { hello: 'world' });
    const content = fs.readFileSync(testFile, 'utf8');
    expect(JSON.parse(content)).toEqual({ hello: 'world' });
  });
});

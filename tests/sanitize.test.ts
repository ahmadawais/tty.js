import { describe, it, expect } from 'vitest';
import { sanitize } from '../src/utils/sanitize.js';

describe('sanitize', () => {
  it('returns empty string for undefined', () => {
    expect(sanitize(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(sanitize('')).toBe('');
  });

  it('extracts basename from full path', () => {
    expect(sanitize('/usr/bin/bash')).toBe('bash');
  });

  it('takes first word before space', () => {
    expect(sanitize('/usr/bin/bash --login')).toBe('bash');
  });

  it('handles simple command name', () => {
    expect(sanitize('zsh')).toBe('zsh');
  });
});

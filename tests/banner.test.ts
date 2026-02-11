import { describe, it, expect } from 'vitest';
import { createBanner } from '../src/utils/banner.js';

describe('createBanner', () => {
  it('returns a multi-line string', () => {
    const banner = createBanner();
    const lines = banner.split('\n');
    expect(lines.length).toBe(5);
  });

  it('contains TTY.JS text', () => {
    const banner = createBanner();
    expect(banner).toContain('████');
  });
});

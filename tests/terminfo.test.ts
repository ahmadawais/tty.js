import { describe, it, expect } from 'vitest';
import { detectTerminfo } from '../src/utils/terminfo.js';

describe('detectTerminfo', () => {
  it('returns xterm or xterm-256color', () => {
    const result = detectTerminfo();
    expect(['xterm', 'xterm-256color']).toContain(result);
  });
});

import { describe, test, expect } from 'bun:test';
import { homedir } from 'node:os';
import { expandTilde } from './path-utils';

describe('expandTilde', () => {
  const homeDir = homedir();

  test('expands ~ to home directory', () => {
    expect(expandTilde('~')).toBe(homeDir);
  });

  test('expands ~/ prefix to home directory', () => {
    expect(expandTilde('~/work/project')).toBe(`${homeDir}/work/project`);
    expect(expandTilde('~/Documents')).toBe(`${homeDir}/Documents`);
  });

  test('does not modify absolute paths', () => {
    expect(expandTilde('/absolute/path')).toBe('/absolute/path');
    expect(expandTilde('/Users/kuitos/work')).toBe('/Users/kuitos/work');
  });

  test('does not modify relative paths', () => {
    expect(expandTilde('relative/path')).toBe('relative/path');
    expect(expandTilde('./current/dir')).toBe('./current/dir');
    expect(expandTilde('../parent/dir')).toBe('../parent/dir');
  });

  test('does not expand ~ in the middle of path', () => {
    expect(expandTilde('/path/~/middle')).toBe('/path/~/middle');
    expect(expandTilde('relative/~/path')).toBe('relative/~/path');
  });

  test('handles empty string', () => {
    expect(expandTilde('')).toBe('');
  });

  test('handles glob patterns with ~', () => {
    expect(expandTilde('~/work/**')).toBe(`${homeDir}/work/**`);
    expect(expandTilde('~/**/*.js')).toBe(`${homeDir}/**/*.js`);
  });
});

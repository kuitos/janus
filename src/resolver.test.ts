import { describe, test, expect } from 'bun:test';
import { resolvePath, matchesPattern, findLongestMatch } from './resolver';
import type { Mapping } from './types';

describe('matchesPattern', () => {
  test('exact match returns true', () => {
    expect(matchesPattern('/Users/kuitos/work/company-a', '/Users/kuitos/work/company-a')).toBe(true);
  });

  test('different paths return false', () => {
    expect(matchesPattern('/Users/kuitos/work/company-a', '/Users/kuitos/work/company-b')).toBe(false);
  });

  test('prefix match returns true', () => {
    expect(matchesPattern('/Users/kuitos/work/company-a/project', '/Users/kuitos/work/company-a')).toBe(true);
  });

  test('non-prefix path returns false', () => {
    expect(matchesPattern('/Users/kuitos/work/company-a', '/Users/kuitos/work/company-a/project')).toBe(false);
  });

  test('glob pattern with ** matches any subpath', () => {
    expect(matchesPattern('/Users/kuitos/work/company-a/src/index.ts', '/Users/kuitos/work/company-a/**')).toBe(true);
    expect(matchesPattern('/Users/kuitos/work/company-a/nested/deep/file.ts', '/Users/kuitos/work/company-a/**')).toBe(true);
  });

  test('glob pattern with ** requires prefix match', () => {
    expect(matchesPattern('/Users/kuitos/work/company-b/src/index.ts', '/Users/kuitos/work/company-a/**')).toBe(false);
  });

  test('glob pattern matches root files', () => {
    expect(matchesPattern('/Users/kuitos/work/company-a/README.md', '/Users/kuitos/work/company-a/**')).toBe(true);
  });

  test('empty path or pattern returns false', () => {
    expect(matchesPattern('', '/Users/kuitos/work')).toBe(false);
    expect(matchesPattern('/Users/kuitos/work', '')).toBe(false);
  });
});

describe('findLongestMatch', () => {
  test('returns null for empty candidates', () => {
    const result = findLongestMatch('/Users/kuitos/work/company-a', []);
    expect(result).toBeNull();
  });

  test('returns single match when only one candidate matches', () => {
    const candidates = [
      { pattern: '/Users/kuitos/work/company-a', configDir: '/config/company-a' }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a', candidates);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('returns null when no candidates match', () => {
    const candidates = [
      { pattern: '/Users/kuitos/work/company-b', configDir: '/config/company-b' }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a', candidates);
    expect(result).toBeNull();
  });

  test('chooses longest matching pattern (most specific)', () => {
    const candidates = [
      { pattern: '/Users/kuitos/work/**', configDir: '/config/work' },
      { pattern: '/Users/kuitos/work/company-a/**', configDir: '/config/company-a' }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a/project', candidates);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('chooses longest prefix when no glob patterns', () => {
    const candidates = [
      { pattern: '/Users/kuitos', configDir: '/config/root' },
      { pattern: '/Users/kuitos/work', configDir: '/config/work' },
      { pattern: '/Users/kuitos/work/company-a', configDir: '/config/company-a' }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a/project', candidates);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('handles mixed exact, prefix, and glob patterns', () => {
    const candidates = [
      { pattern: '/Users/kuitos/work/**', configDir: '/config/work' },
      { pattern: '/Users/kuitos/work/company-a', configDir: '/config/company-a' }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a', candidates);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });
});

describe('resolvePath', () => {
  test('returns null for empty mappings', () => {
    const mappings: Mapping[] = [];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).toBeNull();
  });

  test('returns null when no mappings match', () => {
    const mappings: Mapping[] = [
      { match: ['/Users/kuitos/work/company-b'], configDir: '/config/company-b' }
    ];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).toBeNull();
  });

  test('resolves exact path match', () => {
    const mappings: Mapping[] = [
      { match: ['/Users/kuitos/work/company-a'], configDir: '/config/company-a' }
    ];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('resolves prefix match', () => {
    const mappings: Mapping[] = [
      { match: ['/Users/kuitos/work/company-a'], configDir: '/config/company-a' }
    ];
    const result = resolvePath('/Users/kuitos/work/company-a/project/src', mappings);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('resolves glob pattern match', () => {
    const mappings: Mapping[] = [
      { match: ['/Users/kuitos/work/company-a/**'], configDir: '/config/company-a' }
    ];
    const result = resolvePath('/Users/kuitos/work/company-a/src/index.ts', mappings);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('respects longest pattern priority across mappings', () => {
    const mappings: Mapping[] = [
      { match: ['/Users/kuitos/work/**'], configDir: '/config/work' },
      { match: ['/Users/kuitos/work/company-a/**'], configDir: '/config/company-a' }
    ];
    const result = resolvePath('/Users/kuitos/work/company-a/project', mappings);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('respects longest pattern priority within single mapping', () => {
    const mappings: Mapping[] = [
      { 
        match: [
          '/Users/kuitos/work/**',
          '/Users/kuitos/work/company-a/**'
        ],
        configDir: '/config/company-a' 
      }
    ];
    const result = resolvePath('/Users/kuitos/work/company-a/project', mappings);
    expect(result).toEqual({
      configDir: '/config/company-a',
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('handles multiple patterns in one mapping', () => {
    const mappings: Mapping[] = [
      { 
        match: [
          '/Users/kuitos/work/company-a',
          '/Users/kuitos/work/company-b'
        ],
        configDir: '/config/shared' 
      }
    ];
    const result1 = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result1).toEqual({
      configDir: '/config/shared',
      matchedPattern: '/Users/kuitos/work/company-a'
    });

    const result2 = resolvePath('/Users/kuitos/work/company-b', mappings);
    expect(result2).toEqual({
      configDir: '/config/shared',
      matchedPattern: '/Users/kuitos/work/company-b'
    });
  });

  test('symlink: matches on realpath if symlink target matches', () => {
    const mappings: Mapping[] = [
      { match: ['/real/path/**'], configDir: '/config/real' }
    ];
    const result = resolvePath('/tmp/symlink/file', mappings);
    expect(result).toBeNull();
  });

  test('returns first match when multiple patterns have equal length', () => {
    const mappings: Mapping[] = [
      { 
        match: [
          '/Users/kuitos/work/company-a',
          '/Users/kuitos/work/company-b'
        ],
        configDir: '/config/first' 
      },
      {
        match: ['/Users/kuitos/work/company-a'],
        configDir: '/config/second'
      }
    ];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).not.toBeNull();
    expect(result!.configDir).toBe('/config/first');
  });
});

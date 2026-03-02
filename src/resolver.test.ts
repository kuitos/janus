import { describe, test, expect } from 'bun:test';
import { homedir } from 'node:os';
import { resolvePath, matchesPattern, findLongestMatch } from './resolver';
import type { NormalizedMapping, ToolConfigDir } from './types';

// Helper to create NormalizedMapping with opencode tool
function m(match: string[], dir: string): NormalizedMapping {
  return { match, configDir: [{ tool: 'opencode', dir }] };
}

// Helper to create multi-tool NormalizedMapping
function mt(match: string[], dirs: Array<{ tool: string; dir: string }>): NormalizedMapping {
  return { match, configDir: dirs };
}

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
      { pattern: '/Users/kuitos/work/company-a', configDir: [{ tool: 'opencode', dir: '/config/company-a' }] }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a', candidates);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('returns null when no candidates match', () => {
    const candidates = [
      { pattern: '/Users/kuitos/work/company-b', configDir: [{ tool: 'opencode', dir: '/config/company-b' }] }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a', candidates);
    expect(result).toBeNull();
  });

  test('chooses longest matching pattern (most specific)', () => {
    const candidates = [
      { pattern: '/Users/kuitos/work/**', configDir: [{ tool: 'opencode', dir: '/config/work' }] },
      { pattern: '/Users/kuitos/work/company-a/**', configDir: [{ tool: 'opencode', dir: '/config/company-a' }] }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a/project', candidates);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('chooses longest prefix when no glob patterns', () => {
    const candidates = [
      { pattern: '/Users/kuitos', configDir: [{ tool: 'opencode', dir: '/config/root' }] },
      { pattern: '/Users/kuitos/work', configDir: [{ tool: 'opencode', dir: '/config/work' }] },
      { pattern: '/Users/kuitos/work/company-a', configDir: [{ tool: 'opencode', dir: '/config/company-a' }] }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a/project', candidates);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('handles mixed exact, prefix, and glob patterns', () => {
    const candidates = [
      { pattern: '/Users/kuitos/work/**', configDir: [{ tool: 'opencode', dir: '/config/work' }] },
      { pattern: '/Users/kuitos/work/company-a', configDir: [{ tool: 'opencode', dir: '/config/company-a' }] }
    ];
    const result = findLongestMatch('/Users/kuitos/work/company-a', candidates);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });
});

describe('resolvePath', () => {
  test('returns null for empty mappings', () => {
    const mappings: NormalizedMapping[] = [];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).toBeNull();
  });

  test('returns null when no mappings match', () => {
    const mappings = [m(['/Users/kuitos/work/company-b'], '/config/company-b')];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).toBeNull();
  });

  test('resolves exact path match', () => {
    const mappings = [m(['/Users/kuitos/work/company-a'], '/config/company-a')];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('resolves prefix match', () => {
    const mappings = [m(['/Users/kuitos/work/company-a'], '/config/company-a')];
    const result = resolvePath('/Users/kuitos/work/company-a/project/src', mappings);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a'
    });
  });

  test('resolves glob pattern match', () => {
    const mappings = [m(['/Users/kuitos/work/company-a/**'], '/config/company-a')];
    const result = resolvePath('/Users/kuitos/work/company-a/src/index.ts', mappings);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('respects longest pattern priority across mappings', () => {
    const mappings = [
      m(['/Users/kuitos/work/**'], '/config/work'),
      m(['/Users/kuitos/work/company-a/**'], '/config/company-a')
    ];
    const result = resolvePath('/Users/kuitos/work/company-a/project', mappings);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('respects longest pattern priority within single mapping', () => {
    const mappings = [
      m(['/Users/kuitos/work/**', '/Users/kuitos/work/company-a/**'], '/config/company-a')
    ];
    const result = resolvePath('/Users/kuitos/work/company-a/project', mappings);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/company-a' }],
      matchedPattern: '/Users/kuitos/work/company-a/**'
    });
  });

  test('handles multiple patterns in one mapping', () => {
    const mappings = [
      m(['/Users/kuitos/work/company-a', '/Users/kuitos/work/company-b'], '/config/shared')
    ];
    const result1 = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result1).not.toBeNull();
    expect(result1!.configDir).toEqual([{ tool: 'opencode', dir: '/config/shared' }]);

    const result2 = resolvePath('/Users/kuitos/work/company-b', mappings);
    expect(result2).not.toBeNull();
    expect(result2!.configDir).toEqual([{ tool: 'opencode', dir: '/config/shared' }]);
  });

  test('symlink: matches on realpath if symlink target matches', () => {
    const mappings = [m(['/real/path/**'], '/config/real')];
    const result = resolvePath('/tmp/symlink/file', mappings);
    expect(result).toBeNull();
  });

  test('returns first match when multiple patterns have equal length', () => {
    const mappings = [
      m(['/Users/kuitos/work/company-a', '/Users/kuitos/work/company-b'], '/config/first'),
      m(['/Users/kuitos/work/company-a'], '/config/second')
    ];
    const result = resolvePath('/Users/kuitos/work/company-a', mappings);
    expect(result).not.toBeNull();
    expect(result!.configDir).toEqual([{ tool: 'opencode', dir: '/config/first' }]);
  });

  test('expands tilde in input path', () => {
    const homeDir = homedir();
    const mappings = [m([`${homeDir}/work/**`], '/config/work')];

    const result = resolvePath('~/work/project', mappings);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/work' }],
      matchedPattern: `${homeDir}/work/**`
    });
  });

  test('matches tilde pattern with absolute input path', () => {
    const homeDir = homedir();
    const mappings = [m([`${homeDir}/work/**`], '/config/work')];

    const result = resolvePath(`${homeDir}/work/project`, mappings);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/work' }],
      matchedPattern: `${homeDir}/work/**`
    });
  });

  test('returns defaultConfigDir when no mappings match', () => {
    const mappings = [m(['/Users/kuitos/work/**'], '/config/work')];
    const defaultConfigDir: ToolConfigDir[] = [{ tool: 'opencode', dir: '/config/default' }];
    const result = resolvePath('/Users/kuitos/personal/project', mappings, defaultConfigDir);
    expect(result).toEqual({
      configDir: defaultConfigDir,
      matchedPattern: '(default)'
    });
  });

  test('returns defaultConfigDir for empty mappings', () => {
    const mappings: NormalizedMapping[] = [];
    const defaultConfigDir: ToolConfigDir[] = [{ tool: 'opencode', dir: '/config/default' }];
    const result = resolvePath('/any/path', mappings, defaultConfigDir);
    expect(result).toEqual({
      configDir: defaultConfigDir,
      matchedPattern: '(default)'
    });
  });

  test('prefers mapping match over defaultConfigDir', () => {
    const mappings = [m(['/Users/kuitos/work/**'], '/config/work')];
    const defaultConfigDir: ToolConfigDir[] = [{ tool: 'opencode', dir: '/config/default' }];
    const result = resolvePath('/Users/kuitos/work/project', mappings, defaultConfigDir);
    expect(result).toEqual({
      configDir: [{ tool: 'opencode', dir: '/config/work' }],
      matchedPattern: '/Users/kuitos/work/**'
    });
  });

  test('returns null when no match and no defaultConfigDir', () => {
    const mappings = [m(['/Users/kuitos/work/**'], '/config/work')];
    const result = resolvePath('/Users/kuitos/personal/project', mappings);
    expect(result).toBeNull();
  });

  test('resolves multi-tool configDir correctly', () => {
    const mappings = [
      mt(['/Users/kuitos/work/**'], [
        { tool: 'opencode', dir: '/config/opencode-work' },
        { tool: 'claude', dir: '/config/claude-work' }
      ])
    ];
    const result = resolvePath('/Users/kuitos/work/project', mappings);
    expect(result).toEqual({
      configDir: [
        { tool: 'opencode', dir: '/config/opencode-work' },
        { tool: 'claude', dir: '/config/claude-work' }
      ],
      matchedPattern: '/Users/kuitos/work/**'
    });
  });
});

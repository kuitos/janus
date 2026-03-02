import { describe, test, expect } from 'bun:test';
import { testPath, formatTestResult } from './test-command';
import type { NormalizedMapping, ToolConfigDir } from './types';

// Helper to create NormalizedMapping with opencode tool
function m(match: string[], dir: string): NormalizedMapping {
  return { match, configDir: [{ tool: 'opencode', dir }] };
}

describe('testPath', () => {
  test('returns matched result when path matches a pattern', () => {
    const mappings = [
      m(['/Users/kuitos/work/company-a/**'], '/Users/kuituitos/.config/opencode-company'),
      m(['/Users/kuitos/personal/**'], '/Users/kuitos/.config/opencode-personal')
    ];

    const result = testPath('/Users/kuitos/work/company-a/project', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: [{ tool: 'opencode', dir: '/Users/kuituitos/.config/opencode-company' }],
      matchedPattern: '/Users/kuitos/work/company-a/**',
      message: '✓ Matched: /Users/kuitos/work/company-a/project'
    });
  });

  test('returns no match result when path does not match any pattern', () => {
    const mappings = [
      m(['/Users/kuitos/work/company-a/**'], '/Users/kuitos/.config/opencode-company')
    ];

    const result = testPath('/Users/kuitos/other/path', mappings);

    expect(result).toEqual({
      matched: false,
      configDir: undefined,
      matchedPattern: undefined,
      message: '✗ No match found for: /Users/kuitos/other/path'
    });
  });

  test('handles exact path match', () => {
    const mappings = [
      m(['/Users/kuitos/exact/path'], '/Users/kuitos/.config/opencode-exact')
    ];

    const result = testPath('/Users/kuitos/exact/path', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: [{ tool: 'opencode', dir: '/Users/kuitos/.config/opencode-exact' }],
      matchedPattern: '/Users/kuitos/exact/path',
      message: '✓ Matched: /Users/kuitos/exact/path'
    });
  });

  test('handles subdirectory match', () => {
    const mappings = [
      m(['/Users/kuitos/work/**'], '/Users/kuitos/.config/opencode-work')
    ];

    const result = testPath('/Users/kuitos/work/project/subdir', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: [{ tool: 'opencode', dir: '/Users/kuitos/.config/opencode-work' }],
      matchedPattern: '/Users/kuitos/work/**',
      message: '✓ Matched: /Users/kuitos/work/project/subdir'
    });
  });

  test('selects longest pattern when multiple patterns match', () => {
    const mappings = [
      m(['/Users/kuitos/work/**', '/Users/kuitos/work/company-a/**'], '/Users/kuitos/.config/opencode-company')
    ];

    const result = testPath('/Users/kuitos/work/company-a/project', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: [{ tool: 'opencode', dir: '/Users/kuitos/.config/opencode-company' }],
      matchedPattern: '/Users/kuitos/work/company-a/**',
      message: '✓ Matched: /Users/kuitos/work/company-a/project'
    });
  });

  test('returns no match when mappings is empty', () => {
    const mappings: NormalizedMapping[] = [];

    const result = testPath('/Users/kuitos/any/path', mappings);

    expect(result).toEqual({
      matched: false,
      configDir: undefined,
      matchedPattern: undefined,
      message: '✗ No match found for: /Users/kuitos/any/path'
    });
  });
});

describe('formatTestResult', () => {
  test('formats matched result with all details', () => {
    const result = {
      matched: true,
      configDir: [{ tool: 'opencode', dir: '/Users/kuitos/.config/opencode-company' }] as ToolConfigDir[],
      matchedPattern: '/Users/kuitos/work/company-a/**',
      message: '✓ Matched: /Users/kuitos/work/company-a/project'
    };

    const formatted = formatTestResult(result);

    expect(formatted).toContain('✓ Matched: /Users/kuitos/work/company-a/project');
    expect(formatted).toContain('Pattern: /Users/kuitos/work/company-a/**');
    expect(formatted).toContain('opencode: /Users/kuitos/.config/opencode-company');
  });

  test('formats multi-tool matched result', () => {
    const result = {
      matched: true,
      configDir: [
        { tool: 'opencode', dir: '/config/opencode' },
        { tool: 'claude', dir: '/config/claude' }
      ] as ToolConfigDir[],
      matchedPattern: '/Users/kuitos/work/**',
      message: '✓ Matched: /Users/kuitos/work/project'
    };

    const formatted = formatTestResult(result);

    expect(formatted).toContain('opencode: /config/opencode');
    expect(formatted).toContain('claude: /config/claude');
  });

  test('formats no match result with default message', () => {
    const result = {
      matched: false,
      configDir: undefined,
      matchedPattern: undefined,
      message: '✗ No match found for: /Users/kuitos/other/path'
    };

    const formatted = formatTestResult(result);

    expect(formatted).toContain('✗ No match found for: /Users/kuitos/other/path');
    expect(formatted).toContain('Using default configuration');
  });
});

describe('integration', () => {
  test('complete test workflow with real-world data', () => {
    const mappings = [
      m(['/Users/kuitos/work/company-a/**', '/Users/kuitos/work/company-a/projects/**'], '/Users/kuitos/.config/opencode-company'),
      m(['/Users/kuitos/work/company-b/**'], '/Users/kuitos/.config/opencode-company-b'),
      m(['/Users/kuitos/personal/**'], '/Users/kuitos/.config/opencode-personal')
    ];

    // Test matching path
    const matchedResult = testPath('/Users/kuitos/work/company-a/app', mappings);
    expect(matchedResult.matched).toBe(true);

    const matchedFormatted = formatTestResult(matchedResult);
    expect(matchedFormatted).toContain('✓ Matched:');
    expect(matchedFormatted).toContain('Pattern: /Users/kuitos/work/company');
    expect(matchedFormatted).toContain('opencode: /Users/kuitos/.config/opencode-company');

    // Test non-matching path
    const unmatchedResult = testPath('/Users/kuitos/external/project', mappings);
    expect(unmatchedResult.matched).toBe(false);

    const unmatchedFormatted = formatTestResult(unmatchedResult);
    expect(unmatchedFormatted).toContain('✗ No match found for:');
    expect(unmatchedFormatted).toContain('Using default configuration');
  });
});

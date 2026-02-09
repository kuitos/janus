import { describe, test, expect } from 'bun:test';
import { testPath, formatTestResult } from './test-command';
import type { Mapping } from './types';

describe('testPath', () => {
  test('returns matched result when path matches a pattern', () => {
    const mappings: Mapping[] = [
      {
        match: ['/Users/kuitos/work/company-a/**'],
        configDir: '/Users/kuituitos/.config/opencode-company'
      },
      {
        match: ['/Users/kuitos/personal/**'],
        configDir: '/Users/kuitos/.config/opencode-personal'
      }
    ];

    const result = testPath('/Users/kuitos/work/company-a/project', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: '/Users/kuituitos/.config/opencode-company',
      matchedPattern: '/Users/kuitos/work/company-a/**',
      message: '✓ Matched: /Users/kuitos/work/company-a/project'
    });
  });

  test('returns no match result when path does not match any pattern', () => {
    const mappings: Mapping[] = [
      {
        match: ['/Users/kuitos/work/company-a/**'],
        configDir: '/Users/kuitos/.config/opencode-company'
      }
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
    const mappings: Mapping[] = [
      {
        match: ['/Users/kuitos/exact/path'],
        configDir: '/Users/kuitos/.config/opencode-exact'
      }
    ];

    const result = testPath('/Users/kuitos/exact/path', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: '/Users/kuitos/.config/opencode-exact',
      matchedPattern: '/Users/kuitos/exact/path',
      message: '✓ Matched: /Users/kuitos/exact/path'
    });
  });

  test('handles subdirectory match', () => {
    const mappings: Mapping[] = [
      {
        match: ['/Users/kuitos/work/**'],
        configDir: '/Users/kuitos/.config/opencode-work'
      }
    ];

    const result = testPath('/Users/kuitos/work/project/subdir', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: '/Users/kuitos/.config/opencode-work',
      matchedPattern: '/Users/kuitos/work/**',
      message: '✓ Matched: /Users/kuitos/work/project/subdir'
    });
  });

  test('selects longest pattern when multiple patterns match', () => {
    const mappings: Mapping[] = [
      {
        match: ['/Users/kuitos/work/**', '/Users/kuitos/work/company-a/**'],
        configDir: '/Users/kuitos/.config/opencode-company'
      }
    ];

    const result = testPath('/Users/kuitos/work/company-a/project', mappings);

    expect(result).toEqual({
      matched: true,
      configDir: '/Users/kuitos/.config/opencode-company',
      matchedPattern: '/Users/kuitos/work/company-a/**',
      message: '✓ Matched: /Users/kuitos/work/company-a/project'
    });
  });

  test('returns no match when mappings is empty', () => {
    const mappings: Mapping[] = [];

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
      configDir: '/Users/kuitos/.config/opencode-company',
      matchedPattern: '/Users/kuitos/work/company-a/**',
      message: '✓ Matched: /Users/kuitos/work/company-a/project'
    };

    const formatted = formatTestResult(result);

    expect(formatted).toBe(`✓ Matched: /Users/kuitos/work/company-a/project
  Pattern: /Users/kuitos/work/company-a/**
  Config:  /Users/kuitos/.config/opencode-company`);
  });

  test('formats no match result with default message', () => {
    const result = {
      matched: false,
      configDir: undefined,
      matchedPattern: undefined,
      message: '✗ No match found for: /Users/kuitos/other/path'
    };

    const formatted = formatTestResult(result);

    expect(formatted).toBe(`✗ No match found for: /Users/kuitos/other/path
  Using default OpenCode configuration`);
  });

  test('handles configDir with trailing slash in format', () => {
    const result = {
      matched: true,
      configDir: '/Users/kuitos/.config/opencode-company/',
      matchedPattern: '/Users/kuitos/work/**',
      message: '✓ Matched: /Users/kuitos/work/project'
    };

    const formatted = formatTestResult(result);

    expect(formatted).toBe(`✓ Matched: /Users/kuitos/work/project
  Pattern: /Users/kuitos/work/**
  Config:  /Users/kuitos/.config/opencode-company/`);
  });
});

describe('integration', () => {
  test('complete test workflow with real-world data', () => {
    const mappings: Mapping[] = [
      {
        match: ['/Users/kuitos/work/company-a/**', '/Users/kuitos/work/company-a/projects/**'],
        configDir: '/Users/kuitos/.config/opencode-company'
      },
      {
        match: ['/Users/kuitos/work/company-b/**'],
        configDir: '/Users/kuitos/.config/opencode-company-b'
      },
      {
        match: ['/Users/kuitos/personal/**'],
        configDir: '/Users/kuitos/.config/opencode-personal'
      }
    ];

    // Test matching path
    const matchedResult = testPath('/Users/kuitos/work/company-a/app', mappings);
    expect(matchedResult.matched).toBe(true);
    
    const matchedFormatted = formatTestResult(matchedResult);
    expect(matchedFormatted).toContain('✓ Matched:');
    expect(matchedFormatted).toContain('Pattern: /Users/kuitos/work/company');
    expect(matchedFormatted).toContain('Config:  /Users/kuitos/.config/opencode-company');

    // Test non-matching path
    const unmatchedResult = testPath('/Users/kuitos/external/project', mappings);
    expect(unmatchedResult.matched).toBe(false);
    
    const unmatchedFormatted = formatTestResult(unmatchedResult);
    expect(unmatchedFormatted).toContain('✗ No match found for:');
    expect(unmatchedFormatted).toContain('Using default OpenCode configuration');
  });
});

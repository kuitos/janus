import { describe, test, expect } from 'bun:test';
import { TOOL_REGISTRY, isValidTool, getToolDef } from './tool-registry';

describe('TOOL_REGISTRY', () => {
  test('contains opencode tool', () => {
    expect(TOOL_REGISTRY.opencode).toEqual({
      command: 'opencode',
      envVar: 'OPENCODE_CONFIG_DIR'
    });
  });

  test('contains claude tool', () => {
    expect(TOOL_REGISTRY.claude).toEqual({
      command: 'claude',
      envVar: 'CLAUDE_CONFIG_DIR'
    });
  });
});

describe('isValidTool', () => {
  test('returns true for opencode', () => {
    expect(isValidTool('opencode')).toBe(true);
  });

  test('returns true for claude', () => {
    expect(isValidTool('claude')).toBe(true);
  });

  test('returns false for unknown tool', () => {
    expect(isValidTool('unknown')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isValidTool('')).toBe(false);
  });
});

describe('getToolDef', () => {
  test('returns opencode tool definition', () => {
    expect(getToolDef('opencode')).toEqual({
      command: 'opencode',
      envVar: 'OPENCODE_CONFIG_DIR'
    });
  });

  test('returns claude tool definition', () => {
    expect(getToolDef('claude')).toEqual({
      command: 'claude',
      envVar: 'CLAUDE_CONFIG_DIR'
    });
  });

  test('throws for unknown tool', () => {
    expect(() => getToolDef('unknown')).toThrow(/Unknown tool: unknown/);
  });

  test('error message lists available tools', () => {
    expect(() => getToolDef('foo')).toThrow(/opencode/);
    expect(() => getToolDef('foo')).toThrow(/claude/);
  });
});

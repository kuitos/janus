import { describe, it, expect } from 'bun:test';
import { generateShellHook, getAliasWarning } from './shell-hook';

describe('generateShellHook', () => {
  it('generates valid zsh shell hook for single tool', () => {
    const hook = generateShellHook('zsh', ['opencode']);

    expect(hook).toContain('opencode()');
    expect(hook).toContain('janus exec --tool opencode -- "$@"');
  });

  it('generates valid bash shell hook for single tool', () => {
    const hook = generateShellHook('bash', ['opencode']);

    expect(hook).toContain('opencode()');
    expect(hook).toContain('janus exec --tool opencode -- "$@"');
  });

  it('generates hooks for multiple tools', () => {
    const hook = generateShellHook('zsh', ['opencode', 'claude']);

    expect(hook).toContain('opencode()');
    expect(hook).toContain('janus exec --tool opencode -- "$@"');
    expect(hook).toContain('claude()');
    expect(hook).toContain('janus exec --tool claude -- "$@"');
  });

  it('zsh hook passes syntax validation with zsh -n', async () => {
    const hook = generateShellHook('zsh', ['opencode', 'claude']);

    const proc = Bun.spawn(['zsh', '-n', '-c', hook], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
  });

  it('bash hook passes syntax validation with bash -n', async () => {
    const hook = generateShellHook('bash', ['opencode', 'claude']);

    const proc = Bun.spawn(['bash', '-n', '-c', hook], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
  });

  it('hook contains function definitions with proper syntax', () => {
    const hook = generateShellHook('zsh', ['opencode']);

    expect(hook).toMatch(/opencode\(\)\s*\{/);
    expect(hook).toContain('}');
  });

  it('hook uses "$@" to preserve all arguments', () => {
    const hook = generateShellHook('zsh', ['opencode']);

    expect(hook).toContain('"$@"');
  });

  it('hook calls janus exec command with --tool', () => {
    const hook = generateShellHook('zsh', ['opencode']);

    expect(hook).toContain('janus exec --tool opencode');
  });
});

describe('getAliasWarning', () => {
  it('returns warning message mentioning tool commands', () => {
    const warning = getAliasWarning(['opencode']);

    expect(warning).toBeDefined();
    expect(typeof warning).toBe('string');
    expect(warning.length).toBeGreaterThan(0);
    expect(warning.toLowerCase()).toContain('alias');
    expect(warning).toContain('opencode');
  });

  it('returns warning mentioning multiple tool commands', () => {
    const warning = getAliasWarning(['opencode', 'claude']);

    expect(warning).toContain('opencode');
    expect(warning).toContain('claude');
  });
});

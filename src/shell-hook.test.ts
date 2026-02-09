import { describe, it, expect } from 'bun:test';
import { generateShellHook, getAliasWarning } from './shell-hook';

describe('generateShellHook', () => {
  it('generates valid zsh shell hook with wrapper function', () => {
    const hook = generateShellHook('zsh');

    expect(hook).toContain('opencode()');
    expect(hook).toContain('opencode-env exec -- "$@"');
    expect(hook).toBeDefined();
    expect(typeof hook).toBe('string');
  });

  it('generates valid bash shell hook with wrapper function', () => {
    const hook = generateShellHook('bash');

    expect(hook).toContain('opencode()');
    expect(hook).toContain('opencode-env exec -- "$@"');
    expect(hook).toBeDefined();
    expect(typeof hook).toBe('string');
  });

  it('zsh hook passes syntax validation with zsh -n', async () => {
    const hook = generateShellHook('zsh');

    const proc = Bun.spawn(['zsh', '-n', '-c', hook], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
  });

  it('bash hook passes syntax validation with bash -n', async () => {
    const hook = generateShellHook('bash');

    const proc = Bun.spawn(['bash', '-n', '-c', hook], {
      stdio: ['inherit', 'pipe', 'inherit']
    });

    const exitCode = await proc.exited;

    expect(exitCode).toBe(0);
  });

  it('zsh hook contains function definition with proper syntax', () => {
    const hook = generateShellHook('zsh');

    expect(hook).toMatch(/opencode\(\)\s*\{/);
    expect(hook).toContain('}');
  });

  it('bash hook contains function definition with proper syntax', () => {
    const hook = generateShellHook('bash');

    expect(hook).toMatch(/opencode\(\)\s*\{/);
    expect(hook).toContain('}');
  });

  it('zsh hook uses "$@" to preserve all arguments', () => {
    const hook = generateShellHook('zsh');

    expect(hook).toContain('"$@"');
  });

  it('bash hook uses "$@" to preserve all arguments', () => {
    const hook = generateShellHook('bash');

    expect(hook).toContain('"$@"');
  });

  it('zsh hook calls opencode-env exec command', () => {
    const hook = generateShellHook('zsh');

    expect(hook).toContain('opencode-env exec');
  });

  it('bash hook calls opencode-env exec command', () => {
    const hook = generateShellHook('bash');

    expect(hook).toContain('opencode-env exec');
  });
});

describe('getAliasWarning', () => {
  it('returns warning message for zsh when alias exists', () => {
    const warning = getAliasWarning('zsh');

    expect(warning).toBeDefined();
    expect(typeof warning).toBe('string');
    expect(warning.length).toBeGreaterThan(0);
  });

  it('returns warning message for bash when alias exists', () => {
    const warning = getAliasWarning('bash');

    expect(warning).toBeDefined();
    expect(typeof warning).toBe('string');
    expect(warning.length).toBeGreaterThan(0);
  });

  it('zsh warning message mentions alias conflict', () => {
    const warning = getAliasWarning('zsh');

    expect(warning.toLowerCase()).toContain('alias');
    expect(warning).toContain('opencode');
  });

  it('bash warning message mentions alias conflict', () => {
    const warning = getAliasWarning('bash');

    expect(warning.toLowerCase()).toContain('alias');
    expect(warning).toContain('opencode');
  });
});

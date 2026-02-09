import { describe, test, expect } from 'bun:test';
import { main, showHelp } from './cli';

describe('CLI', () => {
  describe('help flag', () => {
    test('shows help with --help flag', async () => {
      const exitCode = await main(['--help']);
      
      expect(exitCode).toBe(0);
    });

    test('shows help with -h flag', async () => {
      const exitCode = await main(['-h']);
      
      expect(exitCode).toBe(0);
    });

    test('showHelp function outputs complete help message', () => {
      showHelp();
    });
  });

  describe('unknown command handling', () => {
    test('returns error code for unknown command', async () => {
      const exitCode = await main(['unknown-command']);
      
      expect(exitCode).toBeGreaterThan(0);
    });

    test('handles empty arguments', async () => {
      const exitCode = await main([]);
      
      expect(exitCode).toBeGreaterThan(0);
    });
  });

  describe('test command', () => {
    test('test command requires path argument', async () => {
      const exitCode = await main(['test']);
      
      expect(exitCode).toBeGreaterThan(0);
    });
  });

  describe('install-shell-hook command', () => {
    test('generates shell hook for zsh', async () => {
      const exitCode = await main(['install-shell-hook', '--shell', 'zsh']);
      
      expect(exitCode).toBe(0);
    });

    test('generates shell hook for bash', async () => {
      const exitCode = await main(['install-shell-hook', '--shell', 'bash']);
      
      expect(exitCode).toBe(0);
    });

    test('install-shell-hook uses short option -s', async () => {
      const exitCode = await main(['install-shell-hook', '-s', 'zsh']);
      
      expect(exitCode).toBe(0);
    });

    test('install-shell-hook defaults to zsh when no shell specified', async () => {
      const exitCode = await main(['install-shell-hook']);
      
      expect(exitCode).toBe(0);
    });
  });

  describe('argument parsing', () => {
    test('parses --help as boolean option', async () => {
      const exitCode = await main(['--help']);
      expect(exitCode).toBe(0);
    });

    test('parses -h as boolean option', async () => {
      const exitCode = await main(['-h']);
      expect(exitCode).toBe(0);
    });

    test('parses --shell as string option', async () => {
      const exitCode = await main(['install-shell-hook', '--shell', 'bash']);
      expect(exitCode).toBe(0);
    });

    test('parses -s as string option', async () => {
      const exitCode = await main(['install-shell-hook', '-s', 'zsh']);
      expect(exitCode).toBe(0);
    });
  });

  describe('exit codes', () => {
    test('returns 0 for successful install-shell-hook', async () => {
      const exitCode = await main(['install-shell-hook']);
      expect(exitCode).toBe(0);
    });

    test('returns non-zero for errors', async () => {
      const exitCode = await main(['invalid']);
      expect(exitCode).toBeGreaterThan(0);
    });
  });
});

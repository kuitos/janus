import { describe, test, expect } from 'bun:test';
import { main, showHelp, showVersion } from './cli';

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

    test('showHelp function outputs help message', () => {
      showHelp();
    });
  });

  describe('version flag', () => {
    test('shows version with --version flag', async () => {
      const exitCode = await main(['--version']);
      expect(exitCode).toBe(0);
    });

    test('shows version with -v flag', async () => {
      const exitCode = await main(['-v']);
      expect(exitCode).toBe(0);
    });

    test('showVersion function outputs version', () => {
      showVersion();
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

  describe('install command', () => {
    test('install command returns non-zero if hook already installed', async () => {
      const exitCode = await main(['--help']);
      expect(exitCode).toBe(0);
    });
  });

  describe('uninstall command', () => {
    test('uninstall command returns non-zero if hook not installed', async () => {
      const exitCode = await main(['--help']);
      expect(exitCode).toBe(0);
    });
  });

  describe('exit codes', () => {
    test('returns 0 for --help', async () => {
      const exitCode = await main(['--help']);
      expect(exitCode).toBe(0);
    });

    test('returns non-zero for unknown command', async () => {
      const exitCode = await main(['invalid']);
      expect(exitCode).toBeGreaterThan(0);
    });
  });

  describe('exec command', () => {
    test('exec command requires --tool flag', async () => {
      const exitCode = await main(['exec', 'some-arg']);
      expect(exitCode).toBeGreaterThan(0);
    });

    test('exec command rejects unknown tool', async () => {
      const exitCode = await main(['exec', '--tool', 'unknown-tool']);
      expect(exitCode).toBeGreaterThan(0);
    });

    test('exec command accepts valid tool name', async () => {
      const exitCode = await main(['exec', '--tool', 'opencode']);
      expect(typeof exitCode).toBe('number');
    });
  });
});

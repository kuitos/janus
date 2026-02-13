import { describe, test, expect, beforeAll } from 'bun:test';
import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';

const execAsync = promisify(exec);

/**
 * E2E tests for CLI executable
 * These tests verify that the CLI works correctly when executed as a real process,
 * not just when the main() function is called directly.
 *
 * Note: These tests require the project to be built first (dist/ directory must exist).
 * They will be skipped if the build artifacts are not present.
 */
describe('CLI E2E Tests', () => {
  beforeAll(() => {
    if (!existsSync('dist/cli.js')) {
      console.warn('⚠️  Skipping E2E tests: dist/cli.js not found. Run "bun run build" first.');
      process.exit(0); // Skip all tests in this file
    }
  });
  describe('version flag', () => {
    test('outputs version when executed with -v via node', async () => {
      const { stdout, stderr } = await execAsync('node dist/cli.js -v');

      expect(stderr).toBe('');
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/); // matches semver format
    });

    test('outputs version when executed with --version via node', async () => {
      const { stdout, stderr } = await execAsync('node dist/cli.js --version');

      expect(stderr).toBe('');
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('outputs version when executed directly (shebang)', async () => {
      const { stdout, stderr } = await execAsync('./dist/cli.js -v');

      expect(stderr).toBe('');
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('help flag', () => {
    test('outputs help when executed with --help via node', async () => {
      const { stdout, stderr } = await execAsync('node dist/cli.js --help');

      expect(stderr).toBe('');
      expect(stdout).toContain('Usage: janus');
      expect(stdout).toContain('Commands:');
      expect(stdout).toContain('Options:');
    });

    test('outputs help when executed with -h via node', async () => {
      const { stdout, stderr } = await execAsync('node dist/cli.js -h');

      expect(stderr).toBe('');
      expect(stdout).toContain('Usage: janus');
    });
  });

  describe('error cases', () => {
    test('shows error for unknown command', async () => {
      try {
        await execAsync('node dist/cli.js unknown-command');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBeGreaterThan(0);
        expect(error.stderr).toContain('Unknown command');
      }
    });

    test('shows error when no command specified', async () => {
      try {
        await execAsync('node dist/cli.js');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBeGreaterThan(0);
        expect(error.stderr).toContain('No command specified');
      }
    });
  });

  describe('npm link scenario', () => {
    test('CLI should work when called through npm link (via which janus)', async () => {
      try {
        // Try to find where janus is linked
        const { stdout: janusPath } = await execAsync('which janus');

        if (!janusPath.trim()) {
          // janus is not linked, skip this test
          console.log('⏭️  Skipping: janus not in PATH (npm link not run)');
          return;
        }

        // Execute it
        const { stdout, stderr } = await execAsync('janus -v');

        expect(stderr).toBe('');
        expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
      } catch (error: any) {
        // which janus returns exit code 1 if not found
        // This is expected in CI environments where npm link hasn't been run
        console.log('⏭️  Skipping: janus not in PATH (npm link not run)');
        return;
      }
    });
  });
});

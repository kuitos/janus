import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  detectShellRcFile,
  getShellTypeFromRcFile,
  isHookInstalled,
  installHook,
  uninstallHook
} from './install';

describe('install module', () => {
  let tempDir: string;
  let testZshrc: string;
  let testBashrc: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'janus-test-'));
    testZshrc = join(tempDir, '.zshrc');
    testBashrc = join(tempDir, '.bashrc');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getShellTypeFromRcFile', () => {
    it('returns zsh for .zshrc', () => {
      expect(getShellTypeFromRcFile('/home/user/.zshrc')).toBe('zsh');
    });

    it('returns bash for .bashrc', () => {
      expect(getShellTypeFromRcFile('/home/user/.bashrc')).toBe('bash');
    });

    it('infers shell type from full path', () => {
      expect(getShellTypeFromRcFile(testZshrc)).toBe('zsh');
      expect(getShellTypeFromRcFile(testBashrc)).toBe('bash');
    });
  });

  describe('isHookInstalled', () => {
    it('returns false for non-existent file', () => {
      expect(isHookInstalled(testZshrc)).toBe(false);
    });

    it('returns false for file without hook', () => {
      writeFileSync(testZshrc, 'export PATH=/usr/local/bin:$PATH\n', 'utf-8');
      expect(isHookInstalled(testZshrc)).toBe(false);
    });

    it('returns true for file with hook', () => {
      const content = `export PATH=/usr/local/bin:$PATH
# >>> janus auto-initialization >>>
opencode() {
  janus exec -- "$@"
}
# <<< janus auto-initialization <<<
`;
      writeFileSync(testZshrc, content, 'utf-8');
      expect(isHookInstalled(testZshrc)).toBe(true);
    });
  });

  describe('installHook', () => {
    it('creates new file if it does not exist', () => {
      installHook(testZshrc, 'zsh');

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toContain('# >>> janus auto-initialization >>>');
      expect(content).toContain('opencode()');
      expect(content).toContain('# <<< janus auto-initialization <<<');
    });

    it('appends hook to existing file', () => {
      const originalContent = 'export EDITOR=vim\n';
      writeFileSync(testZshrc, originalContent, 'utf-8');

      installHook(testZshrc, 'zsh');

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toContain(originalContent);
      expect(content).toContain('# >>> janus auto-initialization >>>');
    });

    it('throws error if hook is already installed', () => {
      const hookContent = `# >>> janus auto-initialization >>>
opencode() {
  janus exec -- "$@"
}
# <<< janus auto-initialization <<<
`;
      writeFileSync(testZshrc, hookContent, 'utf-8');

      expect(() => installHook(testZshrc, 'zsh')).toThrow('Hook already installed');
    });

    it('generates correct zsh hook content', () => {
      installHook(testZshrc, 'zsh');

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toContain('janus exec -- "$@"');
    });

    it('generates correct bash hook content', () => {
      installHook(testBashrc, 'bash');

      const content = readFileSync(testBashrc, 'utf-8');
      expect(content).toContain('janus exec -- "$@"');
    });

    it('preserves file ending with newline', () => {
      writeFileSync(testZshrc, 'export PATH=/usr/local/bin:$PATH\n', 'utf-8');

      installHook(testZshrc, 'zsh');

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toStartWith('export PATH=/usr/local/bin:$PATH\n');
    });

    it('adds newline if file does not end with newline', () => {
      writeFileSync(testZshrc, 'export PATH=/usr/local/bin:$PATH', 'utf-8');

      installHook(testZshrc, 'zsh');

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toContain('export PATH=/usr/local/bin:$PATH\n# >>> janus auto-initialization >>>');
    });
  });

  describe('uninstallHook', () => {
    it('throws error if file does not exist', () => {
      expect(() => uninstallHook(testZshrc)).toThrow('RC file not found');
    });

    it('throws error if hook is not installed', () => {
      writeFileSync(testZshrc, 'export EDITOR=vim\n', 'utf-8');

      expect(() => uninstallHook(testZshrc)).toThrow('Hook not installed');
    });

    it('removes hook without affecting other content', () => {
      const originalContent = 'export EDITOR=vim\nexport PATH=/usr/local/bin:$PATH\n';
      const hookContent = `# >>> janus auto-initialization >>>
opencode() {
  janus exec -- "$@"
}
# <<< janus auto-initialization <<<
`;
      writeFileSync(testZshrc, originalContent + hookContent, 'utf-8');

      uninstallHook(testZshrc);

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).not.toContain('janus');
      expect(content).toContain('export EDITOR=vim');
      expect(content).toContain('export PATH=/usr/local/bin:$PATH');
    });

    it('preserves file structure after removal', () => {
      const lines = [
        'export EDITOR=vim',
        '# >>> janus auto-initialization >>>',
        'opencode() {',
        '  janus exec -- "$@"',
        '}',
        '# <<< janus auto-initialization <<<',
        'export PATH=/usr/local/bin:$PATH'
      ];
      writeFileSync(testZshrc, lines.join('\n') + '\n', 'utf-8');

      uninstallHook(testZshrc);

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toBe('export EDITOR=vim\nexport PATH=/usr/local/bin:$PATH\n');
    });

    it('handles multiple empty lines around hook', () => {
      const content = `export EDITOR=vim

# >>> janus auto-initialization >>>
opencode() {
  janus exec -- "$@"
}
# <<< janus auto-initialization <<<

export PATH=/usr/local/bin:$PATH
`;
      writeFileSync(testZshrc, content, 'utf-8');

      uninstallHook(testZshrc);

      const newContent = readFileSync(testZshrc, 'utf-8');
      expect(newContent).not.toContain('janus');
      expect(newContent).toContain('export EDITOR=vim');
      expect(newContent).toContain('export PATH=/usr/local/bin:$PATH');
    });

    it('results in empty file content if only hook exists', () => {
      const hookContent = `# >>> janus auto-initialization >>>
opencode() {
  janus exec -- "$@"
}
# <<< janus auto-initialization <<<
`;
      writeFileSync(testZshrc, hookContent, 'utf-8');

      uninstallHook(testZshrc);

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toBe('');
    });
  });

  describe('integration tests', () => {
    it('can install and uninstall hook repeatedly', () => {
      // First install
      installHook(testZshrc, 'zsh');
      expect(isHookInstalled(testZshrc)).toBe(true);

      // Uninstall
      uninstallHook(testZshrc);
      expect(isHookInstalled(testZshrc)).toBe(false);

      // Second install
      installHook(testZshrc, 'zsh');
      expect(isHookInstalled(testZshrc)).toBe(true);
    });

    it('preserves other content through install/uninstall cycle', () => {
      const originalContent = 'export EDITOR=vim\nexport LANG=en_US.UTF-8\n';
      writeFileSync(testZshrc, originalContent, 'utf-8');

      installHook(testZshrc, 'zsh');
      uninstallHook(testZshrc);

      const finalContent = readFileSync(testZshrc, 'utf-8');
      expect(finalContent).toBe(originalContent);
    });

    it('handles file with only whitespace after uninstall', () => {
      const hookContent = `
# >>> janus auto-initialization >>>
opencode() {
  janus exec -- "$@"
}
# <<< janus auto-initialization <<<

`;
      writeFileSync(testZshrc, hookContent, 'utf-8');

      uninstallHook(testZshrc);

      const content = readFileSync(testZshrc, 'utf-8');
      expect(content).toBe('');
    });
  });
});

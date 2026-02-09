import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { generateShellHook } from './shell-hook';

const HOOK_START_MARKER = '# >>> janus auto-initialization >>>';
const HOOK_END_MARKER = '# <<< janus auto-initialization <<<';

/**
 * Detect which shell RC file to use
 * Priority: .zshrc > .bashrc
 * If neither exists, return path for .zshrc (default)
 */
export function detectShellRcFile(): string {
  const home = homedir();
  const zshrcPath = join(home, '.zshrc');
  const bashrcPath = join(home, '.bashrc');

  if (existsSync(zshrcPath)) {
    return zshrcPath;
  }

  if (existsSync(bashrcPath)) {
    return bashrcPath;
  }

  // Neither exists, default to .zshrc
  return zshrcPath;
}

/**
 * Infer shell type from RC file name
 */
export function getShellTypeFromRcFile(rcFile: string): 'zsh' | 'bash' {
  return rcFile.endsWith('.zshrc') ? 'zsh' : 'bash';
}

/**
 * Check if hook is already installed in the RC file
 */
export function isHookInstalled(rcFilePath: string): boolean {
  if (!existsSync(rcFilePath)) {
    return false;
  }

  const content = readFileSync(rcFilePath, 'utf-8');
  return content.includes(HOOK_START_MARKER);
}

/**
 * Install shell hook to the RC file
 * @throws If hook is already installed
 */
export function installHook(rcFilePath: string, shellType: 'zsh' | 'bash'): void {
  // Check if already installed
  if (existsSync(rcFilePath)) {
    const content = readFileSync(rcFilePath, 'utf-8');
    if (content.includes(HOOK_START_MARKER)) {
      throw new Error('Hook already installed. Use uninstall first.');
    }
  }

  const hook = generateShellHook(shellType);
  const hookBlock = `${HOOK_START_MARKER}
${hook}
${HOOK_END_MARKER}
`;

  if (existsSync(rcFilePath)) {
    // Append to existing file
    const content = readFileSync(rcFilePath, 'utf-8');
    const newContent = content.endsWith('\n') ? content + hookBlock : content + '\n' + hookBlock;
    writeFileSync(rcFilePath, newContent, 'utf-8');
  } else {
    // Create new file
    writeFileSync(rcFilePath, hookBlock, 'utf-8');
  }
}

/**
 * Uninstall shell hook from the RC file
 * @throws If RC file doesn't exist or hook is not installed
 */
export function uninstallHook(rcFilePath: string): void {
  if (!existsSync(rcFilePath)) {
    throw new Error(`RC file not found: ${rcFilePath}`);
  }

  const content = readFileSync(rcFilePath, 'utf-8');

  if (!content.includes(HOOK_START_MARKER)) {
    throw new Error('Hook not installed.');
  }

  // Use regex to remove the entire hook block (including surrounding whitespace)
  const hookRegex = new RegExp(
    `\\n?${escapeRegex(HOOK_START_MARKER)}[\\s\\S]*?${escapeRegex(HOOK_END_MARKER)}\\n?`,
    'g'
  );

  const newContent = content.replace(hookRegex, '\n').trim();
  writeFileSync(rcFilePath, newContent ? newContent + '\n' : '', 'utf-8');
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

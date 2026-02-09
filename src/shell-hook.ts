/**
 * Generate shell hook script for the specified shell
 * @param shell - The shell type ('zsh' or 'bash')
 * @returns The shell hook script content
 */
export function generateShellHook(shell: 'zsh' | 'bash'): string {
  return `opencode() {
  opencode-env exec -- "$@"
}`;
}

/**
 * Get warning message if user already has opencode alias
 * @param shell - The shell type ('zsh' or 'bash')
 * @returns Warning message about alias conflict
 */
export function getAliasWarning(shell: 'zsh' | 'bash'): string {
  return `Warning: opencode alias already exists. The shell hook may not work as expected.`;
}

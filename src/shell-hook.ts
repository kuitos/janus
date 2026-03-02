import { getToolDef } from './tool-registry';

/**
 * Generate shell hook script for the specified shell and tools
 * @param shell - The shell type ('zsh' or 'bash')
 * @param tools - List of tool names to generate hooks for
 * @returns The shell hook script content
 */
export function generateShellHook(shell: 'zsh' | 'bash', tools: string[]): string {
  return tools.map(tool => {
    const toolDef = getToolDef(tool);
    return `${toolDef.command}() {\n  janus exec --tool ${tool} -- "$@"\n}`;
  }).join('\n');
}

/**
 * Get warning message if user already has aliases for tools
 * @param tools - List of tool names
 * @returns Warning message about alias conflicts
 */
export function getAliasWarning(tools: string[]): string {
  const commands = tools.map(t => getToolDef(t).command).join(', ');
  return `Warning: alias for ${commands} already exists. The shell hook may not work as expected.`;
}

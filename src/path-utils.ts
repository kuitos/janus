import { homedir } from 'node:os';

/**
 * Expands the tilde (~) in a path to the user's home directory.
 * @param path - The path that may contain a tilde
 * @returns The path with tilde expanded to the home directory
 *
 * @example
 * expandTilde('~/work/project') // '/Users/username/work/project'
 * expandTilde('/absolute/path') // '/absolute/path' (unchanged)
 * expandTilde('relative/path')  // 'relative/path' (unchanged)
 */
export function expandTilde(path: string): string {
  if (!path) {
    return path;
  }

  // Only expand if path starts with ~ or ~/
  if (path === '~') {
    return homedir();
  }

  if (path.startsWith('~/')) {
    return homedir() + path.slice(1);
  }

  return path;
}

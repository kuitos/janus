import { spawn } from 'node:child_process';
import { resolvePath } from './resolver';
import type { Mapping } from './types';

export async function execWithConfig(
  configDir: string,
  opencodeArgs: string[]
): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('opencode', opencodeArgs, {
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: configDir
      },
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      resolve(code ?? 1);
    });

    child.on('error', (error) => {
      console.error('Failed to start opencode:', error);
      resolve(1);
    });
  });
}

export async function exec(
  cwd: string,
  mappings: Mapping[],
  opencodeArgs: string[]
): Promise<number> {
  const match = resolvePath(cwd, mappings);

  if (!match) {
    return 1;
  }

  return execWithConfig(match.configDir, opencodeArgs);
}

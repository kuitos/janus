import { resolvePath } from './resolver';
import type { Mapping } from './types';

export async function execWithConfig(
  configDir: string,
  opencodeArgs: string[]
): Promise<number> {
  const proc = Bun.spawn(['opencode', ...opencodeArgs], {
    env: {
      ...process.env,
      OPENCODE_CONFIG_DIR: configDir
    },
    stdio: ['inherit', 'inherit', 'inherit']
  });

  const exitCode = await proc.exited;
  return exitCode;
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

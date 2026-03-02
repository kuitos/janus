import { spawn } from 'node:child_process';
import { resolvePath } from './resolver';
import type { NormalizedMapping, ToolConfigDir } from './types';
import { getToolDef } from './tool-registry';

export async function execWithConfig(
  toolName: string,
  configDirs: ToolConfigDir[],
  args: string[]
): Promise<number> {
  const toolDef = getToolDef(toolName);
  const toolConfig = configDirs.find(tc => tc.tool === toolName);

  if (!toolConfig) {
    console.error(`No config directory found for tool: ${toolName}`);
    return 1;
  }

  return new Promise((resolve) => {
    const child = spawn(toolDef.command, args, {
      env: {
        ...process.env,
        [toolDef.envVar]: toolConfig.dir
      },
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      resolve(code ?? 1);
    });

    child.on('error', (error) => {
      console.error(`Failed to start ${toolDef.command}:`, error);
      resolve(1);
    });
  });
}

export async function exec(
  cwd: string,
  mappings: NormalizedMapping[],
  toolName: string,
  args: string[],
  defaultConfigDir?: ToolConfigDir[]
): Promise<number> {
  const match = resolvePath(cwd, mappings, defaultConfigDir);

  if (!match) {
    return 1;
  }

  return execWithConfig(toolName, match.configDir, args);
}

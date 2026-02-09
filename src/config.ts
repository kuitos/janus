import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ConfigSchema, type Config } from './types';

export function getDefaultConfigPath(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  const configBase = xdgConfigHome || join(homedir(), '.config');
  return join(configBase, 'janus', 'config.json');
}

export function loadConfig(configPath: string): Config {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  try {
    const fileContent = readFileSync(configPath, 'utf-8');
    const parsedConfig = JSON.parse(fileContent);
    return ConfigSchema.parse(parsedConfig);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${configPath}`);
    }
    throw error;
  }
}

export function loadDefaultConfig(): Config {
  const defaultPath = getDefaultConfigPath();
  return loadConfig(defaultPath);
}

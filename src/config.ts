import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ConfigSchema, type NormalizedConfig, type ToolConfigDir } from './types';
import { expandTilde } from './path-utils';

export function getDefaultConfigPath(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  const configBase = xdgConfigHome || join(homedir(), '.config');
  return join(configBase, 'janus', 'config.json');
}

/**
 * Normalize configDir to always be ToolConfigDir[].
 * String format is treated as opencode shorthand for backward compatibility.
 */
export function normalizeConfigDir(configDir: string | ToolConfigDir[]): ToolConfigDir[] {
  if (typeof configDir === 'string') {
    return [{ tool: 'opencode', dir: configDir }];
  }
  return configDir;
}

/**
 * Extract unique tool names from a normalized config.
 */
export function extractToolNames(config: NormalizedConfig): string[] {
  const tools = new Set<string>();

  for (const mapping of config.mappings) {
    for (const tc of mapping.configDir) {
      tools.add(tc.tool);
    }
  }

  if (config.defaultConfigDir) {
    for (const tc of config.defaultConfigDir) {
      tools.add(tc.tool);
    }
  }

  return [...tools];
}

export function loadConfig(configPath: string): NormalizedConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  try {
    const fileContent = readFileSync(configPath, 'utf-8');
    const parsedConfig = JSON.parse(fileContent);
    const config = ConfigSchema.parse(parsedConfig);

    // Normalize and expand tilde in all paths
    const normalizedConfig: NormalizedConfig = {
      defaultConfigDir: config.defaultConfigDir
        ? normalizeConfigDir(config.defaultConfigDir).map(tc => ({
            ...tc,
            dir: expandTilde(tc.dir),
          }))
        : undefined,
      mappings: config.mappings.map(mapping => ({
        match: mapping.match.map(pattern => expandTilde(pattern)),
        configDir: normalizeConfigDir(mapping.configDir).map(tc => ({
          ...tc,
          dir: expandTilde(tc.dir),
        })),
      })),
    };

    return normalizedConfig;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${configPath}`);
    }
    throw error;
  }
}

export function loadDefaultConfig(): NormalizedConfig {
  const defaultPath = getDefaultConfigPath();
  return loadConfig(defaultPath);
}

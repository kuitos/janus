#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  detectShellRcFile,
  getShellTypeFromRcFile,
  isHookInstalled,
  installHook,
  uninstallHook
} from './install';
import { exec } from './exec';
import { loadDefaultConfig } from './config';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

export function showVersion(): void {
  console.log(getVersion());
}

export function showHelp(): void {
  console.log(`Usage: janus <command> [options]

Commands:
  install      Install shell hook to .zshrc or .bashrc
  uninstall    Uninstall shell hook from shell RC file
  exec         Execute opencode with configured environment (used by shell hook)

Options:
  --help, -h      Show this help message
  --version, -v   Show version number
`);
}

async function handleInstall(): Promise<number> {
  try {
    const rcFile = detectShellRcFile();
    const shellType = getShellTypeFromRcFile(rcFile);

    if (isHookInstalled(rcFile)) {
      console.error('Error: Hook already installed.');
      console.error(`To reinstall, run: janus uninstall && janus install`);
      return 1;
    }

    installHook(rcFile, shellType);

    console.log(`✓ Successfully installed janus hook to ${rcFile}`);
    console.log(`  Please restart your shell or run: source ${rcFile}`);

    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function handleUninstall(): Promise<number> {
  try {
    const rcFile = detectShellRcFile();

    if (!isHookInstalled(rcFile)) {
      console.error('Error: Hook not installed.');
      return 1;
    }

    uninstallHook(rcFile);

    console.log(`✓ Successfully uninstalled janus hook from ${rcFile}`);
    console.log(`  Please restart your shell or run: source ${rcFile}`);

    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function handleExec(args: string[]): Promise<number> {
  try {
    const cwd = process.cwd();
    const config = loadDefaultConfig();
    return await exec(cwd, config.mappings, args);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

export async function main(args: string[]): Promise<number> {
  try {
    const options = {
      help: {
        type: 'boolean' as const,
        short: 'h',
      },
      version: {
        type: 'boolean' as const,
        short: 'v',
      },
    };

    const { values, positionals } = parseArgs({
      args,
      options,
      allowPositionals: true,
    });

    if (values.help) {
      showHelp();
      return 0;
    }

    if (values.version) {
      showVersion();
      return 0;
    }

    if (positionals.length === 0) {
      console.error('Error: No command specified');
      console.error('Use --help for usage information');
      return 1;
    }

    const command = positionals[0];

    if (command === 'install') {
      return await handleInstall();
    } else if (command === 'uninstall') {
      return await handleUninstall();
    } else if (command === 'exec') {
      // exec 命令接收所有剩余的参数
      const execArgs = positionals.slice(1);
      return await handleExec(execArgs);
    } else {
      console.error(`Error: Unknown command: ${command}`);
      console.error('Use --help for usage information');
      return 1;
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

// Execute if run directly
// Check if this module is the main module (works in both Node.js and Bun)
if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main(process.argv.slice(2));
  process.exit(exitCode);
}


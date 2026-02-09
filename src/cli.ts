#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { exec } from './exec';
import { testPath, formatTestResult } from './test-command';
import { generateShellHook } from './shell-hook';
import { loadConfig } from './config';
import { homedir } from 'node:os';

const CONFIG_PATH = `${homedir()}/.config/opencode-env/config.json`;

export function showHelp(): void {
  console.log(`Usage: opencode-env <command> [options]

Commands:
  exec [--] <opencode-args...>        Execute opencode with matched config directory
  test <path>                          Test specified path against mappings
  install-shell-hook [--shell <type>] Generate shell hook script (zsh or bash)

Options:
  --help, -h                            Show this help message
  --shell, -s <shell>                  Shell type for install-shell-hook (zsh|bash)
`);
}

async function handleExec(positionals: string[]): Promise<number> {
  try {
    const config = await loadConfig(CONFIG_PATH);
    const cwd = process.cwd();
    const opencodeArgs = positionals;
    
    return await exec(cwd, config.mappings, opencodeArgs);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function handleTest(positionals: string[]): Promise<number> {
  try {
    if (positionals.length === 0) {
      console.error('Error: test command requires a path argument');
      return 1;
    }

    const config = await loadConfig(CONFIG_PATH);
    const path = positionals[0];
    const result = testPath(path, config.mappings);
    const output = formatTestResult(result);
    
    console.log(output);
    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function handleInstallShellHook(values: { shell?: string }): Promise<number> {
  try {
    const shell = (values.shell as 'zsh' | 'bash') ?? 'zsh';
    const hook = generateShellHook(shell);
    
    console.log(hook);
    return 0;
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

export async function main(args: string[]): Promise<number> {
  try {
    const options = {
      shell: {
        type: 'string' as const,
        short: 's',
      },
      help: {
        type: 'boolean' as const,
        short: 'h',
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

    if (positionals.length === 0) {
      console.error('Error: No command specified');
      console.error('Use --help for usage information');
      return 1;
    }

    const command = positionals[0];
    const commandArgs = positionals.slice(1);

    if (command === 'exec') {
      return await handleExec(commandArgs);
    } else if (command === 'test') {
      return await handleTest(commandArgs);
    } else if (command === 'install-shell-hook') {
      return await handleInstallShellHook(values);
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
if (import.meta.main) {
  const exitCode = await main(process.argv.slice(2));
  process.exit(exitCode);
}

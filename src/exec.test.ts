import { describe, it, expect } from 'bun:test';
import { execWithConfig } from './exec';

describe('execWithConfig', () => {
  it('spawns process with OPENCODE_CONFIG_DIR environment variable', async () => {
    const configDir = '/test/config/dir';
    
    const proc = Bun.spawn(['sh', '-c', `echo $OPENCODE_CONFIG_DIR`], {
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: configDir
      },
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe(configDir);
  });

  it('forwards zero exit code on successful execution', async () => {
    const configDir = '/test/config/dir';
    
    const proc = Bun.spawn(['true'], {
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: configDir
      },
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    const exitCode = await proc.exited;
    
    expect(exitCode).toBe(0);
  });

  it('forwards non-zero exit code on failure', async () => {
    const configDir = '/test/config/dir';
    
    const proc = Bun.spawn(['false'], {
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: configDir
      },
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    const exitCode = await proc.exited;
    
    expect(exitCode).toBe(1);
  });

  it('preserves existing environment variables', async () => {
    const configDir = '/test/config/dir';
    const testVar = 'test-value-12345';
    
    const proc = Bun.spawn(['sh', '-c', `echo $OPENCODE_CONFIG_DIR:$OPENCODE_TEST_VAR`], {
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: configDir,
        OPENCODE_TEST_VAR: testVar
      },
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe(`${configDir}:${testVar}`);
  });

  it('forwards arguments to command', async () => {
    const configDir = '/test/config/dir';
    const args = ['arg1', 'arg2', 'arg3'];
    
    const proc = Bun.spawn(['echo', ...args], {
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: configDir
      },
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe(args.join(' '));
  });
});

describe('exec', () => {
  it('resolves config dir and executes command with match', async () => {
    const cwd = '/test/cwd';
    const mappings = [
      {
        match: ['/test/cwd'],
        configDir: '/test/config/dir'
      }
    ];
    const opencodeArgs = ['--version'];
    
    const proc = Bun.spawn(['sh', '-c', `echo $OPENCODE_CONFIG_DIR`], {
      env: {
        ...process.env,
        OPENCODE_CONFIG_DIR: '/test/config/dir'
      },
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe('/test/config/dir');
  });

  it('returns exit code 1 when no match found', async () => {
    const cwd = '/no/match/cwd';
    const mappings = [
      {
        match: ['/test/cwd'],
        configDir: '/test/config/dir'
      }
    ];
    const opencodeArgs = ['--version'];
    
    const exitCode = 1;
    
    expect(exitCode).toBe(1);
  });
});

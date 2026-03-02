import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, loadDefaultConfig, getDefaultConfigPath } from './config';

describe('getDefaultConfigPath', () => {
  it('returns XDG_CONFIG_HOME path when set', () => {
    const originalXDG = process.env.XDG_CONFIG_HOME;
    try {
      process.env.XDG_CONFIG_HOME = '/test/config';
      const path = getDefaultConfigPath();
      expect(path).toBe('/test/config/janus/config.json');
    } finally {
      process.env.XDG_CONFIG_HOME = originalXDG;
    }
  });

  it('returns default ~/.config path when XDG_CONFIG_HOME not set', () => {
    const originalXDG = process.env.XDG_CONFIG_HOME;
    try {
      delete process.env.XDG_CONFIG_HOME;
      const path = getDefaultConfigPath();
      expect(path).toMatch(/\.config\/janus\/config\.json$/);
    } finally {
      process.env.XDG_CONFIG_HOME = originalXDG;
    }
  });
});

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'janus-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads valid config file with string configDir (backward compatible)', () => {
    const configPath = join(tempDir, 'config.json');
    const validConfig = {
      mappings: [
        {
          match: ['/Users/test/work/**'],
          configDir: '/Users/test/.config/opencode-test'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(validConfig));

    const config = loadConfig(configPath);

    expect(config.mappings).toHaveLength(1);
    expect(config.mappings[0].match).toEqual(['/Users/test/work/**']);
    // String configDir is normalized to ToolConfigDir[]
    expect(config.mappings[0].configDir).toEqual([
      { tool: 'opencode', dir: '/Users/test/.config/opencode-test' }
    ]);
  });

  it('loads valid config file with array configDir (new format)', () => {
    const configPath = join(tempDir, 'config.json');
    const validConfig = {
      mappings: [
        {
          match: ['/Users/test/work/**'],
          configDir: [
            { tool: 'opencode', dir: '/Users/test/.config/opencode-work' },
            { tool: 'claude', dir: '/Users/test/.config/claude-work' }
          ]
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(validConfig));

    const config = loadConfig(configPath);

    expect(config.mappings).toHaveLength(1);
    expect(config.mappings[0].configDir).toEqual([
      { tool: 'opencode', dir: '/Users/test/.config/opencode-work' },
      { tool: 'claude', dir: '/Users/test/.config/claude-work' }
    ]);
  });

  it('loads config with multiple mappings', () => {
    const configPath = join(tempDir, 'config.json');
    const validConfig = {
      mappings: [
        {
          match: ['/Users/test/work/company-a/**'],
          configDir: '/Users/test/.config/opencode-company'
        },
        {
          match: ['/Users/test/work/oss/**'],
          configDir: '/Users/test/.config/opencode-oss'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(validConfig));

    const config = loadConfig(configPath);

    expect(config.mappings).toHaveLength(2);
    expect(config.mappings[0].match).toEqual(['/Users/test/work/company-a/**']);
    expect(config.mappings[1].match).toEqual(['/Users/test/work/oss/**']);
  });

  it('throws error when config file does not exist', () => {
    const configPath = join(tempDir, 'nonexistent.json');

    expect(() => loadConfig(configPath)).toThrow();
    expect(() => loadConfig(configPath)).toThrow(/config file not found/i);
  });

  it('throws error for invalid JSON', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, '{ invalid json }');

    expect(() => loadConfig(configPath)).toThrow();
    expect(() => loadConfig(configPath)).toThrow(/invalid json/i);
  });

  it('throws error when mappings field is missing', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({}));

    expect(() => loadConfig(configPath)).toThrow();
  });

  it('throws error when mappings is empty array', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({ mappings: [] }));

    expect(() => loadConfig(configPath)).toThrow();
  });

  it('throws error when mapping match array is empty', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({
      mappings: [{
        match: [],
        configDir: '/test'
      }]
    }));

    expect(() => loadConfig(configPath)).toThrow();
  });

  it('throws error when mapping configDir is missing', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({
      mappings: [{
        match: ['/test/**']
      }]
    }));

    expect(() => loadConfig(configPath)).toThrow();
  });

  it('throws error when mapping configDir is not a string or array', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({
      mappings: [{
        match: ['/test/**'],
        configDir: 123
      }]
    }));

    expect(() => loadConfig(configPath)).toThrow();
  });

  it('throws error when match is not an array', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({
      mappings: [{
        match: '/test/**',
        configDir: '/test'
      }]
    }));

    expect(() => loadConfig(configPath)).toThrow();
  });

  it('expands tilde in match patterns and string configDir', () => {
    const configPath = join(tempDir, 'config.json');
    const homeDir = homedir();
    const configWithTilde = {
      mappings: [
        {
          match: ['~/work/**'],
          configDir: '~/.config/opencode-work'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(configWithTilde));

    const config = loadConfig(configPath);

    expect(config.mappings[0].match).toEqual([`${homeDir}/work/**`]);
    expect(config.mappings[0].configDir).toEqual([
      { tool: 'opencode', dir: `${homeDir}/.config/opencode-work` }
    ]);
  });

  it('expands tilde in array configDir', () => {
    const configPath = join(tempDir, 'config.json');
    const homeDir = homedir();
    const configWithTilde = {
      mappings: [
        {
          match: ['~/work/**'],
          configDir: [
            { tool: 'opencode', dir: '~/.config/opencode-work' },
            { tool: 'claude', dir: '~/.config/claude-work' }
          ]
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(configWithTilde));

    const config = loadConfig(configPath);

    expect(config.mappings[0].configDir).toEqual([
      { tool: 'opencode', dir: `${homeDir}/.config/opencode-work` },
      { tool: 'claude', dir: `${homeDir}/.config/claude-work` }
    ]);
  });

  it('expands tilde in multiple patterns', () => {
    const configPath = join(tempDir, 'config.json');
    const homeDir = homedir();
    const configWithTilde = {
      mappings: [
        {
          match: ['~/work/**', '~/projects/**'],
          configDir: '~/.config/opencode'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(configWithTilde));

    const config = loadConfig(configPath);

    expect(config.mappings[0].match).toEqual([
      `${homeDir}/work/**`,
      `${homeDir}/projects/**`
    ]);
  });

  it('handles mixed tilde and absolute paths', () => {
    const configPath = join(tempDir, 'config.json');
    const homeDir = homedir();
    const configWithMixed = {
      mappings: [
        {
          match: ['~/work/**', '/absolute/path/**'],
          configDir: '~/.config/opencode'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(configWithMixed));

    const config = loadConfig(configPath);

    expect(config.mappings[0].match).toEqual([
      `${homeDir}/work/**`,
      '/absolute/path/**'
    ]);
  });

  it('loads config with string defaultConfigDir', () => {
    const configPath = join(tempDir, 'config.json');
    const validConfig = {
      defaultConfigDir: '/Users/test/.config/opencode-default',
      mappings: [
        {
          match: ['/Users/test/work/**'],
          configDir: '/Users/test/.config/opencode-work'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(validConfig));

    const config = loadConfig(configPath);

    // String defaultConfigDir is normalized to ToolConfigDir[]
    expect(config.defaultConfigDir).toEqual([
      { tool: 'opencode', dir: '/Users/test/.config/opencode-default' }
    ]);
    expect(config.mappings).toHaveLength(1);
  });

  it('loads config with array defaultConfigDir', () => {
    const configPath = join(tempDir, 'config.json');
    const validConfig = {
      defaultConfigDir: [
        { tool: 'opencode', dir: '/Users/test/.config/opencode-default' },
        { tool: 'claude', dir: '/Users/test/.config/claude-default' }
      ],
      mappings: [
        {
          match: ['/Users/test/work/**'],
          configDir: '/Users/test/.config/opencode-work'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(validConfig));

    const config = loadConfig(configPath);

    expect(config.defaultConfigDir).toEqual([
      { tool: 'opencode', dir: '/Users/test/.config/opencode-default' },
      { tool: 'claude', dir: '/Users/test/.config/claude-default' }
    ]);
  });

  it('loads config without defaultConfigDir (backward compatibility)', () => {
    const configPath = join(tempDir, 'config.json');
    const validConfig = {
      mappings: [
        {
          match: ['/Users/test/work/**'],
          configDir: '/Users/test/.config/opencode-work'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(validConfig));

    const config = loadConfig(configPath);

    expect(config.defaultConfigDir).toBeUndefined();
    expect(config.mappings).toHaveLength(1);
  });

  it('expands tilde in string defaultConfigDir', () => {
    const configPath = join(tempDir, 'config.json');
    const homeDir = homedir();
    const configWithTilde = {
      defaultConfigDir: '~/.config/opencode-default',
      mappings: [
        {
          match: ['~/work/**'],
          configDir: '~/.config/opencode-work'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(configWithTilde));

    const config = loadConfig(configPath);

    expect(config.defaultConfigDir).toEqual([
      { tool: 'opencode', dir: `${homeDir}/.config/opencode-default` }
    ]);
  });

  it('expands tilde in array defaultConfigDir', () => {
    const configPath = join(tempDir, 'config.json');
    const homeDir = homedir();
    const configWithTilde = {
      defaultConfigDir: [
        { tool: 'opencode', dir: '~/.config/opencode-default' },
        { tool: 'claude', dir: '~/.config/claude-default' }
      ],
      mappings: [
        {
          match: ['~/work/**'],
          configDir: '~/.config/opencode-work'
        }
      ]
    };
    writeFileSync(configPath, JSON.stringify(configWithTilde));

    const config = loadConfig(configPath);

    expect(config.defaultConfigDir).toEqual([
      { tool: 'opencode', dir: `${homeDir}/.config/opencode-default` },
      { tool: 'claude', dir: `${homeDir}/.config/claude-default` }
    ]);
  });
});

describe('loadDefaultConfig', () => {
  it('loads config from default location', () => {
    const originalXDG = process.env.XDG_CONFIG_HOME;
    const tempDir = mkdtempSync(join(tmpdir(), 'janus-test-'));

    try {
      process.env.XDG_CONFIG_HOME = tempDir;
      const configDir = join(tempDir, 'janus');
      const configPath = join(configDir, 'config.json');

      const { mkdirSync } = require('node:fs');
      mkdirSync(configDir, { recursive: true });

      const validConfig = {
        mappings: [
          {
            match: ['/test/**'],
            configDir: '/test/.config/opencode'
          }
        ]
      };
      writeFileSync(configPath, JSON.stringify(validConfig));

      const config = loadDefaultConfig();
      // String configDir is normalized
      expect(config.mappings[0].configDir).toEqual([
        { tool: 'opencode', dir: '/test/.config/opencode' }
      ]);
    } finally {
      process.env.XDG_CONFIG_HOME = originalXDG;
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('throws error when default config file does not exist', () => {
    const originalXDG = process.env.XDG_CONFIG_HOME;
    const tempDir = mkdtempSync(join(tmpdir(), 'janus-test-'));

    try {
      process.env.XDG_CONFIG_HOME = tempDir;

      expect(() => loadDefaultConfig()).toThrow();
      expect(() => loadDefaultConfig()).toThrow(/config file not found/i);
    } finally {
      process.env.XDG_CONFIG_HOME = originalXDG;
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

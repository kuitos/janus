import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, loadDefaultConfig, getDefaultConfigPath } from './config';
import type { Config, Mapping } from './types';

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

  it('loads valid config file', () => {
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

    expect(config).toEqual(validConfig);
    expect(config.mappings).toHaveLength(1);
    expect(config.mappings[0].match).toEqual(['/Users/test/work/**']);
    expect(config.mappings[0].configDir).toBe('/Users/test/.config/opencode-test');
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
    expect(() => loadConfig(configPath)).toThrow(/mappings/i);
  });

  it('throws error when mappings is empty array', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({ mappings: [] }));

    expect(() => loadConfig(configPath)).toThrow();
    expect(() => loadConfig(configPath)).toThrow(/at least one mapping/i);
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
    expect(() => loadConfig(configPath)).toThrow(/at least one pattern/i);
  });

  it('throws error when mapping configDir is missing', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({
      mappings: [{
        match: ['/test/**']
      }]
    }));

    expect(() => loadConfig(configPath)).toThrow();
    expect(() => loadConfig(configPath)).toThrow(/configDir/i);
  });

  it('throws error when mapping configDir is not a string', () => {
    const configPath = join(tempDir, 'invalid.json');
    writeFileSync(configPath, JSON.stringify({
      mappings: [{
        match: ['/test/**'],
        configDir: 123
      }]
    }));

    expect(() => loadConfig(configPath)).toThrow();
    expect(() => loadConfig(configPath)).toThrow(/configDir/i);
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
    expect(() => loadConfig(configPath)).toThrow(/match/i);
  });

  it('expands tilde in match patterns', () => {
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
    expect(config.mappings[0].configDir).toBe(`${homeDir}/.config/opencode-work`);
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
    expect(config.mappings[0].configDir).toBe(`${homeDir}/.config/opencode`);
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
      expect(config).toEqual(validConfig);
    } finally {
      process.env.XDG_CONFIG_HOME = originalXDG;
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('throws error when default config file does not exist', () => {
    const originalXDGX = process.env.XDG_CONFIG_HOME;
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

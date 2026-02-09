// Public API exports
export { loadConfig } from './config';
export { testPath, formatTestResult } from './test-command';
export { generateShellHook } from './shell-hook';
export { exec } from './exec';
export { resolvePath, matchesPattern, findLongestMatch } from './resolver';
export type { Config, Mapping } from './types';

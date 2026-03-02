// Public API exports
export { loadConfig, normalizeConfigDir, extractToolNames } from './config';
export { testPath, formatTestResult } from './test-command';
export { generateShellHook } from './shell-hook';
export { exec } from './exec';
export { resolvePath, matchesPattern, findLongestMatch } from './resolver';
export { TOOL_REGISTRY, getToolDef, isValidTool } from './tool-registry';
export type { Config, Mapping, NormalizedConfig, NormalizedMapping, ToolConfigDir } from './types';
export type { ToolName, ToolDef } from './tool-registry';

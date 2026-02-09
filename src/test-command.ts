import { resolvePath } from './resolver';
import type { Mapping } from './types';

export function testPath(
  path: string,
  mappings: Mapping[]
): {
  matched: boolean;
  configDir?: string;
  matchedPattern?: string;
  message: string;
} {
  const matchResult = resolvePath(path, mappings);

  if (matchResult) {
    return {
      matched: true,
      configDir: matchResult.configDir,
      matchedPattern: matchResult.matchedPattern,
      message: `✓ Matched: ${path}`
    };
  }

  return {
    matched: false,
    configDir: undefined,
    matchedPattern: undefined,
    message: `✗ No match found for: ${path}`
  };
}

export function formatTestResult(result: ReturnType<typeof testPath>): string {
  if (result.matched) {
    return `${result.message}
  Pattern: ${result.matchedPattern}
  Config:  ${result.configDir}`;
  }

  return `${result.message}
  Using default OpenCode configuration`;
}

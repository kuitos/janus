import { resolvePath } from './resolver';
import type { NormalizedMapping, ToolConfigDir } from './types';

export function testPath(
  path: string,
  mappings: NormalizedMapping[]
): {
  matched: boolean;
  configDir?: ToolConfigDir[];
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
    const toolLines = result.configDir!.map(tc => `    ${tc.tool}: ${tc.dir}`).join('\n');
    return `${result.message}
  Pattern: ${result.matchedPattern}
  Config:
${toolLines}`;
  }

  return `${result.message}
  Using default configuration`;
}

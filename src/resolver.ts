import { realpathSync } from 'fs';
import type { Mapping } from './types';
import { expandTilde } from './path-utils';

export function matchesPattern(path: string, pattern: string): boolean {
  if (!path || !pattern) {
    return false;
  }

  const globIndex = pattern.indexOf('**');

  if (globIndex === -1) {
    if (path === pattern) {
      return true;
    }

    if (path.startsWith(pattern + '/')) {
      return true;
    }

    return false;
  }

  const prefix = pattern.substring(0, globIndex);

  if (prefix === '') {
    return true;
  }

  if (path.startsWith(prefix)) {
    return true;
  }

  return false;
}

type MatchCandidate = { pattern: string; configDir: string };

function findBestMatchForPath(path: string, candidates: MatchCandidate[]): { configDir: string; matchedPattern: string } | null {
  let bestMatch: { configDir: string; matchedPattern: string } | null = null;
  let longestPattern = '';

  for (const candidate of candidates) {
    if (matchesPattern(path, candidate.pattern)) {
      if (candidate.pattern.length > longestPattern.length) {
        longestPattern = candidate.pattern;
        bestMatch = {
          configDir: candidate.configDir,
          matchedPattern: candidate.pattern
        };
      }
    }
  }

  return bestMatch;
}

export function findLongestMatch(
  path: string,
  candidates: Array<{ pattern: string; configDir: string }>
): { configDir: string; matchedPattern: string } | null {
  return findBestMatchForPath(path, candidates);
}

export function resolvePath(
  path: string,
  mappings: Mapping[]
): { configDir: string; matchedPattern: string } | null {
  if (mappings.length === 0) {
    return null;
  }

  // Expand tilde in input path
  const expandedPath = expandTilde(path);

  const allCandidates: MatchCandidate[] = mappings.flatMap(mapping =>
    mapping.match.map(pattern => ({
      pattern,
      configDir: mapping.configDir
    }))
  );

  const bestMatch = findBestMatchForPath(expandedPath, allCandidates);

  if (bestMatch) {
    return bestMatch;
  }

  try {
    const resolvedPath = realpathSync(expandedPath);

    if (resolvedPath !== expandedPath) {
      return findBestMatchForPath(resolvedPath, allCandidates);
    }
  } catch {
    return null;
  }

  return null;
}

# NPM Publishing Guide

## Prerequisites

- npm account (register at https://www.npmjs.com)
- Logged in locally: `npm login`
- GitHub repository with push access

## Publishing Process

### 1. Automated Publishing via GitHub Tags

The recommended way to publish is using GitHub Actions:

```bash
# Update version in package.json
npm version patch|minor|major

# This creates a tag and pushes to GitHub
# GitHub Actions will automatically build and publish to npm
```

### 2. Manual Publishing (if needed)

```bash
# Ensure all tests pass
bun test

# Build the package
bun run build

# Verify the package contents
npm pack --dry-run

# Publish to npm
npm publish

# Create and push a git tag
git tag v$(node -e "console.log(require('./package.json').version)")
git push origin --tags
```

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backward compatible)
- **PATCH** (0.0.1): Bug fixes

Use `npm version` to update versions:

```bash
npm version major  # 1.0.0 → 2.0.0
npm version minor  # 1.0.0 → 1.1.0
npm version patch  # 1.0.0 → 1.0.1
```

## GitHub Actions Setup

To enable automated publishing:

1. Create an NPM access token with "Automation" permissions
2. Add it to GitHub repository secrets as `NPM_TOKEN`
3. Push a tag matching `v*` pattern to trigger publishing

## Package Contents

The published package includes:

- Compiled JavaScript in `dist/` directory
- TypeScript type definitions (`*.d.ts`)
- CLI executable (`opencode-env` command)
- Public API exports for programmatic usage

## Testing Before Publishing

```bash
# Run all tests
bun test

# Check type safety
bun run typecheck

# Verify package structure
npm pack --dry-run

# Try local installation
npm install -g .
opencode-env --help
```

## Troubleshooting

### Package already published

If you see "You cannot publish over an existing version", increment the version in `package.json` and try again.

### Missing dependencies

Run `bun install` to ensure all dependencies are available before publishing.

### Type definitions not included

Ensure `tsconfig.json` has `"declaration": true` in compiler options (it's added by the build script).

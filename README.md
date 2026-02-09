# janus

Directory-based OpenCode configuration switching tool. Automatically switch between different OpenCode configurations based on your current working directory.

Named after the Roman god of transitions and new beginnings—janus transforms your configuration seamlessly as you move between different projects.

## Installation

### Via NPM (Recommended)

```bash
npm install -g janus
```

### Via Bun (Development)

```bash
# Clone the repository
git clone https://github.com/kuitos/janus.git
cd janus

# Install dependencies
bun install

# Build the project
bun run build

# Install globally from source
npm install -g .
```

## Configuration

Create a configuration file at `~/.config/janus/config.json`:

```json
{
  "mappings": [
    {
      "match": ["/Users/yourname/work/company/**"],
      "configDir": "/Users/yourname/.config/opencode-company"
    },
    {
      "match": ["/Users/yourname/projects/oss/**"],
      "configDir": "/Users/yourname/.config/opencode-oss"
    }
  ]
}
```

### Configuration Format

- `mappings`: Array of mapping rules
  - `match`: Array of path patterns (supports glob patterns with `**`)
  - `configDir`: The configuration directory to use for matching paths

Each configuration directory should contain:
- `opencode.json` - OpenCode configuration
- `oh-my-opencode.json` - oh-my-opencode configuration

## Usage

### First Time Setup

After installation, create your configuration file:

```bash
mkdir -p ~/.config/janus
```

Then configure your path mappings (see Configuration section above).

### Test a Path

Test which configuration would be used for a given path:

```bash
janus test /Users/yourname/work/company/project
```

### Execute OpenCode

Run OpenCode with the appropriate configuration for your current directory:

```bash
janus exec -- --help
```

### Install Shell Hook (Recommended)

Generate a shell hook for automatic configuration switching:

```bash
# For zsh
janus install-shell-hook --shell zsh >> ~/.zshrc

# For bash
janus install-shell-hook --shell bash >> ~/.bashrc
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

The shell hook creates a wrapper function that automatically sets the correct configuration based on your current directory. Now you can use `opencode` directly instead of `janus exec`.

## How It Works

1. **Path Matching**: When you run a command, janus checks your current working directory against the configured patterns
2. **Longest Prefix Priority**: If multiple patterns match, the longest (most specific) pattern wins
3. **Environment Variable**: The tool sets `OPENCODE_CONFIG_DIR` to point to the matched configuration directory
4. **Process Isolation**: Each opencode process gets its own configuration, preventing conflicts between different projects

## Development

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Build for production
bun run build

# Type check
bun run typecheck
```

## Project Structure

```
src/
├── types.ts              # TypeScript type definitions
├── config.ts             # Configuration loading
├── config.test.ts        # Config tests
├── resolver.ts           # Path matching logic
├── resolver.test.ts      # Resolver tests
├── exec.ts               # Exec command
├── exec.test.ts          # Exec tests
├── test-command.ts       # Test command
├── test-command.test.ts  # Test command tests
├── shell-hook.ts         # Shell hook generation
├── shell-hook.test.ts    # Shell hook tests
├── cli.ts                # CLI entry point
└── cli.test.ts           # CLI tests
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [Bun](https://bun.sh)
- Inspired by [direnv](https://direnv.net/) and [projj](https://github.com/popomore/projj)

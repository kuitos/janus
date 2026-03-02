export type ToolName = 'opencode' | 'claude';

export type ToolDef = {
  command: string;
  envVar: string;
};

export const TOOL_REGISTRY: Record<ToolName, ToolDef> = {
  opencode: { command: 'opencode', envVar: 'OPENCODE_CONFIG_DIR' },
  claude: { command: 'claude', envVar: 'CLAUDE_CONFIG_DIR' },
};

export function isValidTool(name: string): name is ToolName {
  return name in TOOL_REGISTRY;
}

export function getToolDef(name: string): ToolDef {
  if (!isValidTool(name)) {
    throw new Error(`Unknown tool: ${name}. Available tools: ${Object.keys(TOOL_REGISTRY).join(', ')}`);
  }
  return TOOL_REGISTRY[name];
}

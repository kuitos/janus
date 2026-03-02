import { z } from 'zod';

export const ToolConfigDirSchema = z.object({
  tool: z.string().min(1, 'tool must not be empty'),
  dir: z.string().min(1, 'dir must not be empty'),
});

export type ToolConfigDir = z.infer<typeof ToolConfigDirSchema>;

const ConfigDirSchema = z.union([
  z.string().min(1, 'configDir must not be empty'),
  z.array(ToolConfigDirSchema).min(1, 'configDir must have at least one tool config'),
]);

export const MappingSchema = z.object({
  match: z.array(z.string()).min(1, 'match must have at least one pattern'),
  configDir: ConfigDirSchema,
});

export const ConfigSchema = z.object({
  defaultConfigDir: ConfigDirSchema.optional(),
  mappings: z.array(MappingSchema).min(1, 'config must have at least one mapping'),
});

export type Config = z.infer<typeof ConfigSchema>;
export type Mapping = z.infer<typeof MappingSchema>;

// Normalized types where configDir is always ToolConfigDir[]
export type NormalizedMapping = {
  match: string[];
  configDir: ToolConfigDir[];
};

export type NormalizedConfig = {
  defaultConfigDir?: ToolConfigDir[];
  mappings: NormalizedMapping[];
};

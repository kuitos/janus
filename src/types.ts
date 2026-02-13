import { z } from 'zod';

export const MappingSchema = z.object({
  match: z.array(z.string()).min(1, 'match must have at least one pattern'),
  configDir: z.string().min(1, 'configDir must not be empty')
});

export const ConfigSchema = z.object({
  defaultConfigDir: z.string().optional(),
  mappings: z.array(MappingSchema).min(1, 'config must have at least one mapping')
});

export type Config = z.infer<typeof ConfigSchema>;
export type Mapping = z.infer<typeof MappingSchema>;

import { z } from 'zod';
import { BackgroundSchema } from './component';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  canvasWidth: z.number().int().min(320).max(7680).default(1920),
  canvasHeight: z.number().int().min(240).max(4320).default(1080),
  background: BackgroundSchema.default({ type: 'color', value: '#0d1117' }),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  isTemplate: z.boolean().default(false),
  thumbnail: z.string().url().nullable().default(null),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = ProjectSchema.pick({
  name: true,
  description: true,
  canvasWidth: true,
  canvasHeight: true,
}).partial({ description: true, canvasWidth: true, canvasHeight: true });

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

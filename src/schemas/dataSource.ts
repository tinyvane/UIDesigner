import { z } from 'zod';

export const DataSourceTypeEnum = z.enum(['static', 'api', 'websocket']);

export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: DataSourceTypeEnum,
  config: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('static'),
      data: z.any(),
    }),
    z.object({
      type: z.literal('api'),
      url: z.string().url(),
      method: z.enum(['GET', 'POST']).default('GET'),
      headers: z.record(z.string(), z.string()).optional(),
      params: z.record(z.string(), z.string()).optional(),
      body: z.any().optional(),
      pollInterval: z.number().min(5000).optional(), // min 5 seconds
    }),
    z.object({
      type: z.literal('websocket'),
      url: z.string().url(),
      messageFilter: z.string().optional(),
    }),
  ]),
  transform: z.string().nullable().default(null), // JSONPath or JS expression
});

export type DataSource = z.infer<typeof DataSourceSchema>;

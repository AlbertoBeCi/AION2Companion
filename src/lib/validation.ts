import { z } from 'zod';

export const characterInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  region: z.enum(['global', 'korea', 'taiwan', 'unknown']),
  server: z.string().trim().max(60),
  className: z.string().trim().max(40),
});

export const trackerInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200),
  category: z.string().trim().min(1).max(40),
  limit: z.coerce.number().int().min(1).max(999),
  scope: z.enum(['account', 'server', 'character']),
  frequency: z.enum(['none', 'daily', 'weekly']),
  resetTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  resetWeekday: z.coerce.number().int().min(0).max(6),
  resetTimeZone: z.string().optional(),
  region: z.enum(['global', 'korea', 'taiwan', 'unknown']),
});

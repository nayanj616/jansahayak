import { z } from 'zod';

export const demoRoleSchema = z.enum(['citizen', 'worker', 'officer']);

export const setRoleRequestSchema = z.object({
  role: demoRoleSchema,
  redirectUrl: z.string().optional(),
});

export type SetRoleRequest = z.infer<typeof setRoleRequestSchema>;


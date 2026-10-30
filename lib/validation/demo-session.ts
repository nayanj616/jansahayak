import { z } from 'zod';

export const demoRoleSchema = z.enum(['citizen', 'worker', 'officer']);

export const setRoleRequestSchema = z.object({
  role: demoRoleSchema,
  redirectUrl: z
    .string()
    .optional()
    .refine(
      (url) => !url || (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')),
      { message: 'redirectUrl must be a safe relative path' }
    ),
});

export type SetRoleRequest = z.infer<typeof setRoleRequestSchema>;

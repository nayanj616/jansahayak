import { z } from 'zod';

export const startTaskSchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID format'),
});

export const completeTaskSchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID format'),
  remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional().nullable(),
});

export type StartTaskInput = z.infer<typeof startTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;


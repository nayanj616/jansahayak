import { z } from 'zod';

export const complaintCategorySchema = z.enum([
  'garbage_dump',
  'overflowing_bin',
  'drain_blockage',
  'dead_animal',
  'construction_debris',
  'open_defecation',
  'sweeping_needed',
  'street_cleaning',
  'water_logging',
  'sewage_overflow',
  'solid_waste',
  'other',
]);

export const complaintPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export const complaintStatusSchema = z.enum([
  'submitted',
  'assigned',
  'in_progress',
  'under_review',
  'rework_required',
  'resolved',
  'rejected',
]);

export const assignmentStatusSchema = z.enum([
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]);

export const humanReviewStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'rework_required',
]);

export const locationSourceSchema = z.enum(['gps', 'manual', 'map_pin']);

/**
 * Zod schema for Citizen complaint submission
 */
export const createComplaintSchema = z.object({
  category: complaintCategorySchema,
  priority: complaintPrioritySchema.default('normal'),
  ward_id: z.string().min(1, 'Ward selection is required'),
  description: z.string().max(2000).optional().nullable(),
  location_description: z.string().max(500).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  location_accuracy_m: z.number().nonnegative().optional().nullable(),
  location_source: locationSourceSchema.default('manual'),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

/**
 * Zod schema for Officer assigning task to Sanitation Worker
 */
export const assignComplaintSchema = z.object({
  complaint_id: z.string().uuid('Invalid complaint ID format'),
  worker_id: z.string().uuid('Invalid worker ID format'),
  notes: z.string().max(1000).optional().nullable(),
});

export type AssignComplaintInput = z.infer<typeof assignComplaintSchema>;

/**
 * Zod schema for updating complaint lifecycle status
 */
export const updateComplaintStatusSchema = z.object({
  complaint_id: z.string().uuid('Invalid complaint ID format'),
  new_status: complaintStatusSchema,
  action: z.string().min(1, 'Action description is required'),
  remarks: z.string().max(1000).optional().nullable(),
});

export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusSchema>;

/**
 * Zod schema for Officer reviewing AI verification
 */
export const reviewVerificationSchema = z.object({
  verification_id: z.string().uuid('Invalid verification ID format'),
  complaint_id: z.string().uuid('Invalid complaint ID format'),
  human_review_status: z.enum(['approved', 'rejected', 'rework_required']),
  review_remarks: z.string().max(1000).optional().nullable(),
});

export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;


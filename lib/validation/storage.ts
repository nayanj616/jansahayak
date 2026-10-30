import { z } from 'zod';

export const ALLOWED_STORAGE_BUCKETS = [
  'complaint-originals',
  'cleanup-evidence',
  'ai-annotated',
  'verification-comparisons',
] as const;

export const ALLOWED_IMAGE_TYPES = [
  'before',
  'after',
  'annotated',
  'comparison',
  'original',
] as const;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export const storageBucketSchema = z.enum(ALLOWED_STORAGE_BUCKETS);
export const imageTypeSchema = z.enum(ALLOWED_IMAGE_TYPES);
export const mimeTypeSchema = z.enum(ALLOWED_MIME_TYPES);

export const uploadMetadataSchema = z.object({
  complaint_id: z.string().uuid('Invalid complaint ID format'),
  bucket_name: storageBucketSchema,
  image_type: imageTypeSchema,
  file_name: z.string().min(1, 'File name is required'),
  content_type: mimeTypeSchema,
  file_size_bytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, 'File size exceeds maximum allowed 8MB'),
});

export type UploadMetadataInput = z.infer<typeof uploadMetadataSchema>;

export const signedUrlRequestSchema = z.object({
  bucket_name: storageBucketSchema,
  object_path: z.string().min(1, 'Object path is required'),
  expires_in_seconds: z.number().int().min(60).max(86400).default(3600),
});

export type SignedUrlRequestInput = z.infer<typeof signedUrlRequestSchema>;


import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createComplaintSchema,
  assignComplaintSchema,
  updateComplaintStatusSchema,
  reviewVerificationSchema,
} from '../lib/validation/complaints';
import {
  uploadMetadataSchema,
  signedUrlRequestSchema,
  MAX_FILE_SIZE_BYTES,
} from '../lib/validation/storage';

test('Validation: accepts valid complaint submission payload', () => {
  const valid = createComplaintSchema.safeParse({
    category: 'garbage_dump',
    ward_id: 'GWL-W-001',
    description: 'Roadside garbage accumulation near Bada',
    location_description: 'Near Maharaj Bada Post Office',
    latitude: 26.2183,
    longitude: 78.1828,
  });

  assert.ok(valid.success);
  if (valid.success) {
    assert.strictEqual(valid.data.priority, 'normal'); // Default applied
  }
});

test('Validation: rejects complaint submission missing ward_id', () => {
  const invalid = createComplaintSchema.safeParse({
    category: 'garbage_dump',
    ward_id: '',
  });

  assert.strictEqual(invalid.success, false);
});

test('Validation: rejects invalid complaint category', () => {
  const invalid = createComplaintSchema.safeParse({
    category: 'non_existent_category',
    ward_id: 'GWL-W-001',
  });

  assert.strictEqual(invalid.success, false);
});

test('Validation: accepts valid worker assignment payload', () => {
  const valid = assignComplaintSchema.safeParse({
    complaint_id: '11111111-1111-4111-8111-111111111111',
    worker_id: '22222222-2222-4222-8222-222222222222',
    notes: 'Prioritize morning clearance',
  });

  assert.ok(valid.success);
});

test('Validation: rejects assignment with invalid UUID format', () => {
  const invalid = assignComplaintSchema.safeParse({
    complaint_id: 'invalid-uuid',
    worker_id: 'not-a-uuid',
  });

  assert.strictEqual(invalid.success, false);
});

test('Validation: accepts valid status update and rejection of unapproved status values', () => {
  const valid = updateComplaintStatusSchema.safeParse({
    complaint_id: '11111111-1111-4111-8111-111111111111',
    new_status: 'in_progress',
    action: 'worker_started',
    remarks: 'Dispatched sanitation truck',
  });
  assert.ok(valid.success);

  const invalid = updateComplaintStatusSchema.safeParse({
    complaint_id: '11111111-1111-4111-8111-111111111111',
    new_status: 'arbitrary_status',
    action: 'test',
  });
  assert.strictEqual(invalid.success, false);
});

test('Validation: validates storage upload metadata and enforces 8MB limit', () => {
  const valid = uploadMetadataSchema.safeParse({
    complaint_id: '11111111-1111-4111-8111-111111111111',
    bucket_name: 'complaint-originals',
    image_type: 'before',
    file_name: 'test.jpg',
    content_type: 'image/jpeg',
    file_size_bytes: 2 * 1024 * 1024,
  });
  assert.ok(valid.success);

  // Oversized file
  const oversized = uploadMetadataSchema.safeParse({
    complaint_id: '11111111-1111-4111-8111-111111111111',
    bucket_name: 'complaint-originals',
    image_type: 'before',
    file_name: 'huge.jpg',
    content_type: 'image/jpeg',
    file_size_bytes: MAX_FILE_SIZE_BYTES + 1,
  });
  assert.strictEqual(oversized.success, false);

  // Invalid MIME type
  const badMime = uploadMetadataSchema.safeParse({
    complaint_id: '11111111-1111-4111-8111-111111111111',
    bucket_name: 'complaint-originals',
    image_type: 'before',
    file_name: 'script.exe',
    content_type: 'application/x-msdownload',
    file_size_bytes: 1024,
  });
  assert.strictEqual(badMime.success, false);
});

test('Validation: accepts valid officer review and signed URL request payloads', () => {
  const validReview = reviewVerificationSchema.safeParse({
    verification_id: '11111111-1111-4111-8111-111111111111',
    complaint_id: '22222222-2222-4222-8222-222222222222',
    human_review_status: 'approved',
    review_remarks: 'Site verified clean by municipal supervisor',
  });
  assert.ok(validReview.success);

  const validSignedUrl = signedUrlRequestSchema.safeParse({
    bucket_name: 'complaint-originals',
    object_path: 'c123/before_photo.jpg',
    expires_in_seconds: 1800,
  });
  assert.ok(validSignedUrl.success);
});

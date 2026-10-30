import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFileBuffer,
  generateObjectPath,
} from '../lib/storage';
import { MAX_FILE_SIZE_BYTES } from '../lib/validation/storage';

test('Storage Helper: validateFileBuffer approves valid images within 8MB limit', () => {
  const dummyBuffer = Buffer.alloc(1024 * 50); // 50 KB

  const jpegResult = validateFileBuffer(dummyBuffer, 'image/jpeg');
  assert.strictEqual(jpegResult.valid, true);

  const pngResult = validateFileBuffer(dummyBuffer, 'image/png');
  assert.strictEqual(pngResult.valid, true);

  const webpResult = validateFileBuffer(dummyBuffer, 'image/webp');
  assert.strictEqual(webpResult.valid, true);
});

test('Storage Helper: validateFileBuffer rejects unsupported MIME types', () => {
  const dummyBuffer = Buffer.alloc(1024);

  const pdfResult = validateFileBuffer(dummyBuffer, 'application/pdf');
  assert.strictEqual(pdfResult.valid, false);
  assert.ok(pdfResult.error?.includes('Invalid content type'));

  const gifResult = validateFileBuffer(dummyBuffer, 'image/gif');
  assert.strictEqual(gifResult.valid, false);
});

test('Storage Helper: validateFileBuffer rejects buffers exceeding MAX_FILE_SIZE_BYTES', () => {
  const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);

  const result = validateFileBuffer(oversizedBuffer, 'image/jpeg');
  assert.strictEqual(result.valid, false);
  assert.ok(result.error?.includes('exceeds maximum allowed limit'));
});

test('Storage Helper: generateObjectPath produces clean paths with complaint_id and timestamp', () => {
  const complaintId = 'c1234567-89ab-cdef-0123-456789abcdef';
  const path = generateObjectPath(complaintId, 'before', 'my_photo.PNG');

  assert.ok(path.startsWith(`${complaintId}/before_`));
  assert.ok(path.endsWith('.png'));
});


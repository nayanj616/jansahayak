# JanSahayak API Reference Documentation

> **Academic Demonstration Project**
> Source of Truth: Implemented Next.js App Router Route Handlers (`app/api/*`)

---

## 1. Authentication & API Protection Overview

All API endpoints enforce server-side demonstration session authorization.

- **Cookie:** `jansahayak_demo_session` (Signed JWT, `HttpOnly`, `SameSite=Lax`).
- **Guards:**
  - `requireApiSession(request)`: Enforces an active, unexpired session token. Returns `401 Unauthorized` if missing or invalid.
  - `requireApiRole(requiredRole, request)`: Enforces a specific user role (`citizen`, `worker`, `officer`). Returns `403 Forbidden` if role mismatch.

---

## 2. API Routes Reference

### 2.1. `/api/demo-session`

Handles the initialization, inspection, and clearing of signed demonstration session cookies.

#### `GET /api/demo-session`
Returns the currently verified session payload.

- **Authorization:** Public (reads optional cookie).
- **Success Response (`200 OK`):**
  ```json
  {
    "active": true,
    "session": {
      "user": {
        "role": "citizen",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@example.invalid",
        "designation": "Resident Citizen",
        "ward": "Ward 24 - Lashkar Central",
        "zone": "Zone 4",
        "avatarInitials": "AS",
        "dbUserId": "00000000-0000-0000-0000-000000000001"
      },
      "issuedAt": 1730380000,
      "expiresAt": 1730387200
    }
  }
  ```

#### `POST /api/demo-session`
Generates a signed JWT cookie for the selected role.

- **Authorization:** Public.
- **Request Body (`application/json`):**
  ```json
  {
    "role": "citizen",
    "redirectUrl": "/citizen"
  }
  ```
- **Validation Rules:**
  - `role`: Must be one of `"citizen"`, `"worker"`, `"officer"`.
  - `redirectUrl`: Optional relative path (must start with `/`, rejects external URLs).
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Demonstration role set to citizen",
    "role": "citizen",
    "user": { ... },
    "redirectTo": "/citizen"
  }
  ```
  *(Sets `Set-Cookie: jansahayak_demo_session=...; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200`)*

#### `DELETE /api/demo-session`
Clears the demonstration session cookie.

- **Authorization:** Public.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Demonstration session cleared"
  }
  ```

---

### 2.2. `/api/complaints`

Handles grievance retrieval and citizen complaint submission.

#### `GET /api/complaints`
Retrieves complaints with joined ward details, images, assignments, and lifecycle audit history.

- **Authorization:** Requires authenticated session (`requireApiSession`).
- **Scoping & RBAC:**
  - **Citizen:** Strictly scoped to the citizen's own complaints (`reporter_id = dbUserId`). Cannot view other citizens' complaints.
  - **Officer:** Can view all complaints across Gwalior, or filter by `reporter_id`, `ward_id`, `status`, or `category`.
  - **Worker:** Rejected with `403 Forbidden` (workers access tasks via `/api/tasks`).
- **Query Parameters:**
  - `ward_id` (string, optional): Filter by ward ID (e.g. `GWL-W-024`).
  - `status` (string, optional): Filter by complaint status (e.g. `submitted`, `in_progress`, `under_review`).
  - `category` (string, optional): Filter by sanitation category (e.g. `overflowing_bin`, `garbage_dump`).
  - `reporter_id` (string, optional, Officer only): Filter by reporter UUID.
  - `with_signed_urls` (boolean, optional, default `false` for officer): When true, generates time-limited signed URLs for all complaints in batch.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "count": 1,
    "complaints": [
      {
        "id": "c1111111-1111-1111-1111-111111111111",
        "complaint_code": "GWL-2026-0001",
        "reporter_id": "00000000-0000-0000-0000-000000000001",
        "ward_id": "GWL-W-024",
        "category": "garbage_dump",
        "priority": "normal",
        "status": "submitted",
        "description": "Overflowing bin on street corner",
        "location_desc": "Near Post Office, Sarafa Bazaar",
        "latitude": 26.2183,
        "longitude": 78.1828,
        "location_accuracy_m": 12.5,
        "location_source": "gps",
        "created_at": "2026-10-31T10:00:00.000Z",
        "ward": {
          "ward_id": "GWL-W-024",
          "ward_no": 24,
          "ward_name": "Maharaj Bada / Lashkar",
          "sanitation_zone": "Zone 4 - Lashkar Central"
        },
        "images": [
          {
            "id": "i1111111-1111-1111-1111-111111111111",
            "image_type": "original",
            "bucket_id": "complaint-originals",
            "storage_path": "c111.../173038..._photo.jpg",
            "signed_url": "https://...supabase.co/storage/v1/object/sign/complaint-originals/..."
          }
        ],
        "history": [
          {
            "id": "h1111111-1111-1111-1111-111111111111",
            "action": "submitted",
            "actor_role": "citizen",
            "new_status": "submitted",
            "remarks": "Initial citizen complaint filed",
            "created_at": "2026-10-31T10:00:00.000Z"
          }
        ]
      }
    ]
  }
  ```

---

#### `GET /api/complaints/[id]`
Retrieves a single complaint by UUID with full joined relations and fresh private signed URLs.

- **Authorization:** Requires authenticated session (`requireApiSession`).
- **Scoping & RBAC:**
  - **Citizen:** Authorized only if `complaint.reporter_id === session.dbUserId`.
  - **Officer:** Authorized for all city complaints.
  - **Worker:** Rejected with `403 Forbidden`.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "complaint": {
      "id": "c1111111-1111-1111-1111-111111111111",
      "complaint_code": "GWL-2026-0001",
      "status": "under_review",
      "category": "overflowing_bin",
      "location_description": "Near Post Office, Sarafa Bazaar",
      "ward": { "ward_no": 24, "ward_name": "Maharaj Bada / Lashkar" },
      "images": [
        {
          "id": "i1...",
          "image_type": "before",
          "bucket_name": "complaint-originals",
          "signed_url": "https://..."
        },
        {
          "id": "i2...",
          "image_type": "after",
          "bucket_name": "cleanup-evidence",
          "signed_url": "https://..."
        }
      ],
      "current_or_latest_assignment": {
        "id": "a1...",
        "status": "completed",
        "worker": { "display_name": "Rajesh Kumar" }
      },
      "active_assignment": {
        "id": "a1...",
        "status": "completed",
        "worker": { "display_name": "Rajesh Kumar" }
      },
      "history": [...]
    }
  }
  ```

---

#### `POST /api/complaints/review`
Executes Municipal Officer review decisions on complaints in `under_review` status.

- **Authorization:** Requires `officer` role (`requireApiRole('officer')`).
- **Request Format:** `application/json`
- **Fields:**
  | Field | Type | Required | Constraints |
  | :--- | :--- | :--- | :--- |
  | `complaint_id` | `UUID` | **Yes** | Valid complaint UUID |
  | `action` | `string` | **Yes** | `'approve'`, `'rework'`, or `'reject'` |
  | `remarks` | `string` | **Yes** | 1 to 1000 characters (Mandatory audit remarks) |
- **Actions & Transitions:**
  - `action: 'approve'` -> transitions complaint to `resolved` (History: `officer_approved`).
  - `action: 'rework'` -> transitions complaint to `rework_required` (History: `officer_rework_requested`).
  - `action: 'reject'` -> transitions complaint to `rejected` (History: `officer_rejected`).
- **Audit & Notification Delivery:**
  - Logs officer UUID, action, and evaluation remarks to `complaint_history`.
  - Updates `human_review_status`, `reviewed_by`, `review_remarks`, `reviewed_at` on `ai_verifications` if a record exists.
  - Creates in-app alerts in `notifications` for citizen (`resolved`, `rejected`) or worker (`rework_required`).
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Complaint GWL-2026-0001 successfully approved and marked resolved.",
    "action": "approve",
    "complaint": { ... },
    "notificationSent": true
  }
  ```
---

#### `POST /api/complaints/[id]/verify`
Triggers on-demand multimodal AI cleanliness verification on citizen before photos and worker after photos using Google Gemini Vision (`gemini-3.8-flash`).

- **Authorization:** Requires `officer` role (`requireApiRole('officer')`).
- **Path Parameters:**
  - `id` (`UUID`): Complaint UUID to verify.
- **Request Format:** `application/json` (optional request body)
- **Request Fields:**
  | Field | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `force_recheck` | `boolean` | No | `false` | When `false`, returns cached verification findings if an analysis already exists for the identical image pair. When `true`, initiates a fresh Gemini Vision analysis and appends a new record to `ai_verifications`. |
- **Preconditions & Validation:**
  - Caller must possess an active `officer` session cookie (returns `401 Unauthorized` or `403 Forbidden`).
  - `id` must be a valid UUID format (`400 Bad Request`).
  - Complaint must exist (`404 Not Found`).
  - Complaint status must be `under_review` (`400 Bad Request`). Verification is rejected for any other status.
  - Complaint must have both a citizen initial photo (`image_type: 'before'` or `'original'`) and a worker evidence photo (`image_type: 'after'`) (`400 Bad Request`).
  - Both photos must belong to the requested complaint (`400 Bad Request`).
  - Both photos must have supported MIME types (`image/jpeg`, `image/png`, `image/webp`) and must not exceed 8 MB (`400 Bad Request`).
- **Execution & Idempotency Flow:**
  1. Inspects `ai_verifications` for the latest record matching `(complaint_id, before_image_id, after_image_id)`.
  2. If an existing verification is in `processing_status: 'pending'`, returns `409 Conflict`.
  3. If an existing verification is in `processing_status: 'completed'` and `force_recheck` is `false`, returns cached result immediately (`200 OK`, `cached: true`).
  4. Otherwise, inserts a new pending row into `ai_verifications` (`processing_status: 'pending'`, `model_name: 'gemini-3.8-flash'`, `model_version: 'v1.0.0-20261101'`).
  5. Downloads binary image buffers server-side from private Supabase Storage buckets (`complaint-originals`, `cleanup-evidence`).
  6. Sends inline image buffers to Google Gemini Vision over HTTPS with structured observational schema (`VisionVerificationMetrics`).
  7. On success, updates record to `processing_status: 'completed'`, stores structured findings in `metrics`, records `waste_reduction_percentage`, and returns `200 OK` (`cached: false`).
  8. On storage retrieval failure or upstream Gemini failure, updates record to `processing_status: 'failed'` with sanitized error message in `processing_error` and returns `502 Bad Gateway`.
- **Advisory Contract & Governance:**
  AI findings are purely observational and advisory. Verification execution **never** updates `complaints.status` or `assignments.status`. The complaint remains in `under_review` until the municipal officer makes an authoritative review decision via `POST /api/complaints/review`.
- **Success Response (`200 OK` — Fresh Analysis):**
  ```json
  {
    "success": true,
    "verification": {
      "id": "v1111111-1111-1111-1111-111111111111",
      "complaint_id": "c1111111-1111-1111-1111-111111111111",
      "before_image_id": "i1111111-1111-1111-1111-111111111111",
      "after_image_id": "i2222222-2222-2222-2222-222222222222",
      "processing_status": "completed",
      "model_name": "gemini-3.8-flash",
      "model_version": "v1.0.0-20261101",
      "metrics": {
        "beforeObservations": {
          "wasteIdentified": ["municipal solid waste", "plastic debris"],
          "approximateSpread": "heaped along roadside curb",
          "obstructionsOrHazards": []
        },
        "afterObservations": {
          "visibleSurfaces": ["asphalt road", "stone curb"],
          "remainingDebris": [],
          "cleanlinessApparent": true
        },
        "comparativeFindings": {
          "primaryWasteRemoved": true,
          "siteConsistent": true,
          "changesObserved": ["waste mound removed", "surface cleared"]
        },
        "comparisonLimitations": {
          "angleMismatched": false,
          "lightingMismatched": false,
          "occlusionPresent": false,
          "limitationNotes": []
        },
        "evaluation": {
          "confidenceLevel": "high",
          "isComparisonReliable": true,
          "wasteReductionEstimate": 95,
          "estimateRationale": "Visual evidence shows near-complete clearance of previously identified waste."
        },
        "officerSummary": "Visual evidence indicates substantial waste removal from the reported location.",
        "disclaimer": "This analysis is an advisory visual observation produced by automated AI and does not constitute an administrative decision."
      },
      "waste_reduction_percentage": 95,
      "processing_error": null,
      "processed_at": "2026-11-01T15:30:00.000Z",
      "human_review_status": "pending",
      "reviewed_by": null,
      "review_remarks": null,
      "reviewed_at": null,
      "created_at": "2026-11-01T15:30:00.000Z",
      "updated_at": "2026-11-01T15:30:03.000Z"
    },
    "cached": false,
    "message": "Visual verification completed successfully."
  }
  ```
- **Cached Response (`200 OK`):**
  ```json
  {
    "success": true,
    "verification": { ... },
    "cached": true,
    "message": "Returned existing cached verification findings for this image pair."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid UUID format, complaint not in `under_review`, missing before/after photo, unsupported MIME type, or file size exceeding 8 MB.
  - `401 Unauthorized`: Missing demo session cookie.
  - `403 Forbidden`: Non-officer role attempting verification.
  - `404 Not Found`: Complaint UUID does not exist.
  - `409 Conflict`: Verification currently in progress for this image pair (`{ "error": "Verification in progress", "pending": true }`).
  - `502 Bad Gateway`: Storage retrieval failure or Gemini Vision API failure (`{ "error": "Vision verification failed", "message": "...", "verification": { "processing_status": "failed", ... } }`).
  - `500 Internal Server Error`: Unexpected unhandled error.

---

#### `POST /api/complaints`
Submits a new citizen sanitation grievance with original photograph.

- **Authorization:** Requires `citizen` role (`requireApiRole('citizen')`).
- **Request Format:** `multipart/form-data`
- **Fields:**
  | Field | Type | Required | Constraints |
  | :--- | :--- | :--- | :--- |
  | `image` | `File` | **Yes** | JPEG, PNG, or WebP; max 8 MB |
  | `category` | `string` | **Yes** | Valid category enum (e.g., `garbage_dump`, `overflowing_bin`) |
  | `ward_id` | `string` | **Yes** | Valid ward ID in `wards` table |
  | `description` | `string` | No | Max 2000 chars |
  | `location_description` | `string` | No | Max 500 chars |
  | `priority` | `string` | No | Default `normal` (`low`, `normal`, `urgent`, `critical`) |
  | `latitude` | `number` | No | Between -90 and 90 |
  | `longitude` | `number` | No | Between -180 and 180 |
  | `location_accuracy_m` | `number` | No | >= 0 |
  | `location_source` | `string` | No | `gps` or `manual` |
- **Execution Lifecycle:**
  1. Zod schema validation.
  2. Image buffer validation (MIME type check and 8 MB ceiling).
  3. Inserts complaint record into `complaints` with generated code (`GWL-YYYY-XXXX`).
  4. Uploads image to private bucket `complaint-originals`.
  5. Inserts image metadata into `complaint_images`.
  6. Records initial `submitted` history event in `complaint_history`.
  7. **Compensating Rollback:** If storage upload or metadata insert fails, database complaint is deleted to prevent partial state.
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Complaint GWL-2026-0001 submitted successfully",
    "complaint": { ... }
  }
  ```

---

### 2.3. `/api/tasks`

Handles sanitation worker assignment retrieval and field task execution.

#### `GET /api/tasks`
Retrieves assigned tasks for the authenticated sanitation worker.

- **Authorization:** Requires `worker` role (`requireApiRole('worker')`).
- **Scoping:** Strictly scoped to the worker's `dbUserId`. Cross-worker task access is prohibited.
- **Query Parameters:**
  - `status` (string, optional): Filter by `assigned`, `in_progress`, `completed`, `cancelled`.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "count": 1,
    "tasks": [
      {
        "id": "a1111111-1111-1111-1111-111111111111",
        "complaint_id": "c1111111-1111-1111-1111-111111111111",
        "worker_id": "00000000-0000-0000-0000-000000000002",
        "status": "assigned",
        "priority": "normal",
        "instructions": "Clear overflowing community bin",
        "assigned_at": "2026-10-31T11:00:00.000Z",
        "complaint": {
          "complaint_code": "GWL-2026-0001",
          "category": "overflowing_bin",
          "status": "assigned",
          "location_desc": "Near Post Office, Sarafa Bazaar",
          "ward": {
            "ward_name": "Maharaj Bada / Lashkar"
          },
          "original_image": {
            "signed_url": "https://..."
          }
        }
      }
    ]
  }
  ```

#### `POST /api/tasks`
Executes worker actions on assigned tasks.

- **Authorization:** Requires `worker` role (`requireApiRole('worker')`).
- **Request Formats:**
  - `application/json` (supported for `action: 'start'`)
  - `multipart/form-data` (supported for both `start` and `complete`)

##### Action: `start`
Marks task execution underway.
- **Payload:**
  ```json
  {
    "action": "start",
    "assignment_id": "a1111111-1111-1111-1111-111111111111"
  }
  ```
- **State Transition:**
  - Assignment: `assigned` -> `in_progress` (`started_at` timestamp recorded).
  - Complaint: `assigned` -> `in_progress`.
  - History: Event `task_started` logged.

##### Action: `complete`
Uploads after-cleanup photo proof and completes the assignment.
- **Payload (`multipart/form-data`):**
  - `action`: `"complete"`
  - `assignment_id`: UUID
  - `image`: File (JPEG, PNG, WebP; max 8 MB; required)
  - `remarks`: string (max 500 chars; optional)
- **State Transition:**
  - File uploaded to private bucket `cleanup-evidence`.
  - Image row inserted into `complaint_images` (`image_type: 'evidence'`).
  - Assignment: `in_progress` -> `completed` (`completed_at` timestamp recorded).
  - Complaint: `in_progress` -> `under_review` (ready for officer evaluation).
  - History: Event `cleanup_completed` logged with remarks.
  - **Compensating Rollback:** If state update fails, uploaded evidence image is removed from storage.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Cleanup completed successfully and submitted for officer review",
    "task": { ... }
  }
  ```

---

### 2.4. `/api/assignments`

Handles worker task allocation and reassignment by Municipal Officers.

#### `POST /api/assignments`
Dispatches or reassigns a sanitation complaint to a field worker.

- **Authorization:** Requires `officer` role (`requireApiRole('officer')`).
- **Request Format:** `application/json`
- **Fields:**
  | Field | Type | Required | Constraints |
  | :--- | :--- | :--- | :--- |
  | `complaint_id` | `UUID` | **Yes** | Valid complaint UUID |
  | `worker_id` | `UUID` | **Yes** | Valid worker UUID in `demo_users` (`role = worker`) |
  | `notes` | `string` | No | Max 1000 chars (Operational dispatch instructions) |
- **Execution & Safeguards:**
  1. Validates complaint status is in `['submitted', 'assigned', 'rework_required']`. Rejects terminal or active review states.
  2. Cancels prior active assignments (`assigned`, `in_progress`) to prevent duplicate active tasks.
  3. Inserts new assignment with `assigned` status.
  4. Updates complaint status to `assigned` and logs dispatch notes in `complaint_history.remarks`.
  5. Dispatches in-app task notification to the assigned worker.
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Task successfully dispatched to sanitation worker Rajesh Kumar.",
    "assignment": { ... },
    "complaint": { ... },
    "notificationSent": true
  }
  ```

---

### 2.5. `/api/assignments/workers`

#### `GET /api/assignments/workers`
Retrieves all active field sanitation workers available for task allocation.

- **Authorization:** Requires `officer` role (`requireApiRole('officer')`).
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "count": 1,
    "workers": [
      {
        "id": "b0000000-0000-4000-8000-000000000002",
        "display_name": "Sanitation Worker Demo",
        "role": "worker",
        "ward_id": "GWL-W-012",
        "is_active": true
      }
    ]
  }
  ```

---

### 2.6. `/api/assistant`

Handles citizen conversational queries regarding central and Madhya Pradesh government welfare schemes using server-side deterministic retrieval and source-grounded Google Gemini responses (`gemini-3.8-flash`).

#### `POST /api/assistant`
Submits a citizen inquiry to the Civic Assistant RAG engine.

- **Authorization:** Public endpoint (protected by in-memory rate limiting).
- **Request Format:** `application/json`
- **Fields:**
  | Field | Type | Required | Constraints |
  | :--- | :--- | :--- | :--- |
  | `question` | `string` | **Yes** | 2 to 500 characters (trimmed) |
  | `context` | `string` | No | Max 1000 characters |
- **Rate Limiting & Proxy Trust:**
  - Sliding-window limit of 10 requests per minute per IP.
  - Returns `429 Too Many Requests` when limit is exceeded, including `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers.
  - Forwarded headers (`x-forwarded-for`, `x-real-ip`) are trusted only when `TRUSTED_PROXY='true'` is set in the deployment environment. In untrusted environments, requests fall back to a conservative shared bucket (`'untrusted-fallback'`) to prevent header spoofing attacks.
- **Service Configuration Check:**
  - If `GEMINI_CHATBOT_API_KEY` is unset or placeholder, returns `503 Service Unavailable` (`{ "error": "Civic Assistant is currently unconfigured...", "isConfigured": false }`).
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "answer": "Mukhyamantri Ladli Behna Yojana provides financial assistance of ₹1,250 per month to eligible women in Madhya Pradesh...",
      "language": "en",
      "retrievedSchemes": ["ladli_behna"],
      "evidenceSufficiency": "sufficient",
      "sources": [
        {
          "sourceId": "mp-ladli-behna",
          "title": "Mukhyamantri Ladli Behna Yojana Guidelines",
          "issuingAuthority": "Women and Child Development Department, Government of Madhya Pradesh",
          "url": "https://cmladlibehna.mp.gov.in"
        }
      ],
      "disclaimer": "This information is derived from official government scheme guidelines and is provided for civic guidance only."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Question shorter than 2 characters, longer than 500 characters, or invalid JSON payload.
  - `429 Too Many Requests`: Exceeded 10 requests per minute (`{ "error": "Rate limit exceeded...", "retryAfterSeconds": 45 }`).
  - `503 Service Unavailable`: Chatbot API key unconfigured.
  - `500 Internal Server Error`: Upstream processing or provider error (internal credentials sanitized).

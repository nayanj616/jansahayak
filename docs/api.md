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

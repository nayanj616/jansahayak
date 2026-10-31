# JanSahayak Implementation Roadmap & Status

> **Academic Demonstration Project**
> Integrated Civic Assistance Platform — Gwalior, Madhya Pradesh

---

## 1. Implementation Phase Breakdown

```mermaid
flowchart LR
    P1["Phase 1<br/>Foundation & UI"] --> P1AB["Phase 1A & 1B<br/>DB & Storage"]
    P1AB --> P2["Phase 2<br/>Citizen Workflow"]
    P2 --> P3["Phase 3 & 3.1<br/>Worker Workflow"]
    P3 --> P32["Phase 3.2<br/>Hygiene & Docs"]
    P32 --> P4A["Phase 4A<br/>Officer Workflow<br/>(Completed)"]
    P4A -.-> P4B["Phase 4B<br/>Gemini AI<br/>(Pending)"]
```

---

## 2. Phase-by-Phase Implementation Status

### Phase 1: Modern Application Foundation & Public Architecture
**Status:** **COMPLETED**
- Modern Next.js 16 (App Router), React 19, TypeScript strict mode architecture.
- Tailwind CSS v4 styling with custom tokens and shadcn/ui component library.
- Public portals: Landing page, Swachh Gwalior portal, Scheme Exploration portal, About page, and Choose Demo Role portal.
- Cryptographic server-side demonstration session authorization using `jose` JWT cookies (`jansahayak_demo_session`).
- Visual assets: Gwalior Fort silhouette artwork, Gwalior monument logo, responsive Leaflet OpenStreetMap viewer.

---

### Phase 1A: Database & Data-Access Foundation
**Status:** **COMPLETED**
- Comprehensive inspection and mapping of the live Supabase PostgreSQL schema.
- Typed mappings for all 8 database tables in `types/database.ts`.
- Server-side data-access layer in `lib/db/` using the administrative Supabase client (`import 'server-only'`).
- Deterministic demo user resolution in `lib/db/users.ts`.
- Zod validation schemas for all domain entities in `lib/validation/`.
- Reusable API session and role guards in `lib/auth/api-guards.ts`.

---

### Phase 1B: Storage Foundation
**Status:** **COMPLETED**
- Verified the four private Supabase Storage buckets: `complaint-originals`, `cleanup-evidence`, `ai-annotated`, `verification-comparisons`.
- Server-side image upload and signed URL generation in `lib/storage/index.ts`.
- Strict image validation: MIME type enforcement (`image/jpeg`, `image/png`, `image/webp`) and 8 MB file size ceiling.
- Compensating rollback handlers to delete orphaned storage objects upon database insert failures.

---

### Phase 2: Citizen Complaint Workflow
**Status:** **COMPLETED**
- Functional citizen complaint submission form in `components/dashboards/citizen-view.tsx`.
- Photo evidence upload, ward selection (59 provisional wards), category selection, landmark descriptions, and GPS acquisition.
- Protected endpoint `POST /api/complaints` handling multi-part uploads with transactional rollback integrity.
- Protected endpoint `GET /api/complaints` with strict citizen ownership scoping (citizens see only their own complaints).
- Live complaint list with fresh signed image URLs, status badges, and expandable lifecycle timeline modal (`complaint_history`).

---

### Phase 3: Sanitation Worker Workflow
**Status:** **COMPLETED**
- Functional sanitation worker task dashboard in `components/dashboards/worker-view.tsx`.
- Protected endpoint `GET /api/tasks` returning worker assignments scoped to the worker's `dbUserId`.
- Task action `start`: Transitions assignment to `in_progress` and complaint to `in_progress`.
- Task action `complete`: Uploads after-cleanup evidence photograph to private bucket `cleanup-evidence`, marks assignment `completed`, and moves complaint to `under_review`.
- Full-screen before/after photo inspection modal with signed private URLs.

---

### Phase 3.1: Assignment Integrity & E2E Test Isolation
**Status:** **COMPLETED**
- Enforced strict pre-insertion status validation in `createAssignment()`: permits assignment only from `submitted`, `assigned` (reassignment), and `rework_required`.
- Rejects assignment from terminal states (`resolved`, `rejected`) and active states (`under_review`, `in_progress`).
- Added compensating rollback deleting inserted assignments if complaint status updates fail.
- Isolated E2E worker test suite (`scripts/test_e2e_worker.ts`) to create dedicated test complaints without mutating live or completed records.

---

### Phase 3.2: Repository Hygiene, Documentation & Alignment
**Status:** **COMPLETED**
- Removed unused dependencies (`@hookform/resolvers`, `react-hook-form`, `react-leaflet`).
- Purged unused template SVGs from `public/`.
- Strengthened `.gitignore` covering bytecode, test logs, coverage, and environment secret files.
- Aligned UI copy and descriptions across the Homepage, About page, Swachh Gwalior portal, Scheme Exploration portal, Officer Dashboard, and complaint chart.
- Created full documentation suite in `docs/` (`architecture.md`, `database.md`, `api.md`, `roadmap.md`) and updated root `README.md`.
- Verified test suite: 63/63 Node/TS tests passed, 21/21 Python tests passed, 0 ESLint errors, clean production build.

---

### Phase 4A: Municipal Officer Workflow
**Status:** **COMPLETED (Current Phase)**
- Live Municipal Officer dashboard (`components/dashboards/officer-view.tsx`) backed by real Supabase data.
- Server-side prefetching of wards, workers, and complaints with on-demand signed URL generation for evidence photos.
- Filter toolbar supporting multi-criteria filtering across 59 GMC wards, 12 sanitation categories, and complaint lifecycle statuses.
- Protected endpoints:
  - `GET /api/complaints/[id]`: on-demand signed URL generation for detail inspection.
  - `POST /api/assignments`: worker dispatch and reassignment with cancellation safeguards.
  - `GET /api/assignments/workers`: active field sanitation worker listing.
  - `POST /api/complaints/review`: officer quality review actions (`approve` -> `resolved`, `rework` -> `rework_required`, `reject` -> `rejected`).
- State machine enforcement, immutable `complaint_history` audit logging, and in-app alerts in `notifications`.
- PostgREST 1-to-many joined assignment normalization (`normalizeActiveAssignment`).
- Verified test suite: 79/79 Node/TS tests passed, 21/21 Python tests passed, isolated officer E2E script verified (100% pass, zero demo record mutation), 0 ESLint errors, clean production build.

---

### Phase 4B Foundation: Dual-Key Gemini Architecture
**Status:** **COMPLETED**
- Dual independent server-only GoogleGenAI clients (`getChatbotClient`, `getVisionClient`) in `lib/gemini/client.ts`.
- Strict key isolation between `GEMINI_CHATBOT_API_KEY` and `GEMINI_VISION_API_KEY` with zero cross-fallback.
- Independent model configuration via `GEMINI_CHATBOT_MODEL` and `GEMINI_VISION_MODEL`.
- Modular boundaries in `lib/gemini/assistant.ts` and `lib/gemini/vision.ts` with backward-compatible facade in `lib/gemini/service.ts`.
- Comprehensive key isolation and client instantiation unit tests in `tests/gemini-architecture.test.ts`.

---

### Phase 4B.1: Gemini-Powered Civic RAG Assistant
**Status:** **PENDING**
- In-memory structured knowledge base for Gwalior municipal services and Madhya Pradesh welfare schemes.
- Grounded RAG query execution using `getChatbotClient()`.
- Structured JSON output with official sources and disclaimers.
- Citizen-facing interactive chat dialog on Scheme Exploration portal.

---

### Phase 4B.2: Gemini Vision Multimodal Cleanliness Verification
**Status:** **PENDING**
- Multimodal before-and-after image comparison analyzing cleanliness and residual debris using `getVisionClient()`.
- Confidence scoring and qualitative cleanliness rating generation.
- Persistence of analysis results in `ai_verifications` table.
- Officer review dashboard verification badges.

---

## 3. Known Limitations & Academic Demarcation

1. **Academic Demonstration Scope:** JanSahayak is developed as an academic demonstration prototype. It does not possess official integration with the Gwalior Municipal Corporation (GMC) or the Government of Madhya Pradesh.
2. **Provisional Ward Boundaries:** The 59 wards loaded in the database represent provisional reference boundaries. Official municipal GIS shapefiles and verified supervisor rosters will require official municipal coordination.
3. **Demo Session Model:** The authentication model utilizes cryptographic server-signed demonstration cookies rather than real citizen phone numbers or SMS OTP gateways.
4. **Deferred Modules:** The Municipal Officer resolution dashboard and Google Gemini AI verification workflows are staged as design placeholders and will be implemented in Phase 4.

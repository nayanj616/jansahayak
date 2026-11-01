# JanSahayak (जनसहायक) — Integrated Civic Assistance Platform

> **Gwalior, Madhya Pradesh, India**
> *Cleaner cities. Informed citizens. Stronger communities.*

JanSahayak is an academic demonstration project for an integrated civic technology platform designed to bridge the gap between citizens, frontline sanitation workers, and municipal administrators in Gwalior, Madhya Pradesh.

---

## 1. Project Overview & Academic Demarcation

JanSahayak provides a modern TypeScript and Next.js architecture demonstrating two core civic modules:

- **Module A: Swachh Gwalior** — Municipal sanitation grievance reporting, field worker task dispatch and proof upload, and ward-level municipal oversight across Gwalior's municipal sectors.
- **Module B: Scheme Exploration** — Welfare scheme discovery, eligibility guidance, and grievance redressal channels for Madhya Pradesh residents.

> [!IMPORTANT]
> **Academic Demonstration Notice:**
> This platform is an independent academic demonstration prototype created for evaluation. It does not claim official government endorsement, verified real identity, or employment with the Gwalior Municipal Corporation (GMC) or the Government of Madhya Pradesh. Ward reference data covers 59 provisional wards pending official municipal verification.

---

## 2. Currently Implemented Features

### Module A: Swachh Gwalior (Phases 1, 2, 3, 3.1)
- **Citizen Grievance Submission:** Geo-tagged sanitation complaint filing with original photo evidence, category selection, landmark description, and automatic device GPS acquisition.
- **Private Storage Integration:** Original complaint photos and after-cleanup evidence stored in private Supabase Storage buckets, delivered to authorized clients via time-limited signed URLs.
- **Citizen Dashboard:** Real-time personal complaint list with status indicators, signed image previews, and expandable lifecycle timeline audit modals (`complaint_history`).
- **Worker Task Management:** Protected sanitation worker dashboard displaying assigned tasks scoped to the worker's account.
- **Field Cleanup Execution:** Worker task start (`in_progress`) and completion (`under_review`) with mandatory after-cleanup photo evidence upload and remarks.
- **State Machine & Reassignment Integrity:** Enforced status transitions with compensating rollbacks preventing orphaned storage objects or partial database rows.

### Module B: Scheme Exploration & Public Portals
- **Scheme Catalog Browser:** Searchable and category-filtered catalog of Madhya Pradesh welfare initiatives (Ladli Bahna, Sambal 2.0, Awas Yojana, etc.).
- **Civic Services Directory:** Directory of municipal services, birth/death registration, property tax portals, and emergency helplines.
- **State Grievance Channels:** Guidance for CM Helpline 181, National Consumer Helpline, and Swachhata App.
- **Interactive Ward Map:** Client-side Leaflet and OpenStreetMap visualization of Gwalior sectors.

### Authentication & Authorization
- **Server-Side Signed Demo Sessions:** Cryptographic JWT cookies signed with `HS256` (`jose`), enabling evaluation of Citizen, Worker, and Officer personas without registration friction.
- **API Guards:** Route-level authorization (`requireApiSession`, `requireApiRole`) enforcing strict role-based access control and data isolation.

---

## 3. Technology Stack

- **Framework:** Next.js 16 (App Router with Server Components & Partial Prerendering)
- **UI Library:** React 19
- **Language:** TypeScript (Strict Mode enabled)
- **Styling:** Tailwind CSS v4 & shadcn/ui design patterns
- **Icons:** Lucide React
- **Authentication:** Server-side signed JWT demonstration session cookies (`jose`)
- **Database & Storage:** Supabase PostgreSQL (8 tables) & Supabase Storage (4 private buckets)
- **Multimodal AI:** Google Gemini API (`@google/genai` server-only service boundary, Phase 4B)
- **Forms & Validation:** React controlled state & Zod schema validation
- **Analytics & Visualizations:** Recharts
- **GIS Maps:** Leaflet & OpenStreetMap (interactive Gwalior ward viewer)
- **Testing:** Node.js native test runner via `tsx`, Python standard library `unittest`

---

## 4. Architecture Overview

JanSahayak enforces strict separation of concerns across presentation, routing, validation, data access, and storage:

```text
Browser Client (React Server/Client Components)
       │
       ▼ (Signed Session Cookie: jansahayak_demo_session)
Route Handlers (app/api/*)
       │
       ▼ (Session & Role Verification)
API Guards (lib/auth/api-guards.ts)
       │
       ▼ (Zod Validation)
Data-Access & Storage Layer (lib/db/*, lib/storage/*)
       │
       ▼ (Administrative Service Role Key: 'server-only')
Supabase PostgreSQL & Private Storage Buckets
```

For complete architectural details, see [docs/architecture.md](docs/architecture.md).
For the database schema and storage bucket reference, see [docs/database.md](docs/database.md).
For API endpoints and schemas, see [docs/api.md](docs/api.md).
For implementation progress and upcoming phases, see [docs/roadmap.md](docs/roadmap.md).

---

## 5. Project Directory Structure

```text
jansahayak/
├── app/
│   ├── (public)/                        # Public informational routes
│   │   ├── page.tsx                     # JanSahayak Landing Page
│   │   ├── swachh-gwalior/page.tsx      # Swachh Gwalior Portal
│   │   ├── scheme-exploration/page.tsx  # Scheme Exploration Portal
│   │   ├── demo-role/page.tsx           # Demo Role Switcher Hub
│   │   └── about/page.tsx               # Academic Project Information
│   ├── (dashboard)/                     # Protected role dashboards
│   │   ├── citizen/page.tsx             # Protected Citizen Dashboard
│   │   ├── worker/page.tsx              # Protected Worker Dashboard
│   │   └── officer/page.tsx             # Municipal Officer Dashboard (Phase 4 Preview)
│   ├── api/                             # Server API route handlers
│   │   ├── demo-session/route.ts        # Session initialization, inspection, deletion
│   │   ├── complaints/route.ts          # Grievance retrieval & citizen submission
│   │   └── tasks/route.ts               # Worker task listing, start & completion
│   ├── globals.css                      # Tailwind CSS v4 design tokens
│   └── layout.tsx                       # Root layout & metadata
├── components/
│   ├── ui/                              # shadcn/ui primitives (button, card, badge, input)
│   ├── layout/                          # Headers, footers, dashboard sidebar & shell
│   ├── shared/                          # Gwalior fort artwork, role badge, ward map
│   └── dashboards/                      # Citizen, worker, officer views & charts
├── data/
│   └── schemes/                         # 50 researched schemes runtime dataset (7 JSONs)
├── docs/                                # Project documentation suite
│   ├── architecture.md                  # System architecture & security model
│   ├── database.md                      # 8 database tables & 4 private storage buckets
│   ├── api.md                           # API endpoints, methods, and schemas
│   └── roadmap.md                       # Implementation roadmap & status
├── features/                            # Static domain constants
│   ├── swachh/                          # Swachh Gwalior constants & categories
│   ├── schemes/                         # MP welfare scheme taxonomy
│   ├── grievances/                      # State grievance channels
│   └── civic-services/                  # GMC municipal services directory
├── lib/
│   ├── auth/                            # JWT session signing & API guards (jose)
│   ├── db/                              # Server data-access layer (Supabase PostgreSQL)
│   ├── gemini/                          # Dual-key Gemini AI service (assistant & vision)
│   ├── i18n/                            # Bilingual localization system (en, hi)
│   ├── schemes/                         # Scheme data access, search & eligibility engine
│   ├── storage/                         # Private bucket upload & signed URL helpers
│   ├── supabase/                        # Browser, server & admin Supabase clients
│   ├── validation/                      # Zod schemas for complaints, tasks, sessions
│   └── utils.ts                         # Style merge utilities
├── public/                              # Public static assets (favicon)
├── research/                            # Research & reference datasets
│   ├── schemes/                         # Codex scheme research output, reports & schemas
│   └── wards/                           # Gwalior ward reference dataset (59 wards)
│       ├── gwalior_wards_master.json        # Master ward reference dataset
│       ├── gwalior_wards_import_preview.json# Importer preview input
│       └── gwalior_wards_validation_report.md# Ward data audit report
├── scripts/
│   ├── import_gwalior_wards.py          # Idempotent Gwalior ward reference importer
│   ├── test_e2e_citizen.ts              # Live citizen workflow E2E test
│   ├── test_e2e_officer.ts              # Live officer workflow E2E test
│   └── test_e2e_worker.ts               # Live worker workflow E2E test
├── supabase/                            # Supabase migrations & seed scaffolding
├── tests/                               # Automated unit test suite (123 TS + 21 Python)
├── types/                               # TypeScript domain & database type definitions
├── .env.example                         # Environment configuration template
├── package.json                         # Dependencies & npm scripts
└── tsconfig.json                        # TypeScript strict compiler options
```

---

## 6. Local Setup & Execution Guide

### Prerequisites
- **Node.js:** v18.18+ or v20+ (tested on Node v20 & v24)
- **Python:** 3.10+ (for ward importer and Python tests)
- **Package Manager:** `npm` (v10+)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nayanj616/jansahayak.git
   cd jansahayak
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```
   Populate `.env.local` with your configuration:
   - `NEXT_PUBLIC_APP_URL`: Base application URL (default: `http://localhost:3000`).
   - `DEMO_SESSION_SECRET`: Cryptographically strong random string (32+ characters) for signing demo session JWT cookies.
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (`https://<project-ref>.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase client-side publishable key.
   - `SUPABASE_SECRET_KEY`: Supabase server-only administrative secret key (`sb_secret_...` or service-role key). **Never expose to the browser.**
   - `GEMINI_API_KEY`: Google Gemini API key (required for Phase 4B AI features).

4. **Run Automated Test Suites:**
   ```bash
   # Run Node.js / TypeScript unit tests (63 tests)
   npm test

   # Run Python ward importer unit tests (21 tests)
   python -m unittest tests/test_ward_import.py
   ```

5. **Run Linting:**
   ```bash
   npm run lint
   ```

6. **Build for Production:**
   ```bash
   npm run build
   ```

7. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 7. Supabase Configuration Requirements

To run the live database workflows locally:

1. **Database Tables:** The PostgreSQL database requires the eight tables documented in [`docs/database.md`](docs/database.md): `wards`, `demo_users`, `complaints`, `complaint_images`, `assignments`, `complaint_history`, `ai_verifications`, `notifications`.
2. **Deterministic Demo Users:** The `demo_users` table must contain the three demonstration profiles (`citizen`, `worker`, `officer`).
3. **Private Storage Buckets:** Four private buckets must be created in Supabase Storage:
   - `complaint-originals`
   - `cleanup-evidence`
   - `ai-annotated`
   - `verification-comparisons`
   *(All buckets must be set to **Private**; public read access must be disabled).*
4. **Provisional Ward Data:** Imported via `python scripts/import_gwalior_wards.py --execute` using the dataset in `research/wards/`.

---

## 8. Current Limitations & Implementation Roadmap

- **Academic Context:** Developed solely for academic demonstration and research.
- **Provisional Wards:** 59 wards are currently represented in the database as provisional reference boundaries.
- **Phase 4A (Pending):** Municipal Officer review queue, worker dispatch interface, and final ticket resolution.
- **Phase 4B (Pending):** Google Gemini multimodal AI before/after cleanliness analysis and conversational civic assistant.

Refer to [`docs/roadmap.md`](docs/roadmap.md) for the detailed implementation roadmap.

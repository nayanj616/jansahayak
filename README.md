# JanSahayak (जनसहायक) — Integrated Civic Assistance Platform

> **Gwalior, Madhya Pradesh, India**  
> *Cleaner cities. Informed citizens. Stronger communities.*

JanSahayak is an academic demonstration project for an integrated civic technology platform designed to bridge the gap between citizens, frontline sanitation workers, and municipal administrators in Gwalior, Madhya Pradesh.

---

## 1. Project Overview & Academic Demarcation

JanSahayak serves as a clean-slate modern TypeScript architecture demonstrating two core civic modules:

- **Module A: Swachh Gwalior** — Municipal sanitation grievance reporting, field worker dispatch, Gemini AI cleanliness comparison, and ward-level municipal officer oversight across Gwalior's 66 administrative wards.
- **Module B: Scheme Exploration** — Welfare scheme discovery, eligibility guidance, AI civic assistant, and grievance redressal channels for Madhya Pradesh residents.

> [!IMPORTANT]
> **Academic Demonstration Limitation:**  
> This platform is a demonstration prototype created for academic evaluation. It does not claim official government endorsement, verified real identity, or employment with the Gwalior Municipal Corporation or the Government of Madhya Pradesh.

---

## 2. Technology Stack

- **Framework:** Next.js 16 (App Router with Server Components & Partial Prerendering)
- **UI Library:** React 19
- **Language:** TypeScript (Strict Mode enabled)
- **Styling:** Tailwind CSS & shadcn/ui design patterns
- **Icons:** Lucide React
- **Authentication:** Server-side short-lived signed JWT session cookies (`jose`)
- **Database & Storage:** Supabase PostgreSQL & Supabase Storage (Phase 1 prepared client scaffolding)
- **Multimodal AI:** Google Gemini API (`@google/genai` server-only service stubs)
- **Forms & Validation:** React Hook Form & Zod
- **Analytics & Visualizations:** Recharts
- **GIS Maps:** Leaflet & OpenStreetMap (interactive Gwalior ward visualization)
- **Testing:** Node.js native test runner via `tsx`

---

## 3. Demo Role Architecture & Security Model

To enable friction-free academic evaluation without requiring real-world citizen registrations, passwords, or OTPs, JanSahayak implements a **Server-Side Signed Demonstration Role Session**:

### Supported Roles
1. **Citizen** (`/citizen`): Report sanitation grievances, view past complaints, explore schemes.
2. **Sanitation Worker** (`/worker`): View assigned sector tasks, update progress, upload after-cleanup photos.
3. **Municipal Officer** (`/officer`): City-wide complaint overview charts, ward-level filters, AI verification review.

### Security Implementation
- **Library:** `jose` (standard cryptographic JWT signing with `HS256`).
- **Cookie Name:** `jansahayak_demo_session`
- **Security Attributes:**
  - `HttpOnly: true` (inaccessible to browser JavaScript)
  - `Secure: true` in production environments
  - `SameSite: "lax"` protection
  - `Max-Age: 7200` (2 hours short-lived expiration)
- **Server Authorization Helpers (`lib/auth/demo-session.ts`):**
  - `getDemoSession()` — Server-side signature verification of active cookie.
  - `requireDemoRole(role)` — Guarantees the requester has the specified role; redirects to `/demo-role` otherwise.
  - `requireAnyDemoRole()` — Protects multi-role server actions and routes.
- **Role Switcher:** Integrated header dropdown allowing instant switching between roles during evaluation.

---

## 4. Prepared Integrations (Phase 2 Scaffolding)

### Supabase Preparation (`lib/supabase/`)
- `lib/supabase/client.ts` — Browser client using `@supabase/ssr` `createBrowserClient`.
- `lib/supabase/server.ts` — Server client using `@supabase/ssr` `createServerClient` reading server cookies.
- `lib/supabase/admin.ts` — High-privilege administrative client guarded with `'server-only'` to prevent leaking `SUPABASE_SECRET_KEY` to the browser.
- `supabase/migrations/001_initial_schema_placeholder.sql` & `supabase/seed.sql` — Schema scaffolding placeholders.

### Gemini Multimodal AI Preparation (`lib/gemini/`)
- `lib/gemini/service.ts` — Server-only AI service module guarded with `'server-only'`.
- Prepared function placeholders:
  - `analyzeCleanliness(beforeImage, afterImage)` — Multimodal before-and-after cleanliness comparison.
  - `answerCivicQuestion(question, context)` — Conversational civic inquiry assistant.
- In accordance with Phase 1 explicit exclusions, live API execution and simulated AI responses are disabled until Phase 2 database and API binding.

---

## 5. Project Directory Structure

```text
jansahayak/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # JanSahayak Landing Page
│   │   ├── swachh-gwalior/page.tsx      # Module A: Swachh Gwalior Portal
│   │   ├── scheme-exploration/page.tsx  # Module B: Scheme Exploration Portal
│   │   ├── demo-role/page.tsx           # Demo Role Selection Hub
│   │   └── about/page.tsx               # Academic Project Information
│   ├── (dashboard)/
│   │   ├── citizen/page.tsx             # Protected Citizen Dashboard
│   │   ├── worker/page.tsx              # Protected Worker Dashboard
│   │   └── officer/page.tsx             # Protected Officer Dashboard
│   ├── api/
│   │   └── demo-session/route.ts        # GET/POST/DELETE signed role session
│   ├── globals.css                      # Tailwind CSS v4 design tokens
│   ├── layout.tsx                       # Root HTML & Metadata Layout
│   ├── loading.tsx                      # App Loading Boundary
│   ├── error.tsx                        # App Error Boundary
│   └── not-found.tsx                    # Accessible 404 Handler
├── components/
│   ├── ui/                              # shadcn/ui components (button, card, badge, input, etc.)
│   ├── layout/                          # Headers, footers, dashboard sidebar & shell
│   ├── shared/                          # Gwalior fort artwork, role badge, role switcher, map
│   └── dashboards/                      # Citizen, worker, officer views & Recharts overview
├── features/
│   ├── swachh/                          # Swachh Gwalior constants & 66 wards metadata
│   ├── schemes/                         # MP welfare schemes taxonomy
│   ├── grievances/                      # State grievance redressal channels
│   └── civic-services/                  # GMC municipal services directory
├── lib/
│   ├── auth/                            # JWT signing & session verification (jose)
│   ├── supabase/                        # Browser, server & admin Supabase clients
│   ├── gemini/                          # Server-only Gemini AI service placeholders
│   ├── validation/                      # Zod validation schemas
│   └── utils.ts                         # Style merge (clsx & twMerge)
├── types/                               # Strict domain TypeScript definitions
├── supabase/
│   ├── migrations/                      # Initial schema placeholders
│   └── seed.sql                         # Database seed placeholder
├── tests/                               # Automated unit tests (auth & validation)
├── .env.example                         # Environment configuration template
├── package.json                         # Dependencies & scripts
└── tsconfig.json                        # Strict TypeScript compiler options
```

---

## 6. Local Setup & Execution Guide

### Prerequisites
- **Node.js:** v18.18+ or v20+ (tested on Node v24.13.0)
- **Package Manager:** `npm` (v10+ or v11+)

### Installation Steps

1. **Clone or enter the project directory:**
   ```bash
   cd jansahayak
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```
   *(A secure default demonstration key is automatically configured for local development)*

4. **Run Automated Unit Tests:**
   ```bash
   npm test
   ```

5. **Run Linting:**
   ```bash
   npm run lint
   ```

6. **Build for Production:**
   ```bash
   npm run build
   ```

7. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 7. Phase 1 Verification Checklist

- [x] TypeScript Strict Mode with zero `any` leaks in core modules.
- [x] Server-side signed short-lived session cookie via `jose`.
- [x] `requireDemoRole()` guards protecting `/citizen`, `/worker`, and `/officer`.
- [x] Reusable UI design system (buttons, cards, badges, empty states, alerts).
- [x] Visual reference reproduction (Landing page, Choose Role, 3 Dashboards, Scheme Exploration).
- [x] Supabase client separation (Browser, Server, Server-Only Admin).
- [x] Gemini service preparation with `'server-only'` security boundary.
- [x] Interactive Leaflet OpenStreetMap ward viewer for Gwalior.
- [x] Recharts complaint trend bar chart in Municipal Officer Dashboard.
- [x] Full production build (`npm run build`) passing with zero errors.
- [x] Automated test suite passing 100% of test cases.

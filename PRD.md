# Aquarious CRM — Product Requirements Document (PRD)
_Last updated: {{today}}_  
_Owner: Aquarious Technology Pvt. Ltd._

## 1) Why this exists (Context)
Aquarious needs a lightweight internal CRM to capture, track, and close inbound leads coming from Website forms, LinkedIn Lead Gen, WhatsApp, Referrals, and Ads. The first goal is **centralize leads + basic pipeline** with zero vendor lock-in.

## 2) Objectives & Success Metrics
- **T1 (2 weeks):** Single source of truth for leads with create/list/update/delete, search, and basic filters.  
  _Metric:_ 100% of new inquiries logged in CRM within 24 hours.
- **T2 (4–6 weeks):** Import CSV, status pipeline, activity notes.  
  _Metric:_ Each lead has ≥1 activity logged; time-to-first-contact ≤ 24h.
- **T3 (later):** Integrations (LinkedIn, website form webhook, WhatsApp intake), role-based access, auth.  
  _Metric:_ 80% of leads ingested automatically.

## 3) In Scope (MVP)
- Leads CRUD with fields: name, email, phone, company, status, source, tags[], notes.
- Search (name/email/phone/company) + filter by status/source.
- Activity log (notes, call, email, meeting) per lead (append-only).
- CSV import (UI + true column mapping), CSV export.
- Simple pipeline board by **status** (NEW → CONTACTED → QUALIFIED → PROPOSAL → WON/LOST).
- Minimal user roles: **ADMIN** and **MEMBER** (gate write/delete).
- Basic audit (createdAt/updatedAt; activities as history).
- No external services required to run locally.

## 4) Out of Scope (MVP)
- Email sending, calendar sync, advanced analytics/dashboards.
- Multi-tenant, multi-org, billing.
- Mobile apps (web is responsive).

## 5) Primary Users & Roles
- **Sales Member (MEMBER):** create/edit leads they own, add activities, import CSV (non-destructive), view all leads.
- **Admin (ADMIN):** everything + delete, user mgmt (seeded locally), settings.

## 6) Entities & Data Model
Minimal Prisma schema (reference):
- **User**(id, name, email[unique], role[ADMIN|MEMBER], createdAt, updatedAt)
- **Lead**(id, name, email?, phone?, company?, source, status, tags[], notes?, ownerId?, createdAt, updatedAt)
- **Activity**(id, leadId, type[NOTE|CALL|EMAIL|MEETING], content, createdAt)

Enums:
- `LeadStatus = NEW | CONTACTED | QUALIFIED | PROPOSAL | WON | LOST`
- `LeadSource = WEBSITE | LINKEDIN | WHATSAPP | REFERRAL | ADS | IMPORT | OTHER`
- `ActivityType = NOTE | CALL | EMAIL | MEETING`

## 7) Key Workflows (Acceptance Criteria)

### 7.1 Create Lead
- _Given_ user fills name (+ optional email/phone/company/source/status/tags/notes)  
- _When_ clicks **Create**  
- _Then_ lead appears in list top-most; createdAt set; default status NEW if not provided.

### 7.2 Edit Lead
- _Given_ user is owner or ADMIN  
- _When_ updates fields and saves  
- _Then_ values persist; updatedAt changes; status transition allowed to any value.

### 7.3 Log Activity
- _Given_ a lead detail page  
- _When_ user adds an activity (type + content)  
- _Then_ activity is appended and visible reverse-chronologically.

### 7.4 Search & Filter
- _When_ user types "rajiv" or "@company.com"  
- _Then_ list filters by name/email/phone/company (case-insensitive).  
- _When_ status filter applied  
- _Then_ only matching leads show.

### 7.5 CSV Import
- _Given_ user uploads CSV  
- _Then_ a **column-mapping UI** lets user map CSV columns → Lead fields (including tags via delimiter).  
- _Then_ preview shows first 10 rows; on confirm: bulk create; source set to `IMPORT` if not provided.  
- _Errors_ per row are reported (row number + reason), successful rows still import.

### 7.6 Pipeline Board
- Columns = statuses.  
- Drag card between columns updates status and appends an Activity of type NOTE ("Status changed: X→Y").

### 7.7 Delete Lead (ADMIN only)
- Soft delete (MVP can be hard delete if simpler); confirmation modal required.

## 8) UI Surface (App Router)
- `/` → redirect to `/leads`
- `/leads` → table + search + filters + "New Lead"
- `/leads/new` → create form
- `/leads/[id]` → lead detail (summary, editable fields, activities)
- `/pipeline` → kanban by status
- `/import` → CSV import + mapping wizard
- `/settings/users` (basic) → list users (ADMIN)

## 9) API Specification (App Router route handlers)
- `GET /api/leads?q=&status=` → list (paginated later)
- `POST /api/leads` → create
- `GET /api/leads/:id` → read
- `PATCH /api/leads/:id` → update
- `DELETE /api/leads/:id` → delete (ADMIN)
- `POST /api/leads/:id/activities` → append activity
- `POST /api/import/leads` → CSV upload (multipart) → dry-run + commit pattern
- `GET /api/export/leads.csv` → CSV export

_All endpoints return JSON; errors as `{error: string}` with appropriate HTTP status._

## 10) Security & Access
- Local dev: NextAuth (Email/Google) (Phase 2).  
- For MVP dev convenience: seeded users (one ADMIN, one MEMBER).  
- Authorization checks at route handlers.

## 11) Non-Functional
- Performance: list page loads ≤ 300ms for ≤ 5k leads (server + DB on dev machine).  
- Reliability: transactional bulk import.  
- Observability: server logs on each write; request id in responses.  
- Migrations with Prisma; zero manual SQL required.

## 12) Tech Stack
- Next.js (App Router, TypeScript, Tailwind)
- Prisma + PostgreSQL
- shadcn/ui for forms/tables/dialogs
- Zustand (light state) if needed

## 13) Milestones
- **M0 (done):** Postgres + Next + Prisma scaffold
- **M1 (MVP):** Leads CRUD + search/filter + activities + seed users
- **M2:** CSV import/export + pipeline board
- **M3:** NextAuth + role gates + basic settings
- **M4:** Integrations (LinkedIn form, website webhook, WhatsApp intake)

## 14) Risks & Mitigations
- CSV mapping complexity → start with required fields + preview; add templates later.
- Data quality (duplicates) → allow merge by email/phone in later phase.
- Auth friction → keep seed users until NextAuth lands.

## 15) Open Questions
- Do we want phone uniqueness? _MVP: no (use optional unique on email only)._
- Do we need per-lead owner assignment in MVP? _Nice to have; default null is fine._

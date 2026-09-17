# SilentCX — Product Requirements Document

## Original Problem Statement
Refactor, complete, and polish SilentCX into a fully functional, premium Customer Experience Audit & Mystery Shopping platform. Three roles (Admin, Client, Mystery Shopper), each with its own dashboard, workflow and permissions. Package + Add-On entitlement system, interactive audit reports with REAL PDF download, CMS-driven landing page, full audit workflow. Local dummy data first. No fake/dead UI.

## User Choices
- Backend: Full FastAPI + MongoDB (seeded dummy data) + React frontend
- Auth: JWT custom auth (email/password), Bearer token in localStorage
- Scope: all 3 roles built together
- PDF: client-side (jsPDF + jspdf-autotable)
- Logo: gold "S"-eye mark + SilentCX wordmark (dark & light variants provided)

## Architecture
- **Backend** `/app/backend`: `server.py` (auth, all routes, startup seeding), `entitlements.py` (resolve_entitlements — single source of truth), `catalog.py` (packages/add-ons/score thresholds), `seed_data.py` (demo companies, outlets, projects, full reports, invoices, shopper apps, assignments, submissions, CMS, questionnaires).
- **Frontend** `/app/frontend/src`: `lib/` (api, auth context, format helpers, pdf generator), `components/silentcx/` (primitives, DashboardShell, ReportRenderer), `pages/` (Landing, auth, Onboarding, client/*, shopper/*, admin/*).
- Brand: Deep charcoal/black + golden yellow (#E5A93C), Sora/IBM Plex Sans/JetBrains Mono fonts.

## Personas
- **Client** — business owner tracking audits, reading reports, downloading PDFs, managing billing.
- **Mystery Shopper** — mobile-first; receives assignments, fills questionnaires, uploads evidence, submits, gets paid.
- **Admin** — verifies shoppers, assigns audits, QCs submissions, publishes reports, manages packages/add-ons/CMS.

## Implemented (2026-06)
- JWT auth + role guards; 5 demo accounts + owner admin (muhkahfli15@gmail.com), all password demo123.
- Public CMS-driven landing (hero, problem, methodology, services, industries, packages, how-it-works, testimonials, FAQ, CTA).
- Client: registration + 9-step onboarding wizard (creates Client/Project/Invoice IDs), entitlement-driven dashboard (Overview, Audits+detail, Outlets+detail, Reports, interactive ReportView, Findings, Recommendations, Billing w/ pay, Documents, Account) + gated modules (Benchmark, Competitor, Re-Audit, Consultation).
- Interactive report + REAL client-side PDF (cover, category, journey, SOP, findings, recommendations, management summary, multi-outlet, competitor, re-audit — sections gated by entitlement).
- Shopper: mobile-first Home/Assignments/Detail/AuditForm(auto-save+evidence+submit-lock)/Submissions/Payments/Profile.
- Admin: Cockpit + action items, Applications verification, QC approve/revision, Projects assign+status+publish, Packages/Add-Ons management (source of truth), CMS editor (publish → live), generic resource tables.
- Entitlement snapshots stored per project (historical pricing preserved).
- Demo scenarios: Client A Essential, Client B Insight+Competitor, Client C Performance+Re-Audit+Consultation (5 Northstar outlets).
- Tested: backend 40/40 pytest, all critical frontend flows incl. PDF download.

## Implemented (2026-06, session 2)
- **Questionnaire Builder** (`/admin/questionnaires`): dnd-kit drag-to-reorder, inline question editor (type, category, weight, severity, required, evidence_required), link to packages/industry, active toggle, duplicate/delete. Backend CRUD `/api/admin/questionnaires`. Assignment creation lets admin pick questionnaire; shopper form resolves assignment.questionnaire_id → package match → industry match → qn_fnb.
- **Evidence Uploads**: multipart `POST /api/shopper/assignments/{aid}/evidence` → Google Drive folder `SilentCX Evidence/<AuditID>` when admin has connected Google, else local `/api/uploads`. Per-question uploader with thumbnails; QC page shows evidence. Required-evidence validation.
- **Notifications**: `notify.py` — in-app for all roles (admin bell now live) on report published, status change, QC approve/revision/reject, application decisions, new assignment, new submission, consultation booked/cancelled. Email is MOCKED (logged to `db.email_log`, visible in Admin → Integrations). Add RESEND_API_KEY to enable real delivery later.
- **Consultation Scheduler**: client picks date + hourly slot (09–17 WIB, Mon–Fri); backend checks internal bookings + Google Calendar free/busy; creates Calendar event with Meet link + invites client when connected. Cancel supported. Admin `/admin/consultations` table.
- **Google Integration** (`google_integration.py`): single admin-level OAuth (Drive.file + Calendar scopes), `/admin/integrations` page with connect/disconnect. Callback `/api/oauth/google/callback`. Credentials in backend/.env (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI, FRONTEND_URL, UPLOAD_DIR).
- Tested: 55/55 backend pytest + full frontend flows (iteration_2.json).

## Pending user action
- Admin must click "Connect Google Account" at /admin/integrations (login with muhkahfli15@gmail.com) to activate Drive + Calendar; until then local/internal fallback is used.

## Backlog (P1/P2)
- P1: Real email delivery via Resend (hook in notify.send_email), admin reschedule/complete consultation actions.
- P2: Case studies/testimonials CMS editing, audit logs viewer, notifications real-time, split server.py into routers.

## Next Tasks
- Connect Google account (user), Resend email, per-outlet assignment picker.

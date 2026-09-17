# SilentCX

SilentCX is a Customer Experience Audit and Mystery Shopping platform designed for businesses that want to understand what customers actually experience at the frontline.

Tagline:

**Experience. Evidence. Insight. Improvement.**

---

## Project Structure

The project consists of two main applications:

- `frontend/` — client, shopper, admin, and public landing page interface
- `backend/` — API, audit logic, entitlements, reporting, integrations, and backend services

Additional folders:

- `tests/` — automated tests
- `test_reports/` — generated testing reports
- `memory/` — internal project documentation / PRD
- `.emergent/` — Emergent workspace metadata

---

## Tech Stack

### Frontend
- React
- Tailwind CSS
- CRACO
- JavaScript
- Yarn

### Backend
- Python
- FastAPI / backend service layer
- Pytest

### Other
- Google OAuth integration
- Google Drive integration
- Google Calendar integration
- PDF/report generation
- Role-based access
- Package and add-on entitlement logic

---

## User Roles

SilentCX supports three primary roles:

### Admin
Can manage:
- CMS / Landing Page
- Clients
- Companies
- Outlets
- Shopper applications
- Shopper verification
- Audit projects
- Questionnaire templates
- Findings
- Recommendations
- Reports
- Packages
- Add-ons
- Billing
- Invoices
- Payments

### Client
Can:
- Register
- Complete onboarding
- Select package and add-ons
- Manage outlets
- Submit audit requests
- Track audit progress
- View reports
- View findings and recommendations
- Compare outlets where entitled
- Download PDF reports
- View billing

### Mystery Shopper
Can:
- Register
- Complete verification
- Receive assignments
- View audit brief
- Complete questionnaire
- Upload evidence and receipt
- Submit audit
- Respond to revision requests
- View assignment status

---

## Service Packages

### SilentCX Essential

Price:
IDR 1,249,000

Main features:
- 1 Outlet
- 1 Mystery Visit
- Basic CX audit
- Overall CX Score
- Key Findings
- Quick Recommendations
- PDF Report

### SilentCX Insight

Price:
IDR 1,749,000

Main features:
- 1 Outlet
- 1 Mystery Visit
- Detailed CX Audit
- SOP Compliance
- Customer Journey
- Evidence
- Detailed Findings
- Actionable Recommendations
- Management Summary

### SilentCX Performance

Pricing:

- 3 Outlets — IDR 3,749,000
- 4 Outlets — IDR 4,599,000
- 5 Outlets — IDR 5,399,000

Main features:
- Multi-Outlet Audit
- Outlet Ranking
- Benchmarking
- Cross-Outlet Trends
- Red Flag Identification
- Executive Summary

---

## Add-Ons

Supported add-ons include:

- Additional Outlet
- Additional Visit
- Re-Audit
- Competitor Benchmark Audit
- Custom Questionnaire
- Additional Consultation
- Priority / Express Report
- Out-of-City Assignment
- Excess Purchase Reimbursement

The client dashboard dynamically changes based on:

**Base Package + Purchased Add-Ons**

---

## Package Entitlement Logic

SilentCX uses a centralized entitlement model.

Examples:

### Essential
Includes:
- Basic Report
- Audit List
- Outlet List
- CX Score
- Findings
- Recommendations
- Billing
- PDF Report

### Insight
Includes all Essential features plus:
- Detailed Findings
- SOP Compliance
- Customer Journey
- Evidence
- Gap Analysis
- Management Summary

### Performance
Includes all Insight features plus:
- Multi-Outlet Comparison
- Outlet Ranking
- Benchmarking
- Cross-Outlet Trends
- Best / Lowest Performing Outlet
- Red Flags

Add-ons may unlock additional features such as:
- Competitor Benchmark
- Re-Audit Comparison
- Consultation
- Additional Visit Comparison
- Custom Audit Scope

---

## Environment Variables

Create a local backend environment file from the example:

```bash
cp backend/.env.example backend/.env

cat > README.md <<'EOF'
# SilentCX

SilentCX is a Customer Experience Audit and Mystery Shopping platform designed for businesses that want to understand what customers actually experience at the frontline.

Tagline:

**Experience. Evidence. Insight. Improvement.**

---

## Project Structure

The project consists of two main applications:

- `frontend/` — client, shopper, admin, and public landing page interface
- `backend/` — API, audit logic, entitlements, reporting, integrations, and backend services

Additional folders:

- `tests/` — automated tests
- `test_reports/` — generated testing reports
- `memory/` — internal project documentation / PRD
- `.emergent/` — Emergent workspace metadata

---

## Tech Stack

### Frontend
- React
- Tailwind CSS
- CRACO
- JavaScript
- Yarn

### Backend
- Python
- FastAPI / backend service layer
- Pytest

### Other
- Google OAuth integration
- Google Drive integration
- Google Calendar integration
- PDF/report generation
- Role-based access
- Package and add-on entitlement logic

---

## User Roles

SilentCX supports three primary roles:

### Admin
Can manage:
- CMS / Landing Page
- Clients
- Companies
- Outlets
- Shopper applications
- Shopper verification
- Audit projects
- Questionnaire templates
- Findings
- Recommendations
- Reports
- Packages
- Add-ons
- Billing
- Invoices
- Payments

### Client
Can:
- Register
- Complete onboarding
- Select package and add-ons
- Manage outlets
- Submit audit requests
- Track audit progress
- View reports
- View findings and recommendations
- Compare outlets where entitled
- Download PDF reports
- View billing

### Mystery Shopper
Can:
- Register
- Complete verification
- Receive assignments
- View audit brief
- Complete questionnaire
- Upload evidence and receipt
- Submit audit
- Respond to revision requests
- View assignment status

---

## Service Packages

### SilentCX Essential

Price:
IDR 1,249,000

Main features:
- 1 Outlet
- 1 Mystery Visit
- Basic CX audit
- Overall CX Score
- Key Findings
- Quick Recommendations
- PDF Report

### SilentCX Insight

Price:
IDR 1,749,000

Main features:
- 1 Outlet
- 1 Mystery Visit
- Detailed CX Audit
- SOP Compliance
- Customer Journey
- Evidence
- Detailed Findings
- Actionable Recommendations
- Management Summary

### SilentCX Performance

Pricing:

- 3 Outlets — IDR 3,749,000
- 4 Outlets — IDR 4,599,000
- 5 Outlets — IDR 5,399,000

Main features:
- Multi-Outlet Audit
- Outlet Ranking
- Benchmarking
- Cross-Outlet Trends
- Red Flag Identification
- Executive Summary

---

## Add-Ons

Supported add-ons include:

- Additional Outlet
- Additional Visit
- Re-Audit
- Competitor Benchmark Audit
- Custom Questionnaire
- Additional Consultation
- Priority / Express Report
- Out-of-City Assignment
- Excess Purchase Reimbursement

The client dashboard dynamically changes based on:

**Base Package + Purchased Add-Ons**

---

## Package Entitlement Logic

SilentCX uses a centralized entitlement model.

Examples:

### Essential
Includes:
- Basic Report
- Audit List
- Outlet List
- CX Score
- Findings
- Recommendations
- Billing
- PDF Report

### Insight
Includes all Essential features plus:
- Detailed Findings
- SOP Compliance
- Customer Journey
- Evidence
- Gap Analysis
- Management Summary

### Performance
Includes all Insight features plus:
- Multi-Outlet Comparison
- Outlet Ranking
- Benchmarking
- Cross-Outlet Trends
- Best / Lowest Performing Outlet
- Red Flags

Add-ons may unlock additional features such as:
- Competitor Benchmark
- Re-Audit Comparison
- Consultation
- Additional Visit Comparison
- Custom Audit Scope

---

## Environment Variables

Create a local backend environment file from the example:

```bash
cp backend/.env.example backend/.env



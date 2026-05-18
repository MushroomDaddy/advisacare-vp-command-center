# AdvisaCare VP Command Center

A comprehensive, HIPAA-conscious operations dashboard prototype for home health agency executives and clinical leaders. Built for demo and stakeholder review — **not for production use with real PHI**.

## Demo

This prototype uses entirely synthetic/fake data. No real patient information is present or should ever be entered.

## Modules

| Module | Description |
|--------|-------------|
| **Dashboard** | Executive brief ("What Changed Since Yesterday"), Top Actions Today, KPI stat cards, SLA breach vs risk tracking, quality risk score, service-line distribution, wallboard mode |
| **Referrals** | Kanban + table views, detail drawer with timeline, document upload with readiness transitions, duplicate detection, lost-referral analytics, AI summary placeholder |
| **Staffing** | 8-factor scoring (availability, credentials, specialty, location, workload, overtime risk, continuity of care, compliance), staff assignment → visit creation + audit, open shift board |
| **Field Assistant** | Mobile-first card layout, EVV exception workflow (5 types), start/end visit validation, route optimization placeholder, offline queue UI |
| **Quality** | Watchboard, OASIS Queue, HOPE Queue, CAHPS tabs; quality risk score, QAO calculated from OASIS assessments only, reviewer assignment, status changes with audit trail |
| **Compliance** | Credential tracking, expired/critical-soon/compliant status cards, in-app toast notifications (no browser alerts), export, renewal workflow |
| **Partners** | Detail drawer with scorecard, 30/60/90 trend charts, risk labels (Growing/Stable/Needs Attention/At Risk), follow-up recording with timeline and audit |
| **Notification Center** | Bell icon → right-side drawer, alerts grouped by Critical/High/Medium/Low, acknowledge button updates state + creates audit entry |
| **Security Checklist** | HIPAA/state/payer compliance checklist with proper retention language |
| **Audit Log** | Filterable log with before/after change display, CSV export |
| **Settings** | Demo role switching (VP User, Sarah L., Mike R., Sarah Mitchell, Compliance Admin) |

## Tech Stack

- **React 19** + TypeScript
- **Vite 8** (rolldown bundler)
- **Tailwind CSS** with custom AdvisaCare design tokens
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Router DOM v7** for routing
- **Vitest** + React Testing Library for tests

## Setup

```bash
# Requires Node.js 22+
npm ci
npm run dev       # Start dev server at localhost:5173
```

## Build & Test

```bash
npm run build     # Production build
npm run lint      # ESLint check
npm test          # Run test suite (vitest)
```

## Role-Based Demo

Switch roles in Settings to see different views:

| Role | Demo User | Access |
|------|-----------|--------|
| VP | VP User | All modules |
| Intake Coordinator | Sarah L. | Referrals, Dashboard |
| Scheduler | Mike R. | Staffing, Referrals, Dashboard |
| Field Staff | Sarah Mitchell | Field Assistant only (assigned visits) |
| Compliance Admin | Compliance Admin | Compliance, Audit Log, Security |

## ⚠️ HIPAA Warning

This is a **prototype with synthetic demo data only**. Before handling real PHI, the following are required:

- Business Associate Agreement (BAA)
- Encryption at rest and in transit
- Multi-factor authentication (MFA)
- Server-side RBAC with least-privilege access
- Immutable audit logging
- Automatic session logoff
- Secure backups and disaster recovery
- Full HIPAA/security review with documented controls
- Audit and security documentation retained per HIPAA, state law, payer rules, contracts, and company policy

**No real patient data should be entered into this prototype.**

## License

Proprietary — AdvisaCare internal use only.

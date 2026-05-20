# AdvisaCare VP Command Center

A comprehensive executive dashboard for home health and hospice agency operations. Built as a **demo / prototype** with simulated data — no real PHI is processed or stored.

## Features

- **Referral Pipeline** — Track referrals from intake through start-of-care with Kanban and table views, document uploads, SLA tracking, and readiness indicators
- **Staffing & Scheduling** — Match staff to referrals, manage shifts, track acceptance, and monitor credential compliance before assignment
- **Compliance Tracking** — Unified compliance status (Expired → Critical Soon → Due Soon → Compliant) with alert-driven renewal workflows
- **Field Assistant** — Mobile-friendly visit management with EVV clock-in/out, checklists, signature capture, incident reporting, and offline queue
- **Quality Management** — Tabbed interface for Watchboard, OASIS Queue, HOPE Queue, and CAHPS follow-ups with outcome tracking
- **Catastrophic Care** — Dedicated view for high-acuity catastrophic injury cases with coverage tracking, shift management, and supply monitoring
- **Alert Engine** — Real-time alerts derived from live state: expired credentials, SLA risk, open shifts, overdue follow-ups, and more
- **Notification Center** — View Source navigation to exact records, acknowledge/resolve with audit trail
- **Referral Partners** — Track partner volume, conversion rates, follow-up schedules, and risk levels
- **Audit Log** — Filterable, exportable audit trail of all user actions
- **Role Switching** — Demo role switching (VP, Intake Coordinator, Scheduler, Field Staff, Compliance Admin) with role-appropriate views and permissions

## Tech Stack

- React 19 + TypeScript
- Vite 8 (build tooling)
- Tailwind CSS 3 (styling)
- Recharts 3 (charts)
- Lucide React (icons)
- Vitest 4 + @testing-library/react (testing)
- react-router-dom 7 (routing)

## Getting Started

```bash
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test -- --run` | Run all tests once |
| `npm test` | Run tests in watch mode |
| `npm run preview` | Preview production build |

## Demo Data

All data is simulated and stored in `localStorage`. Use Settings to:
- **Switch roles** to see role-based access in action
- **Export/Import** demo state as JSON
- **Reset** to original seed data

## Important Notices

> **Prototype Only** — This application uses simulated data for demonstration purposes. It is not intended for production use with real patient information. A production deployment would require HIPAA-compliant infrastructure, authentication, encryption, and audit controls not present in this demo.

## Project Structure

```
src/
├── __tests__/          # Vitest test suites
├── components/         # Shared components (Toast)
├── context/            # AppContext (central state management)
├── data/               # Seed data and localStorage persistence
├── lib/                # Utilities (permissions, dates, compliance, alerts, CSV)
├── pages/              # Route pages
├── utils/              # Data logic and KPI derivation
├── App.tsx             # Root component with router and sidebar
└── types.ts            # TypeScript interfaces
```

## License

Proprietary — AdvisaCare

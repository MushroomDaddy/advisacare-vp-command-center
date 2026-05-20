# AdvisaCare VP Command Center — Roadmap

> **Prototype / Demo Application** — Not for production use with real patient data.

## ✅ Completed (Phase 3 + Hardening)

### Core Infrastructure
- [x] React + TypeScript + Vite + Tailwind CSS
- [x] Role-based access control (VP, Intake Coordinator, Scheduler, Field Staff, Compliance Admin)
- [x] localStorage state persistence with seed data
- [x] Comprehensive audit trail with before/after tracking
- [x] Real-time alert engine with auto-reconciliation

### Referral Intake
- [x] Full referral pipeline (New → Missing Docs → Eligibility → Staffing → Scheduled → Started)
- [x] Document upload with automatic readiness tracking
- [x] SLA monitoring (24-hour risk threshold)
- [x] Duplicate detection
- [x] Service-type-specific required documents (REQUIRED_DOCUMENTS mapping)
- [x] Table + Kanban views
- [x] Deep linking (?ref=ID)

### Staffing
- [x] Staff directory with availability, specialties, overtime risk
- [x] Open Shift Board with Offer → Accept → Decline workflow
- [x] Best-match scoring algorithm
- [x] Expired credential blocking (hard block, no override)
- [x] FieldVisit auto-creation on shift acceptance
- [x] Deep linking (?shift=ID)

### Field Visit Assistant
- [x] Visit checklist with completion tracking
- [x] EVV clock-in/clock-out with geolocation placeholder
- [x] Signature capture modal (required for visit completion)
- [x] EVV exception workflow with alert generation
- [x] Incident reporting
- [x] Offline queue with sync capability
- [x] Escalation workflow

### Quality & Outcomes
- [x] OASIS queue with accept/reject workflow
- [x] HOPE assessment tracking
- [x] CAHPS follow-up management
- [x] Demo OASIS Quality Score (QAO = accepted/submitted ratio)
- [x] Review notes and reviewer assignment
- [x] Deep linking (?qid=ID)

### Compliance
- [x] Four-category tracking (Compliant > 90d, Due Soon 31-90d, Critical Soon 0-30d, Expired < 0d)
- [x] Credential renewal with demo proof attachment
- [x] Auto-alert reconciliation on renewal
- [x] Staff-level compliance view
- [x] Deep linking (?item=ID)

### Catastrophic Care
- [x] Case management with acuity levels
- [x] Shift creation and real staff assignment
- [x] Coverage status tracking (auto-updates on assignment)
- [x] Timeline and incident logging
- [x] Deep linking (?case=ID)

### Referral Partners
- [x] Partner directory with contact info
- [x] Follow-up tracking with overdue alerts
- [x] Risk trending
- [x] Deep linking (?partner=ID)

### Alert System
- [x] 10+ alert types (expired credential, SLA risk/breach, open shift, catastrophic uncovered, OASIS rejected, HOPE overdue, etc.)
- [x] Auto-reconciliation after all state mutations
- [x] Notification Center with View Source deep linking
- [x] Acknowledge/resolve with audit trail

### Testing & Quality
- [x] Vitest + React Testing Library
- [x] Workflow integration tests
- [x] Quality gate: npm ci && build && lint && test

## 🔮 Future Considerations

- [ ] Backend API integration (replace localStorage)
- [ ] Real authentication and authorization
- [ ] Actual file upload storage
- [ ] Real EVV geolocation verification
- [ ] EMR/EHR integration
- [ ] Insurance verification API
- [ ] SMS/email notifications
- [ ] Reporting and analytics dashboard
- [ ] Mobile-responsive field assistant
- [ ] HIPAA-compliant infrastructure (if moving to production)

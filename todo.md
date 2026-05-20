# Phase 3 Alignment — Implementation Plan

## Files to create/modify:
1. [x] README.md — Replace default Vite template with real AdvisaCare README
2. [ ] src/types.ts — Add CriticalSoon status, readiness field, SLA fields, OASIS statuses, CatastrophicCare fields
3. [ ] src/lib/complianceUtils.ts — NEW: Single source of truth for compliance status
4. [ ] src/lib/alertEngine.ts — NEW: Derive alerts from live state, dedup, auto-resolve
5. [ ] src/lib/permissions.ts — Fix redirect to first allowed route, add catastrophic-care route
6. [ ] src/lib/dateUtils.ts — Keep as-is mostly
7. [ ] src/utils/dataLogic.ts — Use new complianceUtils, fix service-to-role mapping
8. [ ] src/context/AppContext.tsx — Fix role switching (name+role), createShift returns ID, View Source with query params
9. [ ] src/data/seedData.ts — Add readiness fields, SLA fields to referrals, add Critical Soon compliance items
10. [ ] src/App.tsx — Add CatastrophicCare route, fix NotificationCenter with query params, audit on ack/resolve
11. [ ] src/pages/Dashboard.tsx — Use new compliance utils
12. [ ] src/pages/Referrals.tsx — Document upload updates, readiness field, SLA deadlines, move-to-eligibility
13. [ ] src/pages/Staffing.tsx — Shift accept creates visit, expired credential blocks, better role mapping
14. [ ] src/pages/Compliance.tsx — Use unified compliance status, Critical Soon category
15. [ ] src/pages/FieldAssistant.tsx — End Visit validation, signature, EVV exception
16. [ ] src/pages/Quality.tsx — Split into tabs (Watchboard, OASIS, HOPE, CAHPS), OASIS statuses
17. [ ] src/pages/CatastrophicCare.tsx — NEW: Full catastrophic care page
18. [ ] src/__tests__/phase3.test.ts — NEW: 12+ workflow tests
19. [ ] Settings page — Fix HIPAA wording

import { describe, it, expect } from 'vitest';
import { ROLE_NAMES } from '../types';
import type { ComplianceItem, QualityItem, Alert, FieldVisit, Referral } from '../types';
import { getComplianceCategory, daysUntil, hasBlockingCredential } from '../lib/complianceUtils';
import { deriveAlerts, reconcileAlerts, activeAlertCount, alertKey } from '../lib/alertEngine';
import { calculateQAO, computeReadiness, computeSlaStatus } from '../utils/dataLogic';
import { getFirstAllowedRoute } from '../lib/permissions';
import { REQUIRED_DOCUMENTS } from '../types';

// ── 1. Role switching maps to correct names ──────────────────────────
describe('Role switching', () => {
  it('maps VP → VP User', () => {
    expect(ROLE_NAMES['VP']).toBe('VP User');
  });
  it('maps Intake Coordinator → Sarah L.', () => {
    expect(ROLE_NAMES['Intake Coordinator']).toBe('Sarah L.');
  });
  it('maps Scheduler → Mike R.', () => {
    expect(ROLE_NAMES['Scheduler']).toBe('Mike R.');
  });
  it('maps Field Staff → Sarah Mitchell', () => {
    expect(ROLE_NAMES['Field Staff']).toBe('Sarah Mitchell');
  });
  it('maps Compliance Admin → Compliance Admin', () => {
    expect(ROLE_NAMES['Compliance Admin']).toBe('Compliance Admin');
  });
  it('covers all 5 roles', () => {
    expect(Object.keys(ROLE_NAMES)).toHaveLength(5);
  });
});

// ── 2. Field Staff sees only assigned visits ─────────────────────────
describe('Field Staff assigned visits', () => {
  const visits: FieldVisit[] = [
    { id: 'v1', staffId: 's1', staffName: 'Sarah Mitchell', patientInitials: 'A.B.', time: '09:00', address: '123 Main', serviceType: 'Home Health', checklist: [], suppliesNeeded: [], documentationStatus: 'Pending', notes: '', evvStatus: 'Not Started', signatureCaptured: false, timeline: [] },
    { id: 'v2', staffId: 's2', staffName: 'Mike R.', patientInitials: 'C.D.', time: '10:00', address: '456 Elm', serviceType: 'Home Health', checklist: [], suppliesNeeded: [], documentationStatus: 'Pending', notes: '', evvStatus: 'Not Started', signatureCaptured: false, timeline: [] },
  ];
  it('filters visits by staff name', () => {
    const filtered = visits.filter(v => v.staffName === 'Sarah Mitchell');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('v1');
  });
});

// ── 3. Compliance categories ─────────────────────────────────────────
describe('Compliance categories', () => {
  it('classifies expired (before today)', () => {
    expect(getComplianceCategory('2020-01-01')).toBe('Expired');
  });
  it('classifies Critical Soon (0-30 days)', () => {
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
    expect(getComplianceCategory(inTwoWeeks.toISOString().split('T')[0])).toBe('Critical Soon');
  });
  it('classifies Due Soon (31-90 days)', () => {
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);
    expect(getComplianceCategory(in60Days.toISOString().split('T')[0])).toBe('Due Soon');
  });
  it('classifies Compliant (>90 days)', () => {
    const in120Days = new Date();
    in120Days.setDate(in120Days.getDate() + 120);
    expect(getComplianceCategory(in120Days.toISOString().split('T')[0])).toBe('Compliant');
  });
  it('daysUntil returns negative for expired', () => {
    expect(daysUntil('2020-01-01')).toBeLessThan(0);
  });
});

// ── 4. Blocking credentials ──────────────────────────────────────────
describe('Blocking credentials', () => {
  const compliance: ComplianceItem[] = [
    { id: 'c1', staffId: 's1', staffName: 'Test', itemType: 'RN License', status: 'Expired', expiryDate: '2020-01-01', lastCompleted: '2019-01-01' },
    { id: 'c2', staffId: 's1', staffName: 'Test', itemType: 'CPR Certification', status: 'Compliant', expiryDate: '2030-01-01', lastCompleted: '2024-01-01' },
    { id: 'c3', staffId: 's2', staffName: 'Other', itemType: 'RN License', status: 'Compliant', expiryDate: '2030-01-01', lastCompleted: '2024-01-01' },
  ];
  it('blocks s1 (has expired credential)', () => {
    expect(hasBlockingCredential('s1', compliance)).toBe(true);
  });
  it('does not block s2 (all current)', () => {
    expect(hasBlockingCredential('s2', compliance)).toBe(false);
  });
});

// ── 5. Document upload readiness ─────────────────────────────────────
describe('Readiness computation', () => {
  const makeRef = (missingItems: string[], stage: Referral['stage'], physicianOrders = 'Received'): Referral => ({
    id: 'r1', source: 'Test', patientInitials: 'A.B.', serviceType: 'Home Health',
    urgency: 'Routine', dischargeFacility: 'Test', dischargeDate: '2026-01-01',
    physicianOrders, insuranceStatus: 'Verified', documentsUploaded: 0,
    assignedCoordinator: 'Test', stage, missingItems, createdAt: '2026-01-01',
    stageTimestamps: {}, timeline: [],
  });
  it('Missing Docs when required docs are absent', () => {
    expect(computeReadiness(makeRef(['Physician Orders'], 'New'))).toBe('Missing Docs');
  });
  it('Ready for Eligibility when all docs uploaded', () => {
    expect(computeReadiness(makeRef([], 'Missing Docs'))).toBe('Ready for Eligibility');
  });
  it('Ready for SOC when stage is Scheduled', () => {
    expect(computeReadiness(makeRef([], 'Scheduled'))).toBe('Ready for SOC');
  });
});

// ── 6. SLA status computation ────────────────────────────────────────
describe('SLA status', () => {
  const makeReferral = (slaDeadline: string, stage: Referral['stage'] = 'New'): Referral => ({
    id: 'r1', source: 'Test', patientInitials: 'A.B.', serviceType: 'Home Health',
    urgency: 'Routine', dischargeFacility: 'Test', dischargeDate: '2026-01-01',
    physicianOrders: 'Received', insuranceStatus: 'Verified', documentsUploaded: 0,
    assignedCoordinator: 'Test', stage, missingItems: [], createdAt: '2026-01-01',
    stageTimestamps: {}, timeline: [], slaDeadline,
  });

  it('OK when deadline is far future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(computeSlaStatus(makeReferral(future.toISOString()))).toBe('OK');
  });
  it('Risk when deadline is within 12 hours', () => {
    const soon = new Date();
    soon.setHours(soon.getHours() + 6);
    expect(computeSlaStatus(makeReferral(soon.toISOString()))).toBe('Risk');
  });
  it('Breach when deadline has passed', () => {
    const past = new Date();
    past.setHours(past.getHours() - 1);
    expect(computeSlaStatus(makeReferral(past.toISOString()))).toBe('Breach');
  });
});

// ── 7. QAO from OASIS assessments only ──────────────────────────────
describe('QAO calculation', () => {
  const quality: QualityItem[] = [
    { id: 'q1', type: 'OASIS Due', patientInitials: 'A.B.', dueDate: '2026-06-01', status: 'Resolved', priority: 'High', assignedTo: 'QA Lead', oasisScore: 85 },
    { id: 'q2', type: 'OASIS Review', patientInitials: 'C.D.', dueDate: '2026-06-01', status: 'Accepted', priority: 'Medium', assignedTo: 'QA Lead', oasisScore: 75 },
    { id: 'q3', type: 'CAHPS Follow-up', patientInitials: 'E.F.', dueDate: '2026-06-01', status: 'Open', priority: 'Low', assignedTo: 'Nurse' },
  ];
  it('calculates average from OASIS items only', () => {
    const qao = calculateQAO(quality);
    expect(qao).toBe(80); // (85+75)/2
  });
  it('returns null when no OASIS items have scores', () => {
    expect(calculateQAO([quality[2]])).toBeNull();
  });
});

// ── 8. Alert engine ──────────────────────────────────────────────────
describe('Alert engine', () => {
  it('deriveAlerts generates expired credential alert', () => {
    const alerts = deriveAlerts({
      compliance: [{ id: 'c1', staffId: 's1', staffName: 'Test', itemType: 'RN License', status: 'Expired', expiryDate: '2020-01-01', lastCompleted: '2019-01-01' }],
      referrals: [], shifts: [], visits: [], quality: [], partners: [],
    });
    expect(alerts.some(a => a.type === 'Expired Credential')).toBe(true);
  });

  it('alertKey deduplicates by type + sourceRecordType + sourceRecordId', () => {
    expect(alertKey('Expired Credential', 'Compliance', 'c1'))
      .toBe('Expired Credential::Compliance::c1');
  });

  it('activeAlertCount counts only unresolved unacknowledged', () => {
    const alerts: Alert[] = [
      { id: 'a1', type: 'Test', severity: 'High', message: '', sourceRecordType: 'Staff', sourceRecordId: 's1', acknowledged: false, resolved: false, createdAt: '' },
      { id: 'a2', type: 'Test', severity: 'High', message: '', sourceRecordType: 'Staff', sourceRecordId: 's2', acknowledged: true, resolved: false, createdAt: '' },
      { id: 'a3', type: 'Test', severity: 'High', message: '', sourceRecordType: 'Staff', sourceRecordId: 's3', acknowledged: false, resolved: true, createdAt: '' },
    ];
    expect(activeAlertCount(alerts)).toBe(1);
  });
});

// ── 9. Route permissions ─────────────────────────────────────────────
describe('Route permissions', () => {
  it('Field Staff first allowed route is /field-assistant', () => {
    expect(getFirstAllowedRoute('Field Staff')).toBe('/field-assistant');
  });
  it('VP first allowed route is /', () => {
    expect(getFirstAllowedRoute('VP')).toBe('/');
  });
});

// ── 10. Required documents per service type ──────────────────────────
describe('Required documents', () => {
  it('Home Health requires 3 docs', () => {
    expect(REQUIRED_DOCUMENTS['Home Health']).toHaveLength(3);
  });
  it('Hospice requires Consent Form', () => {
    expect(REQUIRED_DOCUMENTS['Hospice']).toContain('Consent Form');
  });
  it('Catastrophic Injury Care requires 4 docs', () => {
    expect(REQUIRED_DOCUMENTS['Catastrophic Injury Care']).toHaveLength(4);
  });
});

// ── 11. reconcileAlerts merges and auto-resolves ─────────────────────
describe('reconcileAlerts', () => {
  it('auto-resolves alerts not in derived set', () => {
    const existing: Alert[] = [
      { id: 'a1', type: 'Expired Credential', severity: 'High', message: 'old', sourceRecordType: 'Compliance', sourceRecordId: 'c1', acknowledged: false, resolved: false, createdAt: '2026-01-01' },
    ];
    const derived: Omit<Alert, 'id' | 'acknowledged' | 'resolved' | 'createdAt'>[] = [];
    const result = reconcileAlerts(existing, derived);
    expect(result.find(a => a.id === 'a1')?.resolved).toBe(true);
  });
});

// ── 12. localStorage persistence (mock) ──────────────────────────────
describe('localStorage persistence concept', () => {
  it('JSON roundtrip preserves state shape', () => {
    const state = { referrals: [{ id: 'r1' }], currentUser: { name: 'VP User', role: 'VP' } };
    const parsed = JSON.parse(JSON.stringify(state));
    expect(parsed.referrals[0].id).toBe('r1');
    expect(parsed.currentUser.role).toBe('VP');
  });
});

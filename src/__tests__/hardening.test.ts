/**
 * Functional Hardening Tests
 * Tests for the 12-area hardening pass: SLA, compliance, required docs,
 * alert reconciliation, credential blocking, QAO modeling, and deep links.
 */
import { describe, test, expect } from 'vitest';
import { getComplianceCategory, hasBlockingCredential } from '../lib/complianceUtils';
import { deriveAlerts, reconcileAlerts } from '../lib/alertEngine';
import { computeSlaStatus, calculateQAO, computeReadiness } from '../utils/dataLogic';
import { REQUIRED_DOCUMENTS } from '../types';
import type { AppState, QualityItem, ComplianceItem, Referral, Alert } from '../types';

// Helper to create a date N days from now
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function hoursFromNow(hours: number): string {
  const d = new Date();
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

describe('Compliance Logic (#3)', () => {
  test('today (0 days) should be Critical Soon, not Expired', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getComplianceCategory(today)).toBe('Critical Soon');
  });

  test('yesterday should be Expired', () => {
    expect(getComplianceCategory(daysFromNow(-1))).toBe('Expired');
  });

  test('30 days from now should be Critical Soon', () => {
    expect(getComplianceCategory(daysFromNow(30))).toBe('Critical Soon');
  });

  test('31 days from now should be Due Soon', () => {
    expect(getComplianceCategory(daysFromNow(31))).toBe('Due Soon');
  });

  test('90 days from now should be Due Soon', () => {
    expect(getComplianceCategory(daysFromNow(90))).toBe('Due Soon');
  });

  test('91 days from now should be Compliant', () => {
    expect(getComplianceCategory(daysFromNow(91))).toBe('Compliant');
  });
});

describe('SLA Logic (#2)', () => {
  test('20 hours remaining should be Risk (not OK)', () => {
    const referral: Partial<Referral> = {
      slaDeadline: hoursFromNow(20),
      stage: 'Eligibility',
    };
    expect(computeSlaStatus(referral as Referral)).toBe('Risk');
  });

  test('25 hours remaining should be OK', () => {
    const referral: Partial<Referral> = {
      slaDeadline: hoursFromNow(25),
      stage: 'Eligibility',
    };
    expect(computeSlaStatus(referral as Referral)).toBe('OK');
  });

  test('0 hours (past deadline) should be Breach', () => {
    const referral: Partial<Referral> = {
      slaDeadline: hoursFromNow(-1),
      stage: 'Eligibility',
    };
    expect(computeSlaStatus(referral as Referral)).toBe('Breach');
  });

  test('exactly 24 hours should be Risk', () => {
    const referral: Partial<Referral> = {
      slaDeadline: hoursFromNow(24),
      stage: 'Eligibility',
    };
    expect(computeSlaStatus(referral as Referral)).toBe('Risk');
  });
});

describe('REQUIRED_DOCUMENTS by service type (#7)', () => {
  test('Home Health requires 3 documents', () => {
    expect(REQUIRED_DOCUMENTS['Home Health']).toEqual(['Physician Orders', 'Discharge Summary', 'Insurance Card']);
  });

  test('Hospice requires 4 documents including Consent Form', () => {
    expect(REQUIRED_DOCUMENTS['Hospice']).toContain('Consent Form');
    expect(REQUIRED_DOCUMENTS['Hospice']).toHaveLength(4);
  });

  test('Therapy requires Lab Results', () => {
    expect(REQUIRED_DOCUMENTS['Therapy']).toContain('Lab Results');
  });

  test('Personal Care only requires 2 documents', () => {
    expect(REQUIRED_DOCUMENTS['Personal Care']).toHaveLength(2);
  });

  test('Catastrophic Injury Care requires Consent Form', () => {
    expect(REQUIRED_DOCUMENTS['Catastrophic Injury Care']).toContain('Consent Form');
  });
});

describe('Expired credential blocking (#6)', () => {
  test('staff with expired credential should be blocked', () => {
    const compliance: ComplianceItem[] = [
      { id: 'c1', staffId: 'st1', staffName: 'Test', itemType: 'License', expiryDate: daysFromNow(-5), status: 'Expired', lastCompleted: '2024-01-01' },
    ];
    expect(hasBlockingCredential('st1', compliance)).toBe(true);
  });

  test('staff with current credentials should not be blocked', () => {
    const compliance: ComplianceItem[] = [
      { id: 'c1', staffId: 'st1', staffName: 'Test', itemType: 'License', expiryDate: daysFromNow(100), status: 'Compliant', lastCompleted: '2024-01-01' },
    ];
    expect(hasBlockingCredential('st1', compliance)).toBe(false);
  });

  test('staff with today credential should not be blocked (Critical Soon)', () => {
    const today = new Date().toISOString().split('T')[0];
    const compliance: ComplianceItem[] = [
      { id: 'c1', staffId: 'st1', staffName: 'Test', itemType: 'License', expiryDate: today, status: 'Compliant', lastCompleted: '2024-01-01' },
    ];
    expect(hasBlockingCredential('st1', compliance)).toBe(false);
  });
});

describe('QAO Modeling (#10)', () => {
  test('QAO calculated from accepted/submitted ratio', () => {
    const quality: QualityItem[] = [
      { id: 'q1', type: 'OASIS Review', patientInitials: 'A.B.', dueDate: '2025-01-01', status: 'Accepted', priority: 'High', assignedTo: 'Test' },
      { id: 'q2', type: 'OASIS Due', patientInitials: 'C.D.', dueDate: '2025-01-01', status: 'Submitted', priority: 'Medium', assignedTo: 'Test' },
      { id: 'q3', type: 'OASIS Review', patientInitials: 'E.F.', dueDate: '2025-01-01', status: 'Rejected', priority: 'High', assignedTo: 'Test' },
      { id: 'q4', type: 'OASIS Due', patientInitials: 'G.H.', dueDate: '2025-01-01', status: 'Resolved', priority: 'Low', assignedTo: 'Test' },
    ];
    // submitted = q1 + q2 + q3 + q4 = 4 (all submitted/accepted/rejected/resolved)
    // accepted = q1 + q4 = 2 (accepted or resolved)
    // QAO = 2/4 * 100 = 50%
    expect(calculateQAO(quality)).toBe(50);
  });

  test('QAO returns null for no OASIS items', () => {
    const quality: QualityItem[] = [
      { id: 'q1', type: 'Incident', patientInitials: 'A.B.', dueDate: '2025-01-01', status: 'Open', priority: 'High', assignedTo: 'Test' },
    ];
    expect(calculateQAO(quality)).toBeNull();
  });

  test('QAO falls back to oasisScore when no submitted items', () => {
    const quality: QualityItem[] = [
      { id: 'q1', type: 'OASIS Due', patientInitials: 'A.B.', dueDate: '2025-01-01', status: 'Open', priority: 'High', assignedTo: 'Test', oasisScore: 80 },
      { id: 'q2', type: 'OASIS Due', patientInitials: 'C.D.', dueDate: '2025-01-01', status: 'In Progress', priority: 'Medium', assignedTo: 'Test', oasisScore: 60 },
    ];
    expect(calculateQAO(quality)).toBe(70);
  });
});

describe('Alert engine reconciliation (#1)', () => {
  test('deriveAlerts generates SLA risk alerts at 24h threshold', () => {
    const mockState = {
      referrals: [
        {
          id: 'r1', patientInitials: 'T.S.', serviceType: 'Home Health', urgency: 'Routine',
          stage: 'Eligibility', slaDeadline: hoursFromNow(20), missingItems: [],
          source: 'Test', dischargeFacility: 'Test', dischargeDate: '2025-01-01',
          physicianOrders: 'Pending', insuranceStatus: 'Pending', documentsUploaded: 0,
          assignedCoordinator: 'Test', createdAt: new Date().toISOString(),
          stageTimestamps: {}, timeline: [],
        },
      ],
      compliance: [],
      shifts: [],
      quality: [],
      visits: [],
      referralPartners: [],
      partners: [],
      catastrophicCases: [],
    } as unknown as AppState;

    const alerts = deriveAlerts(mockState);
    const slaAlerts = alerts.filter(a => a.type === 'SLA Risk');
    expect(slaAlerts.length).toBeGreaterThanOrEqual(1);
  });

  test('reconcileAlerts resolves stale alerts', () => {
    const existingAlerts: Alert[] = [
      {
        id: 'a1', type: 'Open Shift', severity: 'High', message: 'Test',
        sourceRecordType: 'Shift', sourceRecordId: 'sh1',
        createdAt: new Date().toISOString(), resolved: false,
      },
    ];
    // No derived alerts means the open shift was resolved
    const derived: Alert[] = [];
    const result = reconcileAlerts(existingAlerts, derived);
    const unresolvedOpenShift = result.filter(a => a.id === 'a1' && !a.resolved);
    // The existing alert should either be resolved or removed
    expect(unresolvedOpenShift.length).toBe(0);
  });
});

describe('Readiness computation', () => {
  test('referral with missing docs has Missing Docs readiness', () => {
    const referral = {
      missingItems: ['Physician Orders'],
      insuranceStatus: 'Pending',
      stage: 'Missing Docs',
      assignedStaffId: undefined,
    } as unknown as Referral;
    expect(computeReadiness(referral)).toBe('Missing Docs');
  });

  test('referral with all docs and staff is Ready for SOC', () => {
    const referral = {
      missingItems: [],
      insuranceStatus: 'Verified',
      stage: 'Scheduled',
      assignedStaffId: 'st1',
    } as unknown as Referral;
    expect(computeReadiness(referral)).toBe('Ready for SOC');
  });
});

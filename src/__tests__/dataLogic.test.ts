import { describe, test, expect } from 'vitest';
import {
  getSLACategory,
  getSLALabel,
  calculateQAOFromOASIS,
  calculateQualityRiskScore,
  calculateReadiness,
  calculatePartnerRiskLabel,
  findDuplicateReferrals,
  hasWorkRestriction,
} from '../utils/dataLogic';
import type { OASISAssessment, HOPEAssessment, QualityItem, FieldVisit, ReferralPartner, Referral, ComplianceItem } from '../types';

const makeReferral = (overrides: Partial<Referral> = {}): Referral => ({
  id: 'r1', patientInitials: 'J.D.', serviceType: 'SN', urgency: 'Routine',
  source: 'Hospital A', dischargeFacility: 'Hospital A', dischargeDate: '2026-05-15',
  slaDeadline: '2026-06-01', stage: 'New', assignedOwner: '', branch: 'Houston',
  insuranceStatus: 'Pending', nextFollowUpDate: '', documents: [], documentsUploaded: 0,
  missingItems: 0, physicianOrdersReceived: false, createdAt: '2026-05-15',
  recommendedNextAction: '', readiness: 'Missing Docs', timeline: [],
  ...overrides,
});

describe('SLA Risk vs Breach', () => {
  test('SLA category is "Breach" when deadline is overdue', () => {
    const pastDate = '2025-01-01';
    expect(getSLACategory(pastDate)).toBe('Breach');
  });

  test('SLA category is "Risk" when deadline is within 24 hours', () => {
    const now = new Date();
    const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString().split('T')[0];
    expect(getSLACategory(in12Hours)).toBe('Risk');
  });

  test('SLA category is "On Track" when deadline is more than 24 hours away', () => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    expect(getSLACategory(future)).toBe('On Track');
  });

  test('SLA label includes "overdue" for breaches', () => {
    expect(getSLALabel('2025-01-01')).toContain('overdue');
  });

  test('SLA label includes "at risk" for risk category', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getSLALabel(today)).toContain('at risk');
  });
});

describe('QAO from OASIS', () => {
  test('calculates QAO percentage from OASIS assessments only', () => {
    const oasis: OASISAssessment[] = [
      { id: 'o1', patientInitials: 'A.B.', type: 'SOC', dueDate: '2026-06-01', assignedTo: 'Nurse', status: 'Accepted' },
      { id: 'o2', patientInitials: 'C.D.', type: 'ROC', dueDate: '2026-06-01', assignedTo: 'Nurse', status: 'Rejected', rejectionReason: 'Incomplete' },
      { id: 'o3', patientInitials: 'E.F.', type: 'Discharge', dueDate: '2026-06-01', assignedTo: 'Nurse', status: 'Submitted' },
      { id: 'o4', patientInitials: 'G.H.', type: 'Recertification', dueDate: '2026-06-01', assignedTo: 'Nurse', status: 'Due' },
    ];
    const result = calculateQAOFromOASIS(oasis);
    expect(result.eligible).toBe(4);
    expect(result.accepted).toBe(1);
    expect(result.rejected).toBe(1);
    expect(result.submitted).toBe(1);
    expect(result.qaoPct).toBe(25);
  });

  test('returns 0% QAO when no assessments', () => {
    const result = calculateQAOFromOASIS([]);
    expect(result.qaoPct).toBe(0);
    expect(result.eligible).toBe(0);
  });
});

describe('Quality Risk Score', () => {
  test('calculates risk from overdue items', () => {
    const quality: QualityItem[] = [
      { id: 'q1', type: 'Late Documentation', category: 'Home Health', patientInitials: 'A.B.', dueDate: '2025-01-01', status: 'Open', priority: 'High', assignedTo: 'Nurse' },
    ];
    const oasis: OASISAssessment[] = [
      { id: 'o1', patientInitials: 'A.B.', type: 'SOC', dueDate: '2025-01-01', assignedTo: 'Nurse', status: 'Due' },
      { id: 'o2', patientInitials: 'C.D.', type: 'ROC', dueDate: '2026-12-01', assignedTo: 'Nurse', status: 'Rejected', rejectionReason: 'Errors' },
    ];
    const hope: HOPEAssessment[] = [];
    const visits: FieldVisit[] = [];
    const score = calculateQualityRiskScore(quality, oasis, hope, visits);
    expect(score).toBeGreaterThan(0);
  });
});

describe('Readiness Calculation', () => {
  test('returns "Missing Docs" when documents are missing', () => {
    const ref = makeReferral({
      documents: [
        { type: 'Face Sheet', uploaded: true },
        { type: 'Orders', uploaded: false },
      ],
    });
    expect(calculateReadiness(ref)).toBe('Missing Docs');
  });

  test('returns "Ready for Eligibility" when all docs uploaded but insurance pending', () => {
    const ref = makeReferral({
      documents: [
        { type: 'Face Sheet', uploaded: true },
        { type: 'Orders', uploaded: true },
      ],
      insuranceStatus: 'Pending',
    });
    expect(calculateReadiness(ref)).toBe('Ready for Eligibility');
  });

  test('returns "Ready for Staffing" when all docs uploaded and insurance verified', () => {
    const ref = makeReferral({
      documents: [
        { type: 'Face Sheet', uploaded: true },
        { type: 'Orders', uploaded: true },
      ],
      insuranceStatus: 'Verified',
      stage: 'Eligibility',
    });
    expect(calculateReadiness(ref)).toBe('Ready for Staffing');
  });
});

describe('Partner Risk Label', () => {
  const basePartner: ReferralPartner = {
    id: 'p1', name: 'Test Hospital', type: 'Hospital',
    volume: 20, acceptedReferrals: 18, declinedReferrals: 2,
    avgTimeToSOC: '2.5 days', lostReasons: [], lastFollowUp: '2026-05-10',
    nextFollowUpReminder: '2026-05-20', notes: '', contactName: 'Dr. Test',
    contactEmail: 'test@test.com', contactPhone: '555-0000',
    timeline: [], trends: [
      { period: '30d', volume: 20, accepted: 18, declined: 2 },
      { period: '60d', volume: 10, accepted: 9, declined: 1 },
      { period: '90d', volume: 5, accepted: 4, declined: 1 },
    ],
    relationshipOwner: 'VP User',
    riskLabel: 'Growing',
  };

  test('labels growing partner when volume increases with good conversion', () => {
    // volume grew from 10 to 20 (>2 increase), conversion maintained
    const result = calculatePartnerRiskLabel(basePartner);
    expect(result).toBe('Growing');
  });

  test('labels at-risk partner with very low conversion', () => {
    const atRisk: ReferralPartner = {
      ...basePartner,
      volume: 10, acceptedReferrals: 2, declinedReferrals: 8,
      trends: [
        { period: '30d', volume: 5, accepted: 1, declined: 4 },
        { period: '60d', volume: 8, accepted: 3, declined: 5 },
        { period: '90d', volume: 10, accepted: 5, declined: 5 },
      ],
    };
    const result = calculatePartnerRiskLabel(atRisk);
    expect(['At Risk', 'Needs Attention']).toContain(result);
  });

  test('returns Stable for flat volume', () => {
    const flat: ReferralPartner = {
      ...basePartner,
      trends: [
        { period: '30d', volume: 10, accepted: 8, declined: 2 },
        { period: '60d', volume: 10, accepted: 8, declined: 2 },
      ],
    };
    expect(calculatePartnerRiskLabel(flat)).toBe('Stable');
  });
});

describe('Duplicate Detection', () => {
  test('finds duplicate referrals by initials, source, and discharge date', () => {
    const ref1 = makeReferral({ id: 'r1', patientInitials: 'J.D.', source: 'Hospital A', dischargeDate: '2026-05-15' });
    const ref2 = makeReferral({ id: 'r2', patientInitials: 'J.D.', source: 'Hospital A', dischargeDate: '2026-05-15', serviceType: 'PT' });
    const ref3 = makeReferral({ id: 'r3', patientInitials: 'M.S.', source: 'Hospital B', dischargeDate: '2026-05-15' });

    const dupes = findDuplicateReferrals(ref1, [ref1, ref2, ref3]);
    expect(dupes.length).toBe(1);
    expect(dupes[0].id).toBe('r2');
  });

  test('returns empty when no duplicates', () => {
    const ref1 = makeReferral({ id: 'r1', patientInitials: 'J.D.' });
    const ref2 = makeReferral({ id: 'r2', patientInitials: 'M.S.' });
    expect(findDuplicateReferrals(ref1, [ref1, ref2]).length).toBe(0);
  });
});

describe('Staff Compliance Restriction', () => {
  test('flags staff with expired credentials', () => {
    const compliance: ComplianceItem[] = [
      { id: 'c1', staffId: 's1', staffName: 'Test Nurse', itemType: 'RN License', expiryDate: '2025-01-01', lastCompleted: '2024-01-01', status: '' },
    ];
    const result = hasWorkRestriction('s1', compliance);
    expect(result.restricted).toBe(true);
    expect(result.reasons.length).toBeGreaterThanOrEqual(1);
  });

  test('does not restrict staff with valid credentials', () => {
    const compliance: ComplianceItem[] = [
      { id: 'c1', staffId: 's1', staffName: 'Test Nurse', itemType: 'RN License', expiryDate: '2027-01-01', lastCompleted: '2026-01-01', status: '' },
    ];
    const result = hasWorkRestriction('s1', compliance);
    expect(result.restricted).toBe(false);
  });
});

// ==============================
// Data Logic — SLA, KPIs, Scoring, Readiness
// ==============================

import type {
  Referral, StaffMember, ComplianceItem, QualityItem,
  OASISAssessment, HOPEAssessment, ReferralReadiness, PartnerRiskLabel,
  ReferralPartner
} from '../types';
import { getDaysUntilExpiry } from '../lib/dateUtils';

// --- Compliance Status ---
export type ComplianceCategory = 'Expired' | 'Critical Soon' | 'Due Soon' | 'Compliant';

export function getComplianceStatus(item: ComplianceItem): ComplianceCategory {
  const days = getDaysUntilExpiry(item.expiryDate);
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Critical Soon';
  if (days <= 90) return 'Due Soon';
  return 'Compliant';
}

export function hasWorkRestriction(staffId: string, compliance: ComplianceItem[]): { restricted: boolean; reasons: string[] } {
  const staffItems = compliance.filter(c => c.staffId === staffId);
  const reasons: string[] = [];
  for (const item of staffItems) {
    const status = getComplianceStatus(item);
    if (status === 'Expired') reasons.push(`${item.itemType} expired`);
  }
  return { restricted: reasons.length > 0, reasons };
}

// --- SLA Risk vs SLA Breach ---
export type SLACategory = 'Breach' | 'Risk' | 'On Track';

export function getSLACategory(slaDeadline: string): SLACategory {
  const daysLeft = getDaysUntilExpiry(slaDeadline);
  if (daysLeft < 0) return 'Breach';
  if (daysLeft <= 1) return 'Risk';
  return 'On Track';
}

export function getSLALabel(slaDeadline: string): string {
  const category = getSLACategory(slaDeadline);
  const daysLeft = getDaysUntilExpiry(slaDeadline);
  if (category === 'Breach') return `${Math.abs(daysLeft)}d overdue`;
  if (category === 'Risk') return `${daysLeft}d left — at risk`;
  return `${daysLeft}d left`;
}

// --- Referral Readiness ---
export function calculateReadiness(referral: Referral): ReferralReadiness {
  const allDocsUploaded = referral.documents.every(d => d.uploaded);
  if (!allDocsUploaded) return 'Missing Docs';
  if (referral.insuranceStatus !== 'Verified') return 'Ready for Eligibility';
  if (referral.stage === 'Staffing' || referral.stage === 'New' || referral.stage === 'Eligibility') return 'Ready for Staffing';
  return 'Ready for SOC';
}

export function getRecommendedNextAction(referral: Referral): string {
  const missingDocs = referral.documents.filter(d => !d.uploaded);
  if (missingDocs.length > 0) {
    const names = missingDocs.map(d => d.type).join(', ');
    return `Collect missing documents: ${names}`;
  }
  if (referral.insuranceStatus === 'Pending') return 'Verify insurance eligibility';
  if (referral.insuranceStatus === 'Denied') return 'Appeal insurance denial or update payer';
  if (referral.stage === 'Eligibility') return 'Complete eligibility review and move to Staffing';
  if (referral.stage === 'Staffing') return 'Assign clinician and schedule SOC visit';
  if (referral.stage === 'Scheduled') return 'Confirm SOC visit with patient and clinician';
  if (referral.stage === 'New') return 'Review referral and request missing documents';
  return 'Monitor case progress';
}

// --- Duplicate Detection ---
export function findDuplicateReferrals(referral: Referral, allReferrals: Referral[]): Referral[] {
  return allReferrals.filter(r =>
    r.id !== referral.id &&
    r.patientInitials === referral.patientInitials &&
    r.source === referral.source &&
    r.dischargeDate === referral.dischargeDate
  );
}

// --- Dashboard KPIs ---
export function calculateDashboardKPIs(
  referrals: Referral[],
  staff: StaffMember[],
  compliance: ComplianceItem[]
) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    newReferrals24h: referrals.filter(r => new Date(r.createdAt) > yesterday).length,
    urgentReferrals: referrals.filter(r => r.urgency === 'Immediate' && r.stage !== 'Started' && r.stage !== 'Declined').length,
    openShifts: referrals.filter(r => r.stage === 'Staffing').length,
    slaBreaches: referrals.filter(r => r.stage !== 'Started' && r.stage !== 'Declined' && getSLACategory(r.slaDeadline) === 'Breach').length,
    slaRisks: referrals.filter(r => r.stage !== 'Started' && r.stage !== 'Declined' && getSLACategory(r.slaDeadline) === 'Risk').length,
    expiredCredentials: compliance.filter(c => getComplianceStatus(c) === 'Expired').length,
    criticalSoonCredentials: compliance.filter(c => getComplianceStatus(c) === 'Critical Soon').length,
    availableStaff: staff.filter(s => s.availability === 'Available').length,
    uncoveredHighAcuity: referrals.filter(r => r.urgency === 'Immediate' && r.stage === 'Staffing').length,
  };
}

// --- 8-Factor Staffing Score ---
export interface StaffScore {
  staff: StaffMember;
  score: number;
  breakdown: {
    availability: number;
    credentials: number;
    specialty: number;
    location: number;
    workload: number;
    overtimeRisk: number;
    complianceBlocker: number;
    continuityOfCare: number;
  };
}

export function findBestMatchStaff(
  referral: Referral,
  staff: StaffMember[],
  compliance: ComplianceItem[]
): StaffScore[] {
  const scores: StaffScore[] = staff.map(s => {
    let availability = 0;
    if (s.availability === 'Available') availability = 20;
    else if (s.availability === 'Partially') availability = 10;

    let credentials = 0;
    const serviceRole = referral.serviceType.includes('SN') ? 'RN' : referral.serviceType.includes('PT') ? 'PT' : referral.serviceType.includes('OT') ? 'OT' : referral.serviceType;
    if (s.role.includes(serviceRole) || s.certifications.some(c => c.includes(serviceRole))) credentials = 20;
    else if (s.certifications.length > 0) credentials = 10;

    let specialty = 0;
    if (s.specialty.some(sp => referral.serviceType.includes(sp))) specialty = 15;
    else if (s.specialty.length > 0) specialty = 5;

    const location = s.location === referral.branch ? 15 : 5;

    const loadPct = s.todayVisits / s.maxVisits;
    const workload = loadPct < 0.5 ? 15 : loadPct < 0.75 ? 10 : loadPct < 0.9 ? 5 : 0;

    const overtimeRisk = s.overtimeRisk === 'Low' ? 10 : s.overtimeRisk === 'Medium' ? 5 : 0;

    // Continuity of care — new 8th factor
    let continuityOfCare = 0;
    if (s.continuityPatients.includes(referral.patientInitials)) continuityOfCare = 10;

    // Compliance blocker
    const restriction = hasWorkRestriction(s.id, compliance);
    const complianceBlocker = restriction.restricted ? -50 : 0;

    const score = Math.max(0, availability + credentials + specialty + location + workload + overtimeRisk + continuityOfCare + complianceBlocker);

    return {
      staff: s,
      score,
      breakdown: { availability, credentials, specialty, location, workload, overtimeRisk, complianceBlocker, continuityOfCare },
    };
  });

  return scores.sort((a, b) => b.score - a.score);
}

// --- QAO Calculation (OASIS only) ---
export function calculateQAOFromOASIS(oasisAssessments: OASISAssessment[]): {
  eligible: number;
  accepted: number;
  submitted: number;
  rejected: number;
  qaoPct: number;
} {
  const eligible = oasisAssessments.length;
  const accepted = oasisAssessments.filter(o => o.status === 'Accepted').length;
  const submitted = oasisAssessments.filter(o => o.status === 'Submitted').length;
  const rejected = oasisAssessments.filter(o => o.status === 'Rejected').length;
  const qaoPct = eligible > 0 ? Math.round((accepted / eligible) * 100) : 0;
  return { eligible, accepted, submitted, rejected, qaoPct };
}

// --- Quality Risk Score ---
export function calculateQualityRiskScore(
  quality: QualityItem[],
  oasis: OASISAssessment[],
  hope: HOPEAssessment[],
  visits: { visitStatus: string }[]
): number {
  let riskPoints = 0;
  const maxPoints = 100;

  // Overdue OASIS
  const today = new Date();
  const overdueOASIS = oasis.filter(o => o.status === 'Due' && new Date(o.dueDate) < today).length;
  riskPoints += overdueOASIS * 10;

  // Rejected OASIS
  const rejectedOASIS = oasis.filter(o => o.status === 'Rejected').length;
  riskPoints += rejectedOASIS * 8;

  // Late notes
  const lateNotes = quality.filter(q => q.type === 'Late Note' && q.status !== 'Complete').length;
  riskPoints += lateNotes * 5;

  // Missed visits
  const missedVisits = visits.filter(v => v.visitStatus === 'Missed').length;
  riskPoints += missedVisits * 10;

  // Unresolved incidents
  const incidents = quality.filter(q => q.type === 'Incident' && q.status !== 'Complete').length;
  riskPoints += incidents * 12;

  // Hospice comfort follow-up overdue
  const hospiceOverdue = quality.filter(q => q.type === 'Hospice Comfort' && q.status !== 'Complete' && new Date(q.dueDate) < today).length;
  riskPoints += hospiceOverdue * 7;

  // Overdue HOPE
  const overdueHOPE = hope.filter(h => h.status === 'Due' && new Date(h.dueDate) < today).length;
  riskPoints += overdueHOPE * 8;

  return Math.min(Math.round(riskPoints), maxPoints);
}

// --- Partner Risk Label ---
export function calculatePartnerRiskLabel(partner: ReferralPartner): PartnerRiskLabel {
  if (partner.trends.length < 2) return 'Stable';
  const recent = partner.trends[0];
  const prev = partner.trends[1];
  if (!recent || !prev) return 'Stable';

  const volumeChange = recent.volume - prev.volume;
  const conversionRecent = recent.volume > 0 ? recent.accepted / recent.volume : 0;
  const conversionPrev = prev.volume > 0 ? prev.accepted / prev.volume : 0;

  if (volumeChange > 2 && conversionRecent >= conversionPrev) return 'Growing';
  if (recent.volume === 0 || conversionRecent < 0.3) return 'At Risk';
  if (volumeChange < -2 || conversionRecent < conversionPrev - 0.15) return 'Needs Attention';
  return 'Stable';
}

// --- Stage Aging (hours since creation) ---
export function getStageAgingHours(createdAt: string): number {
  const now = new Date();
  return Math.round((now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
}

// --- Referral-to-SOC Timer ---
export function getReferralToSOCDays(referral: Referral): number | null {
  if (referral.stage === 'Started') {
    const started = referral.timeline.find(e => e.action.toLowerCase().includes('started'));
    if (started) {
      const created = new Date(referral.createdAt);
      const startedDate = new Date(started.date);
      return Math.round((startedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  return null;
}

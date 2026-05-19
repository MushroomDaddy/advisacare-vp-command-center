// ==============================
// AdvisaCare VP Command Center — Data Logic
// ==============================
import type {
  Referral, StaffMember, ComplianceItem, QualityItem,
  OASISAssessment, HOPEAssessment, FieldVisit, ReferralPartner,
  PartnerRiskLabel,
} from '../types';
import { isExpired, isDueSoon } from '../lib/dateUtils';

// ==================== SLA Precision ====================
// hour-based SLA using slaDeadlineAt (full ISO datetime)

export type SLACategory = 'Breach' | 'Risk' | 'On Track';

/** Classify SLA using an ISO datetime string. */
export function getSLACategoryFromISO(isoDeadline: string): SLACategory {
  if (!isoDeadline) return 'On Track';
  const now = Date.now();
  const deadline = new Date(isoDeadline).getTime();
  if (isNaN(deadline)) return 'On Track';
  const msLeft = deadline - now;
  if (msLeft <= 0) return 'Breach';
  if (msLeft <= 24 * 60 * 60 * 1000) return 'Risk'; // within 24h
  return 'On Track';
}

/** Backwards-compatible: getSLACategory for date-only strings (uses midnight). */
export function getSLACategory(deadline: string): SLACategory {
  if (!deadline) return 'On Track';
  // If it already has time info, pass through
  if (deadline.includes('T')) return getSLACategoryFromISO(deadline);
  // date-only: treat as end-of-day
  return getSLACategoryFromISO(deadline + 'T23:59:59');
}

export function getSLALabel(deadline: string): string {
  const iso = deadline.includes('T') ? deadline : deadline + 'T23:59:59';
  const msLeft = new Date(iso).getTime() - Date.now();
  if (msLeft <= 0) {
    const hoursOver = Math.abs(Math.floor(msLeft / (1000 * 60 * 60)));
    return hoursOver < 24 ? `${hoursOver}h overdue` : `${Math.ceil(hoursOver / 24)}d overdue`;
  }
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  if (hoursLeft < 24) return `${hoursLeft}h left`;
  return `${Math.ceil(hoursLeft / 24)}d left`;
}

/** Hours remaining from ISO deadline. Negative = overdue. */
export function getHoursUntilSLADeadline(isoDeadline: string): number {
  if (!isoDeadline) return Infinity;
  const ms = new Date(isoDeadline).getTime() - Date.now();
  return ms / (1000 * 60 * 60);
}

// ==================== Readiness / Next-Action ====================

export type ReadinessLabel = 'Missing Docs' | 'Ready for Eligibility' | 'Ready for Staffing' | 'Ready for SOC';

export function calculateReadiness(referral: Pick<Referral, 'documents' | 'stage' | 'insuranceStatus'>): ReadinessLabel {
  const allDocsUploaded = referral.documents.every(d => d.uploaded);
  if (!allDocsUploaded) return 'Missing Docs';
  if (referral.stage === 'New' || referral.stage === 'Missing Docs' || referral.stage === 'Eligibility') return 'Ready for Eligibility';
  if (referral.stage === 'Staffing') return 'Ready for Staffing';
  return 'Ready for SOC';
}

export function getRecommendedNextAction(referral: Pick<Referral, 'documents' | 'stage' | 'insuranceStatus'>): string {
  const allDocsUploaded = referral.documents.every(d => d.uploaded);
  if (!allDocsUploaded) {
    const missing = referral.documents.filter(d => !d.uploaded).map(d => d.type).join(', ');
    return `Collect missing documents: ${missing}`;
  }
  if (referral.insuranceStatus === 'Pending') return 'Verify insurance eligibility';
  if (referral.stage === 'New' || referral.stage === 'Missing Docs') return 'Move to Eligibility Review';
  if (referral.stage === 'Eligibility') return 'Complete eligibility verification and advance to Staffing';
  if (referral.stage === 'Staffing') return 'Assign qualified clinician';
  if (referral.stage === 'Scheduled') return 'Confirm SOC visit with patient and clinician';
  return 'Monitor ongoing care';
}

// ==================== Duplicate Detection ====================

export function findDuplicateReferrals(referral: Referral, all: Referral[]): Referral[] {
  return all.filter(r =>
    r.id !== referral.id &&
    r.patientInitials === referral.patientInitials &&
    r.serviceType === referral.serviceType &&
    r.source === referral.source
  );
}

// ==================== Stage Aging / SOC Timer ====================

export function getStageAgingHours(createdAt: string): number {
  return Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
}

export function getReferralToSOCDays(referral: Referral): number | null {
  const ts = referral.stageTimestamps;
  if (ts?.socCompletedAt && ts?.receivedAt) {
    const ms = new Date(ts.socCompletedAt).getTime() - new Date(ts.receivedAt).getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }
  if (referral.stage === 'Started') {
    // estimate from createdAt to now
    return Math.round((Date.now() - new Date(referral.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }
  return null; // still in progress
}

// ==================== Referral-to-SOC Analytics ====================

export interface PipelineAnalytics {
  avgReferralToSOC: number | null;
  medianReferralToSOC: number | null;
  avgTimePerStage: Record<string, number>;
  stuckByOwner: Record<string, number>;
  conversionBySource: Record<string, { total: number; converted: number; started: number; rate: number }>;
  lostReasonCounts: Record<string, number>;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function calculatePipelineAnalytics(referrals: Referral[]): PipelineAnalytics {
  // referral-to-SOC days for completed referrals
  const socDays: number[] = [];
  for (const r of referrals) {
    const ts = r.stageTimestamps;
    if (ts?.socCompletedAt && ts?.receivedAt) {
      const ms = new Date(ts.socCompletedAt).getTime() - new Date(ts.receivedAt).getTime();
      socDays.push(Math.round(ms / (1000 * 60 * 60 * 24)));
    }
  }

  // avg time per stage (from timestamps)
  const stageDeltas: Record<string, number[]> = {};
  for (const r of referrals) {
    const ts = r.stageTimestamps;
    if (!ts?.receivedAt) continue;
    const pairs: [string, string | undefined, string | undefined][] = [
      ['Received → Docs Requested', ts.receivedAt, ts.docsRequestedAt],
      ['Docs Requested → Complete', ts.docsRequestedAt, ts.docsCompleteAt],
      ['Eligibility', ts.eligibilityStartedAt, ts.eligibilityVerifiedAt],
      ['Staffing', ts.staffingStartedAt, ts.staffAssignedAt],
      ['Staff Assigned → SOC', ts.staffAssignedAt, ts.socScheduledAt],
    ];
    for (const [label, start, end] of pairs) {
      if (start && end) {
        const hours = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
        if (!stageDeltas[label]) stageDeltas[label] = [];
        stageDeltas[label].push(hours);
      }
    }
  }
  const avgTimePerStage: Record<string, number> = {};
  for (const [label, vals] of Object.entries(stageDeltas)) {
    avgTimePerStage[label] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // stuck by owner (>48h in pipeline, not completed/declined)
  const now = Date.now();
  const stuckByOwner: Record<string, number> = {};
  for (const r of referrals) {
    if (r.stage === 'Started' || r.stage === 'Declined') continue;
    if ((now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60) > 48) {
      stuckByOwner[r.assignedOwner] = (stuckByOwner[r.assignedOwner] || 0) + 1;
    }
  }

  // conversion by source
  const conversionBySource: Record<string, { total: number; converted: number; started: number; rate: number }> = {};
  for (const r of referrals) {
    if (!conversionBySource[r.source]) conversionBySource[r.source] = { total: 0, converted: 0, started: 0, rate: 0 };
    conversionBySource[r.source].total++;
    if (r.stage === 'Started' || r.stage === 'Scheduled') conversionBySource[r.source].converted++;
    if (r.stage === 'Started') conversionBySource[r.source].started++;
  }
  for (const src of Object.keys(conversionBySource)) {
    const s = conversionBySource[src];
    s.rate = s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0;
  }

  // lost reasons (check both lostReason and declineReason fields)
  const lostReasonCounts: Record<string, number> = {};
  for (const r of referrals) {
    const reason = r.lostReason || r.declineReason;
    if (reason) lostReasonCounts[reason] = (lostReasonCounts[reason] || 0) + 1;
  }

  return {
    avgReferralToSOC: socDays.length > 0 ? Math.round(socDays.reduce((a, b) => a + b, 0) / socDays.length) : null,
    medianReferralToSOC: median(socDays),
    avgTimePerStage,
    stuckByOwner,
    conversionBySource,
    lostReasonCounts,
  };
}

// ==================== Staff Matching ====================

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
    continuityOfCare: number;
    complianceBlocker: number;
    skillMatch: number;
  };
}

/** Map service types to acceptable staff roles. */
export const serviceToStaffRoles: Record<string, string[]> = {
  'SN': ['RN', 'LPN'],
  'PT': ['PT', 'PTA'],
  'OT': ['OT', 'COTA'],
  'Hospice': ['RN', 'CHPN'],
  'Personal Care': ['HHA', 'CNA', 'Caregiver'],
  'Catastrophic Care': ['RN', 'LPN', 'HHA'],
};

export function findBestMatchStaff(referral: Referral, staff: StaffMember[], compliance: ComplianceItem[]): StaffScore[] {
  return staff.map(s => {
    let availability = 0;
    if (s.availability === 'Available') availability = 20;
    else if (s.availability === 'Partially') availability = 10;

    const credentials = s.certifications.length >= 3 ? 20 : s.certifications.length >= 2 ? 14 : 8;

    const specialty = s.specialty.some(sp =>
      referral.serviceType.toLowerCase().includes(sp.toLowerCase()) ||
      sp.toLowerCase().includes(referral.serviceType.toLowerCase())
    ) ? 15 : 5;

    const location = s.location === referral.branch ? 15 : 5;

    const loadPct = s.todayVisits / s.maxVisits;
    const workload = loadPct < 0.5 ? 15 : loadPct < 0.8 ? 10 : loadPct < 1 ? 5 : 0;

    const overtimeRisk = s.overtimeRisk === 'Low' ? 10 : s.overtimeRisk === 'Medium' ? 5 : 0;

    const continuityOfCare = s.continuityPatients.includes(referral.patientInitials) ? 10 : 0;

    const staffCompliance = compliance.filter(c => c.staffId === s.id);
    const hasExpired = staffCompliance.some(c => isExpired(c.expiryDate));
    const complianceBlocker = hasExpired ? -100 : 0;

    // Skill match for service-to-staff role mapping
    const acceptableRoles = serviceToStaffRoles[referral.serviceType] || [];
    const roleMatch = acceptableRoles.length === 0 || acceptableRoles.some(r => s.role.includes(r));
    const skillMatch = roleMatch ? 5 : 0;

    const score = availability + credentials + specialty + location + workload + overtimeRisk + continuityOfCare + complianceBlocker + skillMatch;

    return { staff: s, score, breakdown: { availability, credentials, specialty, location, workload, overtimeRisk, continuityOfCare, complianceBlocker, skillMatch } };
  }).sort((a, b) => b.score - a.score);
}

export function hasWorkRestriction(staffId: string, compliance: ComplianceItem[]): { restricted: boolean; reasons: string[] } {
  const items = compliance.filter(c => c.staffId === staffId);
  const reasons: string[] = [];
  for (const item of items) {
    if (isExpired(item.expiryDate)) {
      reasons.push(`${item.itemType} expired`);
    }
  }
  return { restricted: reasons.length > 0, reasons };
}

// ==================== Compliance Helpers ====================

export type ComplianceCategory = 'Expired' | 'Critical Soon' | 'Due Soon' | 'Compliant';

export function getComplianceStatus(item: ComplianceItem): ComplianceCategory {
  if (isExpired(item.expiryDate)) return 'Expired';
  if (isDueSoon(item.expiryDate, 30)) return 'Critical Soon';
  if (isDueSoon(item.expiryDate, 90)) return 'Due Soon';
  return 'Compliant';
}

// ==================== Dashboard KPIs ====================

export interface DashboardKPIs {
  newReferrals24h: number;
  openShifts: number;
  uncoveredHighAcuity: number;
  expiredCredentials: number;
}

export function calculateDashboardKPIs(referrals: Referral[], staff: StaffMember[], compliance: ComplianceItem[]): DashboardKPIs {
  const now = Date.now();
  const newReferrals24h = referrals.filter(r => (now - new Date(r.createdAt).getTime()) < 24 * 60 * 60 * 1000).length;
  const openShifts = staff.filter(s => s.shiftStatus === 'Unconfirmed').length;
  const uncoveredHighAcuity = referrals.filter(r => r.urgency === 'Immediate' && r.stage === 'Staffing').length;
  const expiredCredentials = compliance.filter(c => isExpired(c.expiryDate)).length;
  return { newReferrals24h, openShifts, uncoveredHighAcuity, expiredCredentials };
}

// ==================== Quality / OASIS / HOPE ====================

export function calculateQAOFromOASIS(assessments: OASISAssessment[]): { qaoPct: number; accepted: number; eligible: number } {
  const eligible = assessments.filter(a => a.status === 'Accepted' || a.status === 'Rejected');
  const accepted = eligible.filter(a => a.status === 'Accepted').length;
  return {
    qaoPct: eligible.length > 0 ? Math.round((accepted / eligible.length) * 100) : 100,
    accepted,
    eligible: eligible.length,
  };
}

export function calculateQualityRiskScore(quality: QualityItem[], oasis: OASISAssessment[], hope: HOPEAssessment[], visits: FieldVisit[]): number {
  const now = new Date();
  let riskPoints = 0;
  let maxPoints = 0;

  // Late notes (30 pts)
  maxPoints += 30;
  const lateNotes = quality.filter(q => q.type === 'Late Note' && q.status !== 'Complete').length;
  riskPoints += Math.min(lateNotes * 10, 30);

  // Overdue OASIS (30 pts)
  maxPoints += 30;
  const overdueOasis = oasis.filter(o => o.status === 'Due' && new Date(o.dueDate) < now).length;
  riskPoints += Math.min(overdueOasis * 15, 30);

  // Rejected OASIS (20 pts)
  maxPoints += 20;
  const rejectedOasis = oasis.filter(o => o.status === 'Rejected').length;
  riskPoints += Math.min(rejectedOasis * 20, 20);

  // Overdue HOPE (10 pts)
  maxPoints += 10;
  const overdueHope = hope.filter(h => h.status === 'Due' && new Date(h.dueDate) < now).length;
  riskPoints += Math.min(overdueHope * 10, 10);

  // Missed visits (10 pts)
  maxPoints += 10;
  const missedVisits = visits.filter(v => v.visitStatus === 'Missed').length;
  riskPoints += Math.min(missedVisits * 10, 10);

  return maxPoints > 0 ? Math.round((riskPoints / maxPoints) * 100) : 0;
}

// ==================== Partner Analytics ====================

export function calculatePartnerRiskLabel(partner: ReferralPartner): PartnerRiskLabel {
  if (partner.trends.length === 0) return 'Stable';
  const latest = partner.trends[0];
  const prev = partner.trends.length >= 2 ? partner.trends[1] : null;
  if (!prev) return 'Stable';
  const pctChange = prev.volume > 0 ? ((latest.volume - prev.volume) / prev.volume) * 100 : 0;
  const conv = latest.volume > 0 ? (latest.accepted / latest.volume) * 100 : 0;

  if (conv < 30 || pctChange < -30) return 'At Risk';
  if (conv < 50 || pctChange < -15) return 'Needs Attention';
  if (pctChange > 10) return 'Growing';
  return 'Stable';
}

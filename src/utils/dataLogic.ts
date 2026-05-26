import type { Referral, StaffMember, ComplianceItem, QualityItem } from '../types';
import { getComplianceCategory } from '../lib/complianceUtils';
import { getDaysUntilExpiry } from '../lib/dateUtils';

// Re-export ComplianceCategory from complianceUtils for backward compat
export type { ComplianceCategory } from '../types';

/**
 * Returns compliance status — delegates to the single source of truth.
 * @deprecated Use getComplianceCategory from lib/complianceUtils directly.
 */
export function getComplianceStatus(item: ComplianceItem): string {
  return getComplianceCategory(item.expiryDate);
}

// --- 2) KPI Derivation Functions ---
export interface DashboardKPIs {
  newReferrals24h: number;
  urgentReferrals: number;
  openShifts: number;
  highRiskCases: number;
  expiringLicenses: number;
}

/**
 * Calculate all dashboard KPIs from current app state
 */
export function calculateDashboardKPIs(
  referrals: Referral[],
  _staff: StaffMember[],
  compliance: ComplianceItem[],
  quality: QualityItem[]
): DashboardKPIs {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const newReferrals24h = referrals.filter(r =>
    new Date(r.createdAt) >= twentyFourHoursAgo
  ).length;

  const urgentReferrals = referrals.filter(r =>
    r.urgency === 'Urgent 24-48 hours' || r.urgency === 'Immediate'
  ).length;

  const openShifts = referrals.filter(r => r.stage === 'Staffing').length;

  const highRiskReferrals = referrals.filter(r => r.urgency === 'Immediate').length;
  const highRiskQuality = quality.filter(q =>
    q.priority === 'High' && q.status === 'Open'
  ).length;
  const highRiskCases = highRiskReferrals + highRiskQuality;

  // Expiring = Expired + Critical Soon + Due Soon
  const expiringLicenses = compliance.filter(item => {
    const status = getComplianceCategory(item.expiryDate);
    return status !== 'Compliant';
  }).length;

  return { newReferrals24h, urgentReferrals, openShifts, highRiskCases, expiringLicenses };
}

// --- 3) Best-Match Staffing Algorithm ---
export interface StaffScore {
  staff: StaffMember;
  score: number;
  breakdown: {
    location: number;
    availability: number;
    credentials: number;
    specialty: number;
  };
}

/** Service type → eligible staff roles (improved mapping for hospice, personal care, therapy, catastrophic) */
const SERVICE_TYPE_ROLES: Record<Referral['serviceType'], StaffMember['role'][]> = {
  'Home Health': ['RN', 'LPN', 'HHA'],
  'Hospice': ['RN', 'LPN', 'HHA', 'CNA'],
  'Personal Care': ['HHA', 'CNA', 'LPN'],
  'Therapy': ['PT', 'OT', 'ST'],
  'Catastrophic Injury Care': ['RN', 'LPN', 'PT', 'OT'],
};

export function getEligibleRoles(serviceType: Referral['serviceType']): StaffMember['role'][] {
  return SERVICE_TYPE_ROLES[serviceType] || [];
}

/**
 * Score and rank staff for a given referral based on:
 * - Location proximity (30pts max)
 * - Availability (30pts max)
 * - Credentials match (20pts max)
 * - Specialty tags match (20pts max)
 */
export function findBestMatchStaff(
  referral: Referral,
  staffList: StaffMember[]
): StaffScore[] {
  const eligibleRoles = SERVICE_TYPE_ROLES[referral.serviceType] || [];

  return staffList.map(staff => {
    const breakdown = { location: 0, availability: 0, credentials: 0, specialty: 0 };

    const locationMatch = staff.location && referral.dischargeFacility.includes(staff.location);
    breakdown.location = locationMatch ? 30 : 0;

    switch (staff.availability) {
      case 'Available': breakdown.availability = 30; break;
      case 'Partially': breakdown.availability = 15; break;
      default: breakdown.availability = 0;
    }

    breakdown.credentials = eligibleRoles.includes(staff.role) ? 20 : 0;

    const matchingSpecialties = staff.specialties.filter(spec =>
      spec.toLowerCase() === referral.serviceType.toLowerCase() ||
      spec.toLowerCase().includes(referral.serviceType.toLowerCase().split(' ')[0])
    );
    breakdown.specialty = Math.min(matchingSpecialties.length * 10, 20);

    const score = breakdown.location + breakdown.availability + breakdown.credentials + breakdown.specialty;
    return { staff, score, breakdown };
  })
  .filter(entry => entry.score > 0)
  .sort((a, b) => b.score - a.score);
}

// --- 4) SOC Deadline Logic ---
export function getSOCDaysUntilDeadline(referral: Referral): number | null {
  if (referral.stage !== 'Scheduled') return null;
  if (!referral.dischargeDate) return null;
  return getDaysUntilExpiry(referral.dischargeDate);
}

export function getScheduledReferralsWithSOCDeadlines(referrals: Referral[]): Array<Referral & { socDaysLeft: number | null }> {
  return referrals
    .filter(r => r.stage === 'Scheduled')
    .map(r => ({ ...r, socDaysLeft: getSOCDaysUntilDeadline(r) }));
}

// --- 5) Referral readiness computation ---
export function computeReadiness(referral: Referral): Referral['readiness'] {
  if (referral.missingItems.length > 0 || referral.physicianOrders === 'Missing') {
    return 'Missing Docs';
  }
  if (referral.stage === 'Missing Docs' || referral.stage === 'New') {
    return 'Ready for Eligibility';
  }
  if (referral.stage === 'Eligibility') {
    return 'Ready for Staffing';
  }
  if (referral.stage === 'Staffing' || referral.stage === 'Scheduled') {
    return 'Ready for SOC';
  }
  return undefined;
}

// --- 6) SLA computation ---
export function computeSlaDeadline(referral: Referral): string | undefined {
  const created = new Date(referral.createdAt);
  switch (referral.urgency) {
    case 'Immediate':
      return new Date(created.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'Urgent 24-48 hours':
      return new Date(created.getTime() + 48 * 60 * 60 * 1000).toISOString();
    case 'Routine':
      return new Date(created.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}

export function computeSlaStatus(referral: Referral): Referral['slaStatus'] {
  if (!referral.slaDeadline) return 'OK';
  if (referral.stage === 'Started' || referral.stage === 'Declined') return 'OK';
  const hoursLeft = (new Date(referral.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft <= 0) return 'Breach';
  if (hoursLeft <= 24) return 'Risk';
  return 'OK';
}

// --- 7) Demo OASIS Quality Score (QAO) -----------------------------------------------
//
// IMPORTANT (Fix #7): this is a DEMO heuristic, NOT a certified CMS OASIS quality
// calculation. The metric is exposed as "Demo OASIS Quality Score" in the UI to make
// that explicit. The score is the ratio of accepted to submitted OASIS assessments;
// `summarizeOasisCounts` returns the full breakdown for the dashboard.

export interface OasisCountSummary {
  /** Items with status Submitted/Accepted/Rejected/Resolved — i.e. processed by QA */
  submitted: number;
  /** Items with status Accepted or Resolved */
  accepted: number;
  /** Items with status Rejected */
  rejected: number;
  /** Items with status In Progress (Submitted but not yet decided) */
  inProgress: number;
  /** Items with status Open (not yet submitted) */
  open: number;
  /** Percentage = round(accepted / submitted * 100), or null if no submitted items */
  percentage: number | null;
}

/** Sum OASIS items by lifecycle bucket for the Demo OASIS Quality Score breakdown. */
export function summarizeOasisCounts(quality: QualityItem[]): OasisCountSummary {
  const oasis = quality.filter(q => q.type === 'OASIS Due' || q.type === 'OASIS Review');
  const submitted = oasis.filter(q =>
    q.status === 'Submitted' || q.status === 'Accepted' || q.status === 'Rejected' || q.status === 'Resolved'
  ).length;
  const accepted = oasis.filter(q => q.status === 'Accepted' || q.status === 'Resolved').length;
  const rejected = oasis.filter(q => q.status === 'Rejected').length;
  const inProgress = oasis.filter(q => q.status === 'In Progress' || q.status === 'Submitted').length;
  const open = oasis.filter(q => q.status === 'Open').length;
  const percentage = submitted > 0 ? Math.round((accepted / submitted) * 100) : null;
  return { submitted, accepted, rejected, inProgress, open, percentage };
}

/**
 * Demo OASIS Quality Score (QAO).
 * Calculated as: (accepted OASIS assessments / submitted OASIS assessments) × 100.
 * Falls back to average oasisScore when no submitted/accepted lifecycle data exists.
 * Returns null if there are no OASIS items at all OR if no scoring signal is available.
 */
export function calculateQAO(quality: QualityItem[]): number | null {
  const oasisItems = quality.filter(
    q => q.type === 'OASIS Due' || q.type === 'OASIS Review'
  );
  if (oasisItems.length === 0) return null;

  const { submitted, percentage } = summarizeOasisCounts(quality);
  if (submitted > 0 && percentage !== null) return percentage;

  // Fallback: average oasisScore (preserved for backward compat — see hardening tests)
  const scored = oasisItems.filter(q => q.oasisScore !== undefined);
  if (scored.length === 0) return null;
  const total = scored.reduce((sum, q) => sum + (q.oasisScore ?? 0), 0);
  return Math.round(total / scored.length);
}

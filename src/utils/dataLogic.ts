import type { Referral, StaffMember, ComplianceItem, QualityItem } from '../types';
import { getDaysUntilExpiry } from '../lib/dateUtils';

// --- 1) Compliance Status Calculation ---
// Calculated from expiryDate, never trusting stored status
export type ComplianceCategory = 'Expired' | 'Critical Soon' | 'Due Soon' | 'Compliant';

/**
 * Returns compliance status based on days until expiry:
 * - Expired: daysLeft < 0
 * - Critical Soon: 0–30 days
 * - Due Soon: 31–90 days
 * - Compliant: >90 days
 */
export function getComplianceStatus(item: ComplianceItem): ComplianceCategory {
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 30) return 'Critical Soon';
  if (daysLeft <= 90) return 'Due Soon';
  return 'Compliant';
}

/**
 * Check if a staff member has any work restriction (expired license or CPR)
 */
export function hasWorkRestriction(staffId: string, complianceItems: ComplianceItem[]): { restricted: boolean; reasons: string[] } {
  const staffItems = complianceItems.filter(c => c.staffId === staffId);
  const reasons: string[] = [];

  for (const item of staffItems) {
    const status = getComplianceStatus(item);
    if (status === 'Expired') {
      if (item.itemType.includes('License') || item.itemType === 'CPR Certification') {
        reasons.push(`${item.itemType} expired`);
      }
    }
  }

  return { restricted: reasons.length > 0, reasons };
}

// --- 2) KPI Derivation Functions ---
export interface DashboardKPIs {
  newReferrals24h: number;
  urgentReferrals: number;
  openShifts: number;
  highRiskCases: number;
  expiringLicenses: number;
  stuckReferrals: number;
  lateNotes: number;
}

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

  const expiringLicenses = compliance.filter(item => {
    const status = getComplianceStatus(item);
    return status === 'Critical Soon' || status === 'Expired';
  }).length;

  // Stuck referrals: in same stage for more than 48 hours and not Started/Declined
  const stuckReferrals = referrals.filter(r => {
    if (r.stage === 'Started' || r.stage === 'Declined') return false;
    const created = new Date(r.createdAt);
    const hoursSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursSince > 48;
  }).length;

  const lateNotes = quality.filter(q =>
    q.type === 'Late Note' && q.status !== 'Complete'
  ).length;

  return {
    newReferrals24h,
    urgentReferrals,
    openShifts,
    highRiskCases,
    expiringLicenses,
    stuckReferrals,
    lateNotes,
  };
}

// --- 3) Best-Match Staffing Algorithm ---
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
  };
}

/**
 * Score and rank staff for a given referral:
 * - Availability (20pts max)
 * - Role/license eligibility (20pts max)
 * - Specialty match (15pts max)
 * - Location/territory (15pts max)
 * - Current workload (15pts max)
 * - Overtime risk (10pts max)
 * - Compliance blockers (-30pts if restricted)
 */
export function findBestMatchStaff(
  referral: Referral,
  staffList: StaffMember[],
  complianceItems?: ComplianceItem[]
): StaffScore[] {
  const serviceTypeRoles: Record<Referral['serviceType'], StaffMember['role'][]> = {
    'Home Health': ['RN', 'LPN', 'HHA'],
    'Hospice': ['RN', 'LPN', 'HHA'],
    'Personal Care': ['HHA', 'CNA'],
    'Therapy': ['PT', 'OT', 'ST'],
    'Catastrophic Injury Care': ['RN', 'PT', 'OT'],
  };

  const eligibleRoles = serviceTypeRoles[referral.serviceType] || [];

  return staffList.map(staff => {
    const breakdown = {
      availability: 0,
      credentials: 0,
      specialty: 0,
      location: 0,
      workload: 0,
      overtimeRisk: 0,
      complianceBlocker: 0,
    };

    // 1. Availability (20pts)
    switch (staff.availability) {
      case 'Available': breakdown.availability = 20; break;
      case 'Partially': breakdown.availability = 10; break;
      default: breakdown.availability = 0;
    }

    // 2. Role/license eligibility (20pts)
    breakdown.credentials = eligibleRoles.includes(staff.role) ? 20 : 0;

    // 3. Specialty match (15pts)
    const matchingSpecialties = staff.specialties.filter(spec =>
      spec.toLowerCase() === referral.serviceType.toLowerCase() ||
      spec.toLowerCase().includes(referral.serviceType.toLowerCase().split(' ')[0])
    );
    breakdown.specialty = Math.min(matchingSpecialties.length * 8, 15);

    // 4. Location/territory (15pts)
    const locationMatch = staff.location && referral.dischargeFacility.toLowerCase().includes(staff.location.toLowerCase());
    breakdown.location = locationMatch ? 15 : 0;

    // 5. Workload (15pts) - fewer visits = higher score
    const maxVisits = staff.maxVisits || 8;
    const capacityUsed = staff.todayVisits / maxVisits;
    breakdown.workload = Math.round(Math.max(0, (1 - capacityUsed)) * 15);

    // 6. Overtime risk (10pts)
    switch (staff.overtimeRisk) {
      case 'Low': breakdown.overtimeRisk = 10; break;
      case 'Medium': breakdown.overtimeRisk = 5; break;
      default: breakdown.overtimeRisk = 0;
    }

    // 7. Compliance blockers (-30pts)
    if (complianceItems) {
      const restriction = hasWorkRestriction(staff.id, complianceItems);
      if (restriction.restricted) {
        breakdown.complianceBlocker = -30;
      }
    }

    const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    return { staff, score, breakdown };
  })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

// --- 4) SOC Deadline Logic ---
export function getSOCDaysUntilDeadline(referral: Referral): number | null {
  if (!referral.dischargeDate) return null;
  return getDaysUntilExpiry(referral.dischargeDate);
}

export function getScheduledReferralsWithSOCDeadlines(referrals: Referral[]): Array<Referral & { socDaysLeft: number | null }> {
  return referrals
    .filter(r => r.stage === 'Scheduled')
    .map(r => ({
      ...r,
      socDaysLeft: getSOCDaysUntilDeadline(r),
    }));
}

// --- 5) Duplicate Referral Detection ---
export function findDuplicateReferrals(referral: Referral, allReferrals: Referral[]): Referral[] {
  return allReferrals.filter(r =>
    r.id !== referral.id &&
    r.patientInitials === referral.patientInitials &&
    r.source === referral.source &&
    r.dischargeDate === referral.dischargeDate
  );
}

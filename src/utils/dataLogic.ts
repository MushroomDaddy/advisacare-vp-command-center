import type { Referral, StaffMember, ComplianceItem, QualityItem } from '../types';
import { getDaysUntilExpiry } from '../lib/dateUtils';

// --- 1) Compliance Status Calculation ---
export type ComplianceCategory = 'Expired' | 'Expiring' | 'Compliant';

/**
 * Returns compliance status based on days until expiry:
 * - Expired: <30 days remaining
 * - Expiring: 30-90 days remaining  
 * - Compliant: >90 days remaining
 */
export function getComplianceStatus(item: ComplianceItem): ComplianceCategory {
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  if (daysLeft < 30) return 'Expired';
  if (daysLeft <= 90) return 'Expiring';
  return 'Compliant';
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
  _staff: StaffMember[],  // Kept for API compatibility but unused
  compliance: ComplianceItem[],
  quality: QualityItem[]
): DashboardKPIs {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // New referrals in last 24h
  const newReferrals24h = referrals.filter(r => 
    new Date(r.createdAt) >= twentyFourHoursAgo
  ).length;

  // Urgent referrals (Urgent 24-48h or Immediate)
  const urgentReferrals = referrals.filter(r => 
    r.urgency === 'Urgent 24-48 hours' || r.urgency === 'Immediate'
  ).length;

  // Open shifts = referrals in Staffing stage (unfilled staffing needs)
  const openShifts = referrals.filter(r => r.stage === 'Staffing').length;

  // High-risk cases = Immediate urgency referrals + Open high-priority quality items
  const highRiskReferrals = referrals.filter(r => r.urgency === 'Immediate').length;
  const highRiskQuality = quality.filter(q => 
    q.priority === 'High' && q.status === 'Open'
  ).length;
  const highRiskCases = highRiskReferrals + highRiskQuality;

  // Expiring licenses = compliance items with Expiring or Expired status
  const expiringLicenses = compliance.filter(item => {
    const status = getComplianceStatus(item);
    return status === 'Expiring' || status === 'Expired';
  }).length;

  return {
    newReferrals24h,
    urgentReferrals,
    openShifts,
    highRiskCases,
    expiringLicenses
  };
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
  // Define role eligibility per service type
  const serviceTypeRoles: Record<Referral['serviceType'], StaffMember['role'][]> = {
    'Home Health': ['RN', 'LPN', 'HHA'],
    'Hospice': ['RN', 'LPN', 'HHA'],
    'Personal Care': ['HHA', 'CNA'],
    'Therapy': ['PT', 'OT', 'ST'],
    'Catastrophic Injury Care': ['RN', 'PT', 'OT']
  };

  const eligibleRoles = serviceTypeRoles[referral.serviceType] || [];
  
  return staffList.map(staff => {
    const breakdown = {
      location: 0,
      availability: 0,
      credentials: 0,
      specialty: 0
    };

    // 1. Location proximity (30pts): exact match gives full points
    const locationMatch = staff.location && referral.dischargeFacility.includes(staff.location);
    breakdown.location = locationMatch ? 30 : 0;

    // 2. Availability (30pts): Available=30, Partially=15, Unavailable=0
    switch (staff.availability) {
      case 'Available': breakdown.availability = 30; break;
      case 'Partially': breakdown.availability = 15; break;
      default: breakdown.availability = 0;
    }

    // 3. Credentials match (20pts): role eligible for service type
    breakdown.credentials = eligibleRoles.includes(staff.role) ? 20 : 0;

    // 4. Specialty tags (20pts max): 10pts per matching specialty, up to 20
    const matchingSpecialties = staff.specialties.filter(spec => 
      spec.toLowerCase() === referral.serviceType.toLowerCase() ||
      spec.toLowerCase().includes(referral.serviceType.toLowerCase().split(' ')[0])
    );
    breakdown.specialty = Math.min(matchingSpecialties.length * 10, 20);

    const score = breakdown.location + breakdown.availability + breakdown.credentials + breakdown.specialty;

    return { staff, score, breakdown };
  })
  .filter(entry => entry.score > 0) // Only return staff with positive scores
  .sort((a, b) => b.score - a.score); // Highest score first
}

// --- 4) SOC Deadline Logic ---
/**
 * Calculate days until SOC deadline for referrals in 'Scheduled' stage
 * Returns null if referral is not in Scheduled stage or no discharge date
 */
export function getSOCDaysUntilDeadline(referral: Referral): number | null {
  if (referral.stage !== 'Scheduled') return null;
  if (!referral.dischargeDate) return null;
  
  return getDaysUntilExpiry(referral.dischargeDate);
}

/**
 * Get all Scheduled referrals with their SOC deadline days
 */
export function getScheduledReferralsWithSOCDeadlines(referrals: Referral[]): Array<Referral & { socDaysLeft: number | null }> {
  return referrals
    .filter(r => r.stage === 'Scheduled')
    .map(r => ({
      ...r,
      socDaysLeft: getSOCDaysUntilDeadline(r)
    }));
}

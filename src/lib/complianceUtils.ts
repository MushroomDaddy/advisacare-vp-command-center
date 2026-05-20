/**
 * Single source of truth for compliance status calculation.
 * Every component must use getComplianceCategory() instead of trusting stored status.
 *
 * Categories:
 *   Expired      — expiryDate is before today (days <= 0)
 *   Critical Soon — 0 < days <= 30
 *   Due Soon     — 31 <= days <= 90
 *   Compliant    — days > 90
 */
import type { ComplianceCategory, ComplianceItem, StaffMember } from '../types';

/** Days between today and the given ISO date string. Negative = past. */
export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Canonical compliance status — never trust stored `status` field. */
export function getComplianceCategory(expiryDate: string): ComplianceCategory {
  const days = daysUntil(expiryDate);
  if (days <= 0) return 'Expired';
  if (days <= 30) return 'Critical Soon';
  if (days <= 90) return 'Due Soon';
  return 'Compliant';
}

/** Convenience: get category for a ComplianceItem */
export function getItemCategory(item: ComplianceItem): ComplianceCategory {
  return getComplianceCategory(item.expiryDate);
}

/** Badge CSS class for a compliance category */
export function complianceBadgeClass(cat: ComplianceCategory): string {
  switch (cat) {
    case 'Expired': return 'badge-urgent';
    case 'Critical Soon': return 'badge-urgent';
    case 'Due Soon': return 'badge-warning';
    case 'Compliant': return 'badge-success';
  }
}

/** Check whether a staff member has ANY expired (blocking) credential */
export function hasBlockingCredential(
  staffId: string,
  compliance: ComplianceItem[]
): boolean {
  return compliance.some(
    c => c.staffId === staffId && getComplianceCategory(c.expiryDate) === 'Expired'
  );
}

/** Get all expired credential items for a staff member */
export function getExpiredCredentials(
  staffId: string,
  compliance: ComplianceItem[]
): ComplianceItem[] {
  return compliance.filter(
    c => c.staffId === staffId && getComplianceCategory(c.expiryDate) === 'Expired'
  );
}

/** Get staff display with their worst compliance status */
export function getStaffComplianceSummary(
  staff: StaffMember,
  compliance: ComplianceItem[]
): { worstCategory: ComplianceCategory; items: Array<ComplianceItem & { computedCategory: ComplianceCategory }> } {
  const items = compliance
    .filter(c => c.staffId === staff.id)
    .map(c => ({ ...c, computedCategory: getComplianceCategory(c.expiryDate) }));

  const priority: ComplianceCategory[] = ['Expired', 'Critical Soon', 'Due Soon', 'Compliant'];
  const worstCategory = priority.find(cat => items.some(i => i.computedCategory === cat)) || 'Compliant';

  return { worstCategory, items };
}

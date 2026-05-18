import type { AuditEntry, UserRole } from '../types';

export function canAccessRecord(
  userRole: UserRole,
  recordType: AuditEntry['recordType']
): boolean {
  const permissions: Record<UserRole, AuditEntry['recordType'][]> = {
    'VP': ['Referral', 'Staff', 'Compliance', 'Visit', 'Quality', 'Partner'],
    'Intake Coordinator': ['Referral', 'Quality', 'Partner'],
    'Scheduler': ['Referral', 'Staff', 'Visit'],
    'Field Staff': ['Visit'],
    'Compliance Admin': ['Compliance', 'Staff']
  };
  return permissions[userRole]?.includes(recordType) ?? false;
}

export function formatAuditAction(entry: AuditEntry): string {
  return `${entry.timestamp} - ${entry.user} (${entry.role}) ${entry.action} ${entry.recordType} ${entry.recordId}: ${entry.details}`;
}

import type { ComplianceItem, ComplianceStatus } from '../types';
import { isExpired, isDueSoon } from './dateUtils';

export function calculateComplianceStatus(item: ComplianceItem): ComplianceStatus {
  if (isExpired(item.expiryDate)) return 'Expired';
  if (isDueSoon(item.expiryDate)) return 'Due Soon';
  return 'Compliant';
}

export function getComplianceBadgeColor(status: ComplianceStatus): string {
  switch (status) {
    case 'Expired': return 'bg-red-100 text-red-800';
    case 'Due Soon': return 'bg-yellow-100 text-yellow-800';
    case 'Compliant': return 'bg-green-100 text-green-800';
  }
}

export function getComplianceTextColor(status: ComplianceStatus): string {
  switch (status) {
    case 'Expired': return 'text-red-600';
    case 'Due Soon': return 'text-yellow-600';
    case 'Compliant': return 'text-green-600';
  }
}

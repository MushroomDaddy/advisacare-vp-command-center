/**
 * Centralized record-source routing for Notification Center "View Source" links.
 * Keeps App.tsx component-only for React Fast Refresh, and gives tests/importers
 * one stable helper.
 */

const sourceRouteMap: Record<string, string> = {
  Referral: '/referrals',
  Staff: '/staffing',
  Compliance: '/compliance',
  Visit: '/field-assistant',
  Quality: '/quality',
  Partner: '/referral-partners',
  Shift: '/staffing',
  Document: '/referrals',
  Alert: '/',
  System: '/',
  CatastrophicCase: '/catastrophic-care',
};

const sourceParamMap: Record<string, string> = {
  Referral: 'ref',
  Compliance: 'item',
  Visit: 'visit',
  Quality: 'qid',
  Partner: 'partner',
  Shift: 'shift',
  Document: 'doc',
  CatastrophicCase: 'case',
};

export interface AlertLinkSource {
  type: string;
  sourceRecordType: string;
  sourceRecordId: string;
  metadata?: { caseId?: string };
}

export function resolveAlertHref(alert: AlertLinkSource): string {
  if (alert.metadata?.caseId) {
    return `/catastrophic-care?case=${encodeURIComponent(alert.metadata.caseId)}`;
  }

  if (alert.type && alert.type.startsWith('Catastrophic ')) {
    return '/catastrophic-care';
  }

  const basePath = sourceRouteMap[alert.sourceRecordType] || '/';
  const paramKey = sourceParamMap[alert.sourceRecordType];

  return paramKey
    ? `${basePath}?${paramKey}=${encodeURIComponent(alert.sourceRecordId)}`
    : basePath;
}

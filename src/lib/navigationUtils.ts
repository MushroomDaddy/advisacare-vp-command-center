/**
 * Navigation utilities — pure functions for computing View Source destinations
 * from alerts. Lives in `src/lib/` so it can be imported by App.tsx, the
 * NotificationCenter, and tests without bouncing through a React component
 * module (which would violate react-refresh/only-export-components).
 */

/**
 * Map sourceRecordType → base route path.
 * View Source appends query params for exact record navigation.
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
};

/** Query param keys per source record type for View Source deep linking. */
const sourceParamMap: Record<string, string> = {
  Referral: 'ref',
  Compliance: 'item',
  Visit: 'visit',
  Quality: 'qid',
  Partner: 'partner',
  Shift: 'shift',
  Document: 'doc',
};

/**
 * Given an alert, compute the View Source destination.
 *
 *  - Catastrophic-flagged shift alerts (metadata.caseId present, or type starts
 *    with "Catastrophic ") route to /catastrophic-care?case=CASE_ID.
 *  - Plain shift alerts route to /staffing?shift=SHIFT_ID.
 *  - Everything else uses the source-record maps above.
 *
 * Centralised so the notification center, any other consumer, and tests
 * share the same logic.
 */
export function resolveAlertHref(alert: {
  type: string;
  sourceRecordType: string;
  sourceRecordId: string;
  metadata?: { caseId?: string };
}): string {
  if (alert.metadata?.caseId) {
    return `/catastrophic-care?case=${encodeURIComponent(alert.metadata.caseId)}`;
  }
  if (alert.type && alert.type.startsWith('Catastrophic ')) {
    // Catastrophic alert without metadata — fall back to the catastrophic page.
    return `/catastrophic-care`;
  }
  const basePath = sourceRouteMap[alert.sourceRecordType] || '/';
  const paramKey = sourceParamMap[alert.sourceRecordType];
  return paramKey
    ? `${basePath}?${paramKey}=${encodeURIComponent(alert.sourceRecordId)}`
    : basePath;
}

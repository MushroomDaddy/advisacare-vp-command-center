/**
 * Alert Engine — derives alerts from live application state.
 *
 * Deduplication key: `${type}::${sourceRecordType}::${sourceRecordId}`
 * Auto-resolve: when the underlying issue no longer exists, the alert is resolved.
 */
import type { AppState, Alert, AlertSeverity } from '../types';
import { getComplianceCategory, daysUntil } from './complianceUtils';

interface DerivedAlert {
  type: string;
  severity: AlertSeverity;
  message: string;
  sourceRecordType: Alert['sourceRecordType'];
  sourceRecordId: string;
}

/** Generate the dedup key for an alert */
export function alertKey(type: string, sourceRecordType: string, sourceRecordId: string): string {
  return `${type}::${sourceRecordType}::${sourceRecordId}`;
}

/** Derive the full set of alerts that SHOULD exist from current state */
export function deriveAlerts(state: AppState): DerivedAlert[] {
  const derived: DerivedAlert[] = [];

  // 1. Expired credentials
  for (const item of state.compliance) {
    const cat = getComplianceCategory(item.expiryDate);
    if (cat === 'Expired') {
      derived.push({
        type: 'Expired Credential',
        severity: 'High',
        message: `${item.staffName} — ${item.itemType} expired`,
        sourceRecordType: 'Compliance',
        sourceRecordId: item.id,
      });
    }
    // 2. Critical Soon credentials
    if (cat === 'Critical Soon') {
      derived.push({
        type: 'Critical Soon Credential',
        severity: 'Medium',
        message: `${item.staffName} — ${item.itemType} expires within 30 days`,
        sourceRecordType: 'Compliance',
        sourceRecordId: item.id,
      });
    }
  }

  // 3. Missing documents on active referrals
  for (const ref of state.referrals) {
    if (ref.stage === 'Missing Docs' && ref.missingItems.length > 0) {
      derived.push({
        type: 'Missing Documents',
        severity: ref.urgency === 'Immediate' ? 'Critical' : 'High',
        message: `${ref.patientInitials} — missing: ${ref.missingItems.join(', ')}`,
        sourceRecordType: 'Referral',
        sourceRecordId: ref.id,
      });
    }
  }

  // 4. SLA Risk and SLA Breach
  for (const ref of state.referrals) {
    if (ref.slaDeadline && ref.stage !== 'Started' && ref.stage !== 'Declined') {
      const hoursLeft = (new Date(ref.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursLeft <= 0) {
        derived.push({
          type: 'SLA Breach',
          severity: 'Critical',
          message: `${ref.patientInitials} — SLA deadline breached`,
          sourceRecordType: 'Referral',
          sourceRecordId: ref.id,
        });
      } else if (hoursLeft <= 24) {
        derived.push({
          type: 'SLA Risk',
          severity: 'High',
          message: `${ref.patientInitials} — SLA deadline in ${Math.round(hoursLeft)}h`,
          sourceRecordType: 'Referral',
          sourceRecordId: ref.id,
        });
      }
    }
  }

  // 5. Open shifts
  for (const shift of state.shifts) {
    if (shift.status === 'Open') {
      const isCatastrophic = shift.serviceType === 'Catastrophic Injury Care';
      derived.push({
        type: isCatastrophic ? 'Catastrophic Uncovered Shift' : 'Open Shift',
        severity: isCatastrophic ? 'Critical' : 'High',
        message: `${isCatastrophic ? 'CATASTROPHIC: ' : ''}Uncovered shift for ${shift.patientInitials} — ${shift.serviceType}`,
        sourceRecordType: 'Shift',
        sourceRecordId: shift.id,
      });
    }
  }

  // 6. EVV exceptions
  for (const visit of state.visits) {
    if (visit.evvStatus === 'Exception' && visit.evvException) {
      derived.push({
        type: 'EVV Exception',
        severity: 'Medium',
        message: `EVV exception for ${visit.patientInitials}: ${visit.evvException}`,
        sourceRecordType: 'Visit',
        sourceRecordId: visit.id,
      });
    }
  }

  // 7. Quality: OASIS rejected
  for (const q of state.quality) {
    if ((q.type === 'OASIS Due' || q.type === 'OASIS Review') && q.status === 'Rejected') {
      derived.push({
        type: 'OASIS Rejected',
        severity: 'High',
        message: `OASIS rejected for ${q.patientInitials}`,
        sourceRecordType: 'Quality',
        sourceRecordId: q.id,
      });
    }
  }

  // 8. HOPE Overdue
  for (const q of state.quality) {
    if (q.type === 'HOPE Assessment' && q.status === 'Open' && daysUntil(q.dueDate) < 0) {
      derived.push({
        type: 'HOPE Overdue',
        severity: 'High',
        message: `HOPE Assessment overdue for ${q.patientInitials}`,
        sourceRecordType: 'Quality',
        sourceRecordId: q.id,
      });
    }
  }

  // 9. Partner follow-up overdue
  for (const partner of state.partners) {
    if (partner.nextFollowUp && daysUntil(partner.nextFollowUp) < 0) {
      derived.push({
        type: 'Partner Follow-up Overdue',
        severity: 'Medium',
        message: `${partner.name} follow-up overdue`,
        sourceRecordType: 'Partner',
        sourceRecordId: partner.id,
      });
    }
  }

  // 10. Staffing urgency alerts for referrals in Staffing stage
  for (const ref of state.referrals) {
    if (ref.stage === 'Staffing' && (ref.urgency === 'Immediate' || ref.urgency === 'Urgent 24-48 hours')) {
      derived.push({
        type: 'Staffing',
        severity: ref.urgency === 'Immediate' ? 'Critical' : 'High',
        message: `${ref.patientInitials} needs staffing — ${ref.urgency}`,
        sourceRecordType: 'Referral',
        sourceRecordId: ref.id,
      });
    }
  }

  return derived;
}

/**
 * Reconcile derived alerts with existing alerts.
 * - New derived alerts not in existing → create
 * - Existing alerts whose derived version no longer exists → auto-resolve
 * - Existing resolved/acknowledged alerts remain as-is
 * Returns the new alerts array.
 */
export function reconcileAlerts(
  existingAlerts: Alert[],
  derivedAlerts: DerivedAlert[]
): Alert[] {
  const derivedKeys = new Set(
    derivedAlerts.map(d => alertKey(d.type, d.sourceRecordType, d.sourceRecordId))
  );

  const existingByKey = new Map<string, Alert>();
  for (const alert of existingAlerts) {
    existingByKey.set(alertKey(alert.type, alert.sourceRecordType, alert.sourceRecordId), alert);
  }

  const result: Alert[] = [];

  // Keep existing alerts, auto-resolve if no longer derived
  for (const alert of existingAlerts) {
    const key = alertKey(alert.type, alert.sourceRecordType, alert.sourceRecordId);
    if (!derivedKeys.has(key) && !alert.resolved) {
      // Auto-resolve
      result.push({ ...alert, resolved: true, resolvedAt: new Date().toISOString() });
    } else {
      result.push(alert);
    }
  }

  // Add new derived alerts not already existing
  for (const derived of derivedAlerts) {
    const key = alertKey(derived.type, derived.sourceRecordType, derived.sourceRecordId);
    if (!existingByKey.has(key)) {
      result.push({
        id: `al_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...derived,
        acknowledged: false,
        resolved: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return result;
}

/** Count of active (unresolved AND unacknowledged) alerts */
export function activeAlertCount(alerts: Alert[]): number {
  return alerts.filter(a => !a.resolved && !a.acknowledged).length;
}

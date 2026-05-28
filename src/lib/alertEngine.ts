/**
 * Alert Engine — derives alerts from live application state.
 *
 * Deduplication key: `${type}::${sourceRecordType}::${sourceRecordId}`
 * Auto-resolve: when the underlying issue no longer exists, the alert is resolved.
 * Auto-reactivate: when a manually-resolved alert's underlying issue still exists, it reactivates.
 */
import type { AppState, Alert, AlertSeverity, AlertType } from '../types';
import { getComplianceCategory, daysUntil } from './complianceUtils';

interface DerivedAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  sourceRecordType: Alert['sourceRecordType'];
  sourceRecordId: string;
  metadata?: Alert['metadata'];
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

  // 5. Open shifts. Catastrophic shifts carry caseId metadata for proper routing.
  // Map referralId → catastrophic case id once for O(1) lookup.
  const caseByReferral = new Map<string, string>();
  for (const cc of state.catastrophicCases || []) {
    caseByReferral.set(cc.referralId, cc.id);
  }

  for (const shift of state.shifts) {
    if (shift.status === 'Open') {
      const isCatastrophic = shift.serviceType === 'Catastrophic Injury Care';
      const caseId = caseByReferral.get(shift.referralId);
      derived.push({
        type: isCatastrophic ? 'Catastrophic Uncovered Shift' : 'Open Shift',
        severity: isCatastrophic ? 'Critical' : 'High',
        message: `${isCatastrophic ? 'CATASTROPHIC: ' : ''}Uncovered shift for ${shift.patientInitials} — ${shift.serviceType}`,
        sourceRecordType: 'Shift',
        sourceRecordId: shift.id,
        ...(caseId ? { metadata: { caseId } } : {}),
      });
    }
  }

  // 6. Visit verification exceptions
  for (const visit of state.visits) {
    if (visit.evvStatus === 'Exception' && visit.evvException) {
      derived.push({
        type: 'Visit Verification Exception',
        severity: 'Medium',
        message: `Visit Verification Exception for ${visit.patientInitials}: ${visit.evvException}`,
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
 *
 * Rules:
 *  - Derived but NOT existing → CREATE
 *  - Existing AND derived AND resolved → REACTIVATE (the underlying issue still exists,
 *    so a manual resolve cannot stick)
 *  - Existing AND NOT derived AND NOT resolved → AUTO-RESOLVE
 *  - Otherwise → leave alert as-is (acknowledgements are preserved; metadata refreshed)
 *
 * This guarantees Fix #1: a manually-resolved alert whose source problem still exists
 * will be re-surfaced on the next reconcile pass.
 */
export function reconcileAlerts(
  existingAlerts: Alert[],
  derivedAlerts: DerivedAlert[]
): Alert[] {
  // Index derived alerts by key for O(1) lookup
  const derivedByKey = new Map<string, DerivedAlert>();
  for (const d of derivedAlerts) {
    derivedByKey.set(alertKey(d.type, d.sourceRecordType, d.sourceRecordId), d);
  }

  const existingByKey = new Map<string, Alert>();
  for (const alert of existingAlerts) {
    existingByKey.set(alertKey(alert.type, alert.sourceRecordType, alert.sourceRecordId), alert);
  }

  const result: Alert[] = [];
  const now = new Date().toISOString();

  for (const alert of existingAlerts) {
    const key = alertKey(alert.type, alert.sourceRecordType, alert.sourceRecordId);
    const derived = derivedByKey.get(key);
    const stillActive = !!derived;

    if (!stillActive && !alert.resolved) {
      // Auto-resolve: the underlying issue has gone away
      result.push({ ...alert, resolved: true, resolvedAt: now });
    } else if (stillActive && alert.resolved) {
      // REACTIVATE: the underlying issue still exists, so the manual resolve
      // cannot stick. Acknowledgement is also cleared so the user is re-prompted.
      result.push({
        ...alert,
        resolved: false,
        resolvedAt: undefined,
        acknowledged: false,
        acknowledgedAt: undefined,
        reactivatedAt: now,
        // Refresh message/severity/metadata from derivation in case state changed
        message: derived.message,
        severity: derived.severity,
        ...(derived.metadata ? { metadata: derived.metadata } : {}),
      });
    } else if (stillActive && derived.metadata && !alert.metadata) {
      // Backfill metadata onto an alert that pre-dates the metadata field
      result.push({ ...alert, metadata: derived.metadata });
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
        type: derived.type,
        severity: derived.severity,
        message: derived.message,
        sourceRecordType: derived.sourceRecordType,
        sourceRecordId: derived.sourceRecordId,
        ...(derived.metadata ? { metadata: derived.metadata } : {}),
        acknowledged: false,
        resolved: false,
        createdAt: now,
      });
    }
  }

  return result;
}

/** Count of active (unresolved AND unacknowledged) alerts */
export function activeAlertCount(alerts: Alert[]): number {
  return alerts.filter(a => !a.resolved && !a.acknowledged).length;
}

/**
 * Predicate used by tests and external callers: given current state, does the
 * underlying problem for this alert still exist?
 */
export function isAlertStillActive(alert: Alert, state: AppState): boolean {
  const derived = deriveAlerts(state);
  const key = alertKey(alert.type, alert.sourceRecordType, alert.sourceRecordId);
  return derived.some(d => alertKey(d.type, d.sourceRecordType, d.sourceRecordId) === key);
}

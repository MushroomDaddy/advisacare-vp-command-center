// ==============================
// Alert Engine — Derives alerts from live application state
// ==============================

import type {
  AppState, AlertItem, AlertType, AlertSeverity,
} from '../types';
import { getSLACategoryFromISO, getComplianceStatus } from './dataLogic';

export interface DerivedAlert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  details: string;
  sourceRecordType: string;
  sourceRecordId: string;
  owner: string;
  recommendedAction: string;
}

/** Unique key used for deduplication. */
function alertKey(type: AlertType, sourceRecordId: string): string {
  return `${type}::${sourceRecordId}`;
}

/** Generate all derived alerts from current state. */
export function generateDerivedAlerts(state: AppState): DerivedAlert[] {
  const alerts: DerivedAlert[] = [];
  const now = new Date();

  // --- SLA breach / risk ---
  for (const r of state.referrals) {
    if (r.stage === 'Started' || r.stage === 'Declined') continue;
    const cat = getSLACategoryFromISO(r.slaDeadlineAt);
    if (cat === 'Breach') {
      alerts.push({
        type: 'sla_breach', severity: 'critical',
        title: `SLA Breach: ${r.patientInitials} — ${r.serviceType}`,
        details: `SLA deadline has passed. Immediate action required.`,
        sourceRecordType: 'Referral', sourceRecordId: r.id,
        owner: r.assignedOwner,
        recommendedAction: 'Escalate referral and expedite staffing/SOC visit.',
      });
    } else if (cat === 'Risk') {
      alerts.push({
        type: 'sla_risk', severity: 'high',
        title: `SLA Risk: ${r.patientInitials} — ${r.serviceType}`,
        details: `SLA deadline within 24 hours.`,
        sourceRecordType: 'Referral', sourceRecordId: r.id,
        owner: r.assignedOwner,
        recommendedAction: 'Prioritize to avoid SLA breach.',
      });
    }
  }

  // --- Expired / critical-soon credentials ---
  for (const c of state.compliance) {
    const status = getComplianceStatus(c);
    if (status === 'Expired') {
      alerts.push({
        type: 'expired_credential', severity: 'critical',
        title: `Expired: ${c.staffName} — ${c.itemType}`,
        details: `${c.itemType} has expired. ${c.staffName} cannot be assigned to visits.`,
        sourceRecordType: 'Compliance', sourceRecordId: c.id,
        owner: 'Compliance Admin',
        recommendedAction: `Renew ${c.itemType} for ${c.staffName} immediately.`,
      });
    } else if (status === 'Critical Soon') {
      alerts.push({
        type: 'critical_soon_credential', severity: 'high',
        title: `Expiring Soon: ${c.staffName} — ${c.itemType}`,
        details: `${c.itemType} expires within 30 days.`,
        sourceRecordType: 'Compliance', sourceRecordId: c.id,
        owner: 'Compliance Admin',
        recommendedAction: `Schedule renewal for ${c.staffName}'s ${c.itemType}.`,
      });
    }
  }

  // --- Uncovered high-acuity ---
  for (const r of state.referrals) {
    if (r.urgency === 'Immediate' && r.stage === 'Staffing') {
      alerts.push({
        type: 'uncovered_high_acuity', severity: 'critical',
        title: `Uncovered: ${r.patientInitials} — Immediate ${r.serviceType}`,
        details: `High-acuity patient in Staffing stage without assigned clinician.`,
        sourceRecordType: 'Referral', sourceRecordId: r.id,
        owner: r.assignedOwner,
        recommendedAction: 'Assign qualified clinician immediately.',
      });
    }
  }

  // --- Late notes ---
  for (const q of state.quality) {
    if (q.type === 'Late Note' && q.status !== 'Complete') {
      alerts.push({
        type: 'late_note', severity: 'medium',
        title: `Late Note: ${q.patientInitials} — ${q.assignedTo}`,
        details: `Documentation note overdue.`,
        sourceRecordType: 'Quality', sourceRecordId: q.id,
        owner: q.assignedTo,
        recommendedAction: 'Complete documentation note immediately.',
      });
    }
  }

  // --- Missed visits ---
  for (const v of state.visits) {
    if (v.visitStatus === 'Missed') {
      alerts.push({
        type: 'missed_visit', severity: 'high',
        title: `Missed Visit: ${v.patientInitials} — ${v.staffName}`,
        details: `Visit was missed. Rescheduling required.`,
        sourceRecordType: 'Visit', sourceRecordId: v.id,
        owner: v.staffName,
        recommendedAction: 'Reschedule visit and document reason for miss.',
      });
    }
  }

  // --- Rejected OASIS ---
  for (const o of state.oasisAssessments) {
    if (o.status === 'Rejected') {
      alerts.push({
        type: 'rejected_oasis', severity: 'high',
        title: `Rejected OASIS: ${o.patientInitials} — ${o.type}`,
        details: `OASIS ${o.type} was rejected. ${o.rejectionReason || ''}`.trim(),
        sourceRecordType: 'Quality', sourceRecordId: o.id,
        owner: o.assignedTo,
        recommendedAction: 'Correct and resubmit OASIS assessment.',
      });
    }
  }

  // --- Overdue OASIS ---
  for (const o of state.oasisAssessments) {
    if (o.status === 'Due' && new Date(o.dueDate) < now) {
      alerts.push({
        type: 'overdue_oasis', severity: 'high',
        title: `Overdue OASIS: ${o.patientInitials} — ${o.type}`,
        details: `OASIS ${o.type} is past due date.`,
        sourceRecordType: 'Quality', sourceRecordId: o.id,
        owner: o.assignedTo,
        recommendedAction: 'Complete and submit OASIS assessment.',
      });
    }
  }

  // --- Overdue HOPE ---
  for (const h of state.hopeAssessments) {
    if (h.status === 'Due' && new Date(h.dueDate) < now) {
      alerts.push({
        type: 'overdue_hope', severity: 'medium',
        title: `Overdue HOPE: ${h.patientInitials} — ${h.type}`,
        details: `HOPE ${h.type} is past due date.`,
        sourceRecordType: 'Quality', sourceRecordId: h.id,
        owner: h.assignedTo,
        recommendedAction: 'Complete HOPE assessment and submit to iQIES.',
      });
    }
  }

  // --- EVV exceptions (unresolved) ---
  for (const v of state.visits) {
    for (const exc of v.evvExceptions) {
      if (!exc.resolvedAt) {
        alerts.push({
          type: 'evv_exception', severity: 'medium',
          title: `EVV Exception: ${v.patientInitials} — ${exc.type}`,
          details: `${exc.reason}`,
          sourceRecordType: 'Visit', sourceRecordId: v.id,
          owner: v.staffName,
          recommendedAction: 'Resolve EVV exception and verify documentation.',
        });
      }
    }
  }

  // --- Partner follow-up due ---
  const todayStr = now.toISOString().split('T')[0];
  for (const p of state.partners) {
    if (p.nextFollowUpReminder <= todayStr) {
      alerts.push({
        type: 'partner_followup_due', severity: 'low',
        title: `Follow-up Due: ${p.name}`,
        details: `Partner follow-up is due. Last: ${p.lastFollowUp}.`,
        sourceRecordType: 'Partner', sourceRecordId: p.id,
        owner: p.relationshipOwner,
        recommendedAction: 'Complete partner follow-up and record outcome.',
      });
    }
  }

  return alerts;
}

/**
 * Reconcile derived alerts with the existing alert list.
 * - New derived alerts that don't exist yet are added.
 * - Existing acknowledged alerts stay acknowledged unless the problem is gone.
 * - Alerts whose underlying problem resolved are marked resolved.
 * - Deduplication by type + sourceRecordId.
 */
export function reconcileAlerts(
  existingAlerts: AlertItem[],
  derivedAlerts: DerivedAlert[],
): AlertItem[] {
  const existingByKey = new Map<string, AlertItem>();
  for (const a of existingAlerts) {
    if (a.sourceRecordId && a.type) {
      existingByKey.set(alertKey(a.type, a.sourceRecordId), a);
    }
  }

  const result: AlertItem[] = [];
  const seenKeys = new Set<string>();

  // Process derived alerts
  for (const d of derivedAlerts) {
    const key = alertKey(d.type, d.sourceRecordId);
    if (seenKeys.has(key)) continue; // dedupe
    seenKeys.add(key);

    const existing = existingByKey.get(key);
    if (existing) {
      // Alert still active; keep acknowledged state
      result.push({
        ...existing,
        title: d.title,
        details: d.details,
        severity: d.severity,
        owner: d.owner,
        recommendedAction: d.recommendedAction,
        resolved: false,
        resolvedAt: undefined,
      });
    } else {
      // New alert
      result.push({
        id: 'al_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type: d.type,
        severity: d.severity,
        title: d.title,
        details: d.details,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        sourceRecordType: d.sourceRecordType,
        sourceRecordId: d.sourceRecordId,
        owner: d.owner,
        recommendedAction: d.recommendedAction,
        resolved: false,
      });
    }
  }

  // Keep existing alerts that are no longer derived → mark resolved
  for (const a of existingAlerts) {
    const key = a.sourceRecordId && a.type ? alertKey(a.type, a.sourceRecordId) : '';
    if (key && !seenKeys.has(key)) {
      // incident/escalation alerts are manual, always keep
      if (a.type === 'incident' || a.type === 'escalation') {
        result.push(a);
      } else if (!a.resolved) {
        result.push({ ...a, resolved: true, resolvedAt: new Date().toISOString() });
      } else {
        result.push(a);
      }
      seenKeys.add(key);
    }
    // If no sourceRecordId (manual alerts), keep them
    if (!a.sourceRecordId || !a.type) {
      result.push(a);
    }
  }

  return result;
}

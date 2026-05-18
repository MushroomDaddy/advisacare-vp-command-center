import { describe, test, expect } from 'vitest';
import { generateDerivedAlerts, reconcileAlerts } from '../utils/alertEngine';
import type { AlertItem, AppState } from '../types';
import {
  seedReferrals, seedStaff, seedCompliance, seedVisits,
  seedQuality, seedOASIS, seedHOPE, seedPartners, seedCatastrophicCases,
  seedAuditLog, seedAlerts,
} from '../data/seedData';

const testState: AppState = {
  currentUser: { name: 'VP User', role: 'VP', initials: 'VP' },
  referrals: seedReferrals,
  staff: seedStaff,
  compliance: seedCompliance,
  visits: seedVisits,
  quality: seedQuality,
  oasisAssessments: seedOASIS,
  hopeAssessments: seedHOPE,
  partners: seedPartners,
  catastrophicCases: seedCatastrophicCases,
  auditLog: seedAuditLog,
  alerts: seedAlerts,
  shiftBoard: [],
  offlineSyncQueue: [],
  toasts: [],
  lastRefreshed: new Date().toISOString(),
};

describe('Alert Engine', () => {
  test('generates derived alerts from seed data', () => {
    const alerts = generateDerivedAlerts(testState);
    expect(alerts.length).toBeGreaterThan(0);
    for (const a of alerts) {
      expect(a.type).toBeDefined();
      expect(a.severity).toBeDefined();
      expect(a.title).toBeDefined();
      expect(a.sourceRecordId).toBeDefined();
      expect(a.sourceRecordType).toBeDefined();
    }
  });

  test('deduplicates alerts by type + sourceRecordId', () => {
    const alerts = generateDerivedAlerts(testState);
    const keys = alerts.map(a => `${a.type}:${a.sourceRecordId}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  test('reconcileAlerts preserves acknowledged state', () => {
    const derived = generateDerivedAlerts(testState);
    const firstRun = reconcileAlerts([], derived);
    expect(firstRun.length).toBeGreaterThan(0);

    // Acknowledge one alert
    const acked: AlertItem[] = firstRun.map((a, i) =>
      i === 0 ? { ...a, acknowledged: true, acknowledgedBy: 'VP', acknowledgedAt: new Date().toISOString() } : a
    );

    // Reconcile again with same derived
    const secondRun = reconcileAlerts(acked, derived);
    const ackedAlert = secondRun.find(a => a.id === firstRun[0].id);
    expect(ackedAlert?.acknowledged).toBe(true);
    expect(ackedAlert?.acknowledgedBy).toBe('VP');
  });

  test('reconcileAlerts marks resolved when problem disappears', () => {
    const derived = generateDerivedAlerts(testState);
    const firstRun = reconcileAlerts([], derived);

    // Reconcile with empty derived = all problems resolved
    const resolved = reconcileAlerts(firstRun, []);
    const resolvedAlerts = resolved.filter(a => a.resolved);
    expect(resolvedAlerts.length).toBeGreaterThan(0);
  });

  test('new alerts get unique IDs', () => {
    const derived = generateDerivedAlerts(testState);
    const alerts = reconcileAlerts([], derived);
    const ids = alerts.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

import { describe, it, expect } from 'vitest';
import { getSeedState, getInitialState, exportStateJSON, importStateJSON } from '../data/seedData';

describe('seedData', () => {
  it('getSeedState returns valid state with all collections', () => {
    const state = getSeedState();
    expect(state.referrals.length).toBeGreaterThan(0);
    expect(state.staff.length).toBeGreaterThan(0);
    expect(state.compliance.length).toBeGreaterThan(0);
    expect(state.visits.length).toBeGreaterThan(0);
    expect(state.quality.length).toBeGreaterThan(0);
    expect(state.partners.length).toBeGreaterThan(0);
    expect(state.shifts.length).toBeGreaterThan(0);
    expect(state.auditLog.length).toBeGreaterThan(0);
    expect(state.alerts.length).toBeGreaterThan(0);
    expect(state.documents.length).toBeGreaterThan(0);
    expect(state.productionReadiness.length).toBeGreaterThan(0);
    expect(state.currentUser.role).toBe('VP');
  });

  it('getInitialState returns seed state when no localStorage', () => {
    const state = getInitialState();
    expect(state.referrals.length).toBeGreaterThan(0);
  });

  it('exportStateJSON produces valid JSON', () => {
    const state = getSeedState();
    const json = exportStateJSON(state);
    const parsed = JSON.parse(json);
    expect(parsed.referrals).toBeDefined();
    expect(parsed.staff).toBeDefined();
  });

  it('importStateJSON roundtrips correctly', () => {
    const state = getSeedState();
    const json = exportStateJSON(state);
    const restored = importStateJSON(json);
    expect(restored).not.toBeNull();
    expect(restored!.referrals.length).toBe(state.referrals.length);
    expect(restored!.staff.length).toBe(state.staff.length);
  });

  it('importStateJSON returns null on bad JSON', () => {
    expect(importStateJSON('not json')).toBeNull();
    expect(importStateJSON('{}')).toBeNull();
  });

  it('all referrals have stageTimestamps and timeline', () => {
    const state = getSeedState();
    for (const r of state.referrals) {
      expect(r.stageTimestamps).toBeDefined();
      expect(r.timeline.length).toBeGreaterThan(0);
    }
  });

  it('all alerts have required fields', () => {
    const state = getSeedState();
    for (const a of state.alerts) {
      expect(a.id).toBeDefined();
      expect(a.type).toBeDefined();
      expect(a.severity).toBeDefined();
      expect(a.message).toBeDefined();
      expect(typeof a.acknowledged).toBe('boolean');
      expect(typeof a.resolved).toBe('boolean');
    }
  });
});

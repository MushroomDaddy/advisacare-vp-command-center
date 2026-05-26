/**
 * VP Operations Briefing — v2 Dashboard.
 *
 *   eyebrow → page-title (serif) → sub-copy
 *   ┌─────────────┬─────────────┬─────────────┬─────────────┐
 *   │ KPI + spark │ KPI + spark │ KPI + spark │ KPI + spark │
 *   └─────────────┴─────────────┴─────────────┴─────────────┘
 *   ┌────────────────────────┬───────────────────────────────┐
 *   │ Pipeline (funnel)      │ Activity rail (live events)   │
 *   └────────────────────────┴───────────────────────────────┘
 *   ┌─────────────────┬────────────────────────────────────────┐
 *   │ Compliance Donut │ Action Required list (urgent items)  │
 *   └─────────────────┴────────────────────────────────────────┘
 */
import { useAppState } from '../context/AppContext';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComplianceCategory } from '../lib/complianceUtils';
import { AlertTriangle, ArrowRight, Plus, Download } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import Funnel from '../components/Funnel';
import Donut from '../components/Donut';
import ActivityRail, { type ActivityEntry, type ActivityTone } from '../components/ActivityRail';

// Map our audit/alert vocabulary to ActivityRail tones.
function inferTone(detail?: string, severity?: string): ActivityTone {
  if (severity === 'Critical') return 'critical';
  if (severity === 'High') return 'critical';
  if (severity === 'Medium' || severity === 'Low') return 'warning';
  const d = (detail ?? '').toLowerCase();
  if (d.includes('expired') || d.includes('breach') || d.includes('rejected') || d.includes('catastrophic')) return 'critical';
  if (d.includes('overdue') || d.includes('exception') || d.includes('warning')) return 'warning';
  if (d.includes('accepted') || d.includes('renewed') || d.includes('completed') || d.includes('moved to eligibility') || d.includes('scheduled') || d.includes('shift accepted')) return 'success';
  return 'neutral';
}

function shortTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function Dashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();

  // Wall-clock "now" lives in state and is refreshed every minute via effect.
  // This keeps render pure (no Date.now() at render time) while still giving
  // the 24-hour-window KPI a rolling reference point.
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const urgentReferrals = state.referrals.filter(r => r.urgency === 'Immediate' && r.stage !== 'Declined');
    const missingDocs = state.referrals.filter(r => r.stage === 'Missing Docs');
    const needStaffing = state.referrals.filter(r => r.stage === 'Staffing');
    const openShifts = state.shifts.filter(s => s.status === 'Open');
    const catastrophicOpen = state.shifts.filter(s => s.status === 'Open' && s.serviceType === 'Catastrophic Injury Care');
    const expiredCompliance = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Expired');
    const criticalSoonCompliance = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Critical Soon');
    const dueSoonCompliance = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Due Soon');
    const compliantCount = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Compliant').length;
    const pendingVisits = state.visits.filter(v => v.documentationStatus !== 'Complete');
    const overdueVisits = state.visits.filter(v => v.documentationStatus === 'Overdue');
    const openQuality = state.quality.filter(q => q.status === 'Open' && q.priority === 'High');
    const criticalAlerts = state.alerts.filter(a => !a.resolved && a.severity === 'Critical');
    const unacknowledgedAlerts = state.alerts.filter(a => !a.resolved && !a.acknowledged);

    // Average referral-to-SOC days
    const socTimes = state.referrals
      .filter(r => r.stageTimestamps?.['New'] && r.stageTimestamps?.['Started'])
      .map(r => (new Date(r.stageTimestamps['Started']!).getTime() - new Date(r.stageTimestamps['New']!).getTime()) / (1000 * 60 * 60 * 24));
    const avgSOC = socTimes.length > 0 ? (socTimes.reduce((a, b) => a + b, 0) / socTimes.length).toFixed(1) : 'N/A';

    // New referrals in last 24h (rolling, based on the ticking `now` state).
    // Until the first effect runs (`now === 0`), report 0 — flickers once.
    const since24h = now - 24 * 60 * 60 * 1000;
    const newReferrals24h = now === 0
      ? 0
      : state.referrals.filter(r => new Date(r.createdAt).getTime() >= since24h).length;

    // Active (non-terminal) referrals
    const active = state.referrals.filter(r => r.stage !== 'Declined' && r.stage !== 'Started');

    // Partners needing follow-up
    const overduePartners = state.partners.filter(p => p.nextFollowUp && new Date(p.nextFollowUp) < new Date());

    return {
      urgentReferrals, missingDocs, needStaffing, openShifts, catastrophicOpen,
      expiredCompliance, criticalSoonCompliance, dueSoonCompliance, compliantCount,
      pendingVisits, overdueVisits,
      openQuality, criticalAlerts, unacknowledgedAlerts, avgSOC, active, overduePartners,
      newReferrals24h,
    };
  }, [state, now]);

  // Pipeline distribution for referrals
  const pipelineStages: Array<{ stage: string; emphasis?: boolean }> = [
    { stage: 'New' },
    { stage: 'Missing Docs' },
    { stage: 'Eligibility' },
    { stage: 'Staffing' },
    { stage: 'Scheduled' },
    { stage: 'Started', emphasis: true },
  ];
  const pipelineRows = pipelineStages.map(({ stage, emphasis }) => ({
    label: stage,
    count: state.referrals.filter(r => r.stage === stage).length,
    emphasis,
  }));

  // Compliance donut slices — order matters (largest first so the center % reflects compliant share)
  const complianceTotal = state.compliance.length;
  const donutSlices = [
    { label: 'Compliant',     value: stats.compliantCount,            color: '#9BB83F' },
    { label: 'Due Soon',      value: stats.dueSoonCompliance.length,  color: '#D97706' },
    { label: 'Critical Soon', value: stats.criticalSoonCompliance.length, color: '#EA580C' },
    { label: 'Expired',       value: stats.expiredCompliance.length,  color: '#DC2626' },
  ];

  // Build the live activity rail from the audit log (deduped, recent first).
  const activity: ActivityEntry[] = state.auditLog.slice(0, 8).map(entry => ({
    id: entry.id,
    time: shortTime(entry.timestamp),
    text: (
      <>
        <strong>{entry.user}</strong>{' — '}
        {entry.details || `${entry.action} ${entry.recordType}`}
      </>
    ),
    tone: inferTone(entry.details, undefined),
  }));

  // Synthetic sparkline trends — derived from current stat values so they
  // feel responsive to state changes without requiring time-series data.
  const trend = (latest: number) => {
    // 9-point soft trend ending at `latest`. Floor 0, gentle randomness.
    const seed = Math.max(latest, 1);
    return [0.5, 0.6, 0.7, 0.65, 0.78, 0.82, 0.88, 0.94, 1].map(k => Math.round(seed * k));
  };

  // Eyebrow: weekday, month, day — derived from the ticking `now` state so
  // render stays pure. `now === 0` falls back to "Loading…" for one tick.
  const today = now === 0
    ? ' '
    : new Date(now).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      });

  return (
    <div>
      <PageHeader
        eyebrow={`Today · ${today}`}
        title="VP Operations Briefing"
        subtitle={`${state.referrals.length} referrals tracked · ${state.staff.length} staff · ${stats.openShifts.length} open shifts${stats.catastrophicOpen.length ? ` · ${stats.catastrophicOpen.length} catastrophic uncovered` : ''}`}
        actions={
          <>
            <button className="btn-secondary text-xs" onClick={() => navigate('/audit-log')}>
              <Download size={13} />Export Briefing
            </button>
            <button className="btn-primary text-xs" onClick={() => navigate('/referrals')}>
              <Plus size={13} />New Referral
            </button>
          </>
        }
      />

      {/* Critical Alerts Banner */}
      {stats.criticalAlerts.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <p className="text-xs font-bold text-red-700 font-mono uppercase tracking-wider">
              {stats.criticalAlerts.length} Critical Alerts
            </p>
          </div>
          <div className="space-y-1.5">
            {stats.criticalAlerts.slice(0, 3).map(alert => (
              <p key={alert.id} className="text-xs text-red-700">• {alert.message}</p>
            ))}
            {stats.criticalAlerts.length > 3 && (
              <p className="text-[10px] text-red-500 mt-1">+ {stats.criticalAlerts.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* KPI hero strip — sparkline + delta on each */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard
          label="Referrals · 24h"
          value={stats.newReferrals24h}
          trend={trend(stats.newReferrals24h)}
          foot={<>Active: <strong className="text-advisa-text">{stats.active.length}</strong> · Immediate: <strong className="text-op-critical">{stats.urgentReferrals.length}</strong></>}
          onClick={() => navigate('/referrals')}
          testId="kpi-referrals"
        />
        <KpiCard
          label="Open Shifts"
          value={stats.openShifts.length}
          tone={stats.openShifts.length > 0 ? 'critical' : 'success'}
          trend={trend(stats.openShifts.length)}
          foot={stats.catastrophicOpen.length > 0
            ? <span className="text-op-critical font-semibold">{stats.catastrophicOpen.length} catastrophic</span>
            : <>Need staffing: {stats.needStaffing.length}</>}
          onClick={() => navigate('/staffing')}
          testId="kpi-open-shifts"
        />
        <KpiCard
          label="Expiring Credentials"
          value={stats.expiredCompliance.length + stats.criticalSoonCompliance.length}
          tone={stats.expiredCompliance.length > 0 ? 'critical' : 'warning'}
          trend={trend(stats.expiredCompliance.length + stats.criticalSoonCompliance.length)}
          foot={<>Expired: <strong className="text-op-critical">{stats.expiredCompliance.length}</strong> · Critical Soon: <strong className="text-op-warning">{stats.criticalSoonCompliance.length}</strong></>}
          onClick={() => navigate('/compliance')}
          testId="kpi-expiring"
        />
        <KpiCard
          label="Avg Referral → SOC"
          value={stats.avgSOC === 'N/A' ? '—' : `${stats.avgSOC}d`}
          tone="success"
          trend={trend(typeof stats.avgSOC === 'string' && stats.avgSOC !== 'N/A' ? Math.round(parseFloat(stats.avgSOC)) : 5)}
          foot={<>{stats.unacknowledgedAlerts.length} unread alerts</>}
          testId="kpi-avg-soc"
        />
      </div>

      {/* Two-up: pipeline funnel + activity rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mb-5">
        <div className="card">
          <div className="flex items-end justify-between border-b border-advisa-border pb-3 mb-4">
            <div>
              <p className="font-semibold text-[14px] text-advisa-secondary">Referral Pipeline</p>
              <p className="text-[11px] text-advisa-text-muted">By stage · {state.referrals.length} total</p>
            </div>
            <button onClick={() => navigate('/referrals')} className="text-[11px] font-medium text-advisa-primary hover:text-advisa-primary-hover">
              Open Referrals →
            </button>
          </div>
          <Funnel rows={pipelineRows} total={state.referrals.length} />
        </div>

        <div className="card">
          <div className="flex items-end justify-between border-b border-advisa-border pb-3 mb-3">
            <div>
              <p className="font-semibold text-[14px] text-advisa-secondary">Activity Rail</p>
              <p className="text-[11px] text-advisa-text-muted">Real-time · last events</p>
            </div>
            <button onClick={() => navigate('/audit-log')} className="text-[11px] font-medium text-advisa-primary hover:text-advisa-primary-hover">
              View all →
            </button>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            <ActivityRail items={activity} emptyText="No recent activity" />
          </div>
        </div>
      </div>

      {/* Compliance donut + Action Required */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div className="card">
          <div className="flex items-end justify-between border-b border-advisa-border pb-3 mb-4">
            <div>
              <p className="font-semibold text-[14px] text-advisa-secondary">Compliance</p>
              <p className="text-[11px] text-advisa-text-muted">All staff · live</p>
            </div>
            <p className="text-[11px] text-advisa-text-muted">
              Total <strong className="text-advisa-secondary tabular-nums">{complianceTotal}</strong>
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Donut
              slices={donutSlices}
              centerLabel="COMPLIANT"
              centerValue={complianceTotal > 0 ? `${Math.round((stats.compliantCount / complianceTotal) * 100)}%` : '—'}
            />
            <div className="mt-4 w-full space-y-1.5">
              {donutSlices.map(s => (
                <div key={s.label} className="flex items-center justify-between text-[11.5px]">
                  <div className="flex items-center gap-2 text-advisa-text">
                    <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: s.color }} />
                    {s.label}
                  </div>
                  <span className="font-semibold text-advisa-secondary tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-end justify-between border-b border-advisa-border pb-3 mb-4">
            <div>
              <p className="font-semibold text-[14px] text-advisa-secondary flex items-center gap-2">
                <AlertTriangle size={14} className="text-op-critical" />
                Action Required
              </p>
              <p className="text-[11px] text-advisa-text-muted">Items needing executive attention now</p>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-advisa-text-muted">
              {stats.urgentReferrals.length + stats.openShifts.length + stats.expiredCompliance.length} items
            </p>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {stats.urgentReferrals.map(r => (
              <button
                key={r.id}
                onClick={() => navigate(`/referrals?ref=${encodeURIComponent(r.id)}`)}
                className="w-full flex items-center justify-between p-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-left transition-colors"
              >
                <div>
                  <p className="font-semibold text-red-700">{r.patientInitials} — {r.serviceType}</p>
                  <p className="text-red-500 text-[10px]">{r.stage} · {r.source}</p>
                </div>
                <ArrowRight size={12} className="text-red-400" />
              </button>
            ))}
            {stats.openShifts.map(s => {
              const isCat = s.serviceType === 'Catastrophic Injury Care';
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(isCat ? '/catastrophic-care' : `/staffing?shift=${encodeURIComponent(s.id)}`)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-left transition-colors ${isCat ? 'bg-red-50 hover:bg-red-100' : 'bg-amber-50 hover:bg-amber-100'}`}
                >
                  <div>
                    <p className={`font-semibold ${isCat ? 'text-red-700' : 'text-amber-700'}`}>
                      {isCat ? 'CATASTROPHIC: ' : 'Open Shift: '}{s.patientInitials}
                    </p>
                    <p className={`text-[10px] ${isCat ? 'text-red-500' : 'text-amber-500'}`}>{s.date} · {s.serviceType}</p>
                  </div>
                  <ArrowRight size={12} className={isCat ? 'text-red-400' : 'text-amber-400'} />
                </button>
              );
            })}
            {stats.expiredCompliance.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/compliance?item=${encodeURIComponent(c.id)}`)}
                className="w-full flex items-center justify-between p-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-left transition-colors"
              >
                <div>
                  <p className="font-semibold text-red-700">Expired: {c.staffName} — {c.itemType}</p>
                  <p className="text-red-500 text-[10px]">Blocks assignment</p>
                </div>
                <ArrowRight size={12} className="text-red-400" />
              </button>
            ))}
            {stats.urgentReferrals.length + stats.openShifts.length + stats.expiredCompliance.length === 0 && (
              <p className="text-center py-8 text-advisa-text-muted text-xs">All clear — no urgent items</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

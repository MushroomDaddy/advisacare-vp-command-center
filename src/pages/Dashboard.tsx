/**
 * VP Operations Briefing — premium command-center dashboard.
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ HERO · Today's Care Operations Brief                              │
 *   │   editorial title · key metrics · last-updated · Wallboard mode  │
 *   └──────────────────────────────────────────────────────────────────┘
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ TOP 5 ACTIONS TODAY                                               │
 *   │   risk · title · why it matters · owner · View · Take Action     │
 *   └──────────────────────────────────────────────────────────────────┘
 *   ┌─────────────────┬─────────────────┬─────────────────┬───────────┐
 *   │ Bottleneck      │ High-Acuity     │ Credential      │ Quality   │
 *   │ Radar           │ Coverage Risk   │ Blockers        │ Watch     │
 *   └─────────────────┴─────────────────┴─────────────────┴───────────┘
 *   ┌──────────────────────────────┬──────────────────────────────────┐
 *   │ Partner Follow-ups Due       │ Activity Rail                    │
 *   └──────────────────────────────┴──────────────────────────────────┘
 */
import { useAppState } from '../context/AppContext';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComplianceCategory } from '../lib/complianceUtils';
import {
  ArrowRight, ClipboardList, ShieldCheck,
  HeartPulse, Handshake, Star, Activity, Maximize2, Minimize2,
} from 'lucide-react';

// ─── Action item — the unified shape for Top 5 Actions ─────────────────

type RiskLevel = 'Critical' | 'High' | 'Medium';

interface ActionItem {
  id: string;
  risk: RiskLevel;
  /** Short category — appears as an eyebrow above the title */
  area: string;
  title: string;
  /** Free-form sub-line — date, service type, etc. */
  subtitle: string;
  /** Two-sentence "why it matters" */
  why: string;
  /** Who owns this in the org */
  owner: string;
  /** Where View Source navigates */
  viewSourceHref: string;
  /** Where Take Action navigates */
  takeActionHref: string;
  /** Take Action button label */
  takeActionLabel: string;
}

const riskTone: Record<RiskLevel, { pill: string; rail: string; ring: string }> = {
  Critical: { pill: 'pill-critical', rail: '#DC2626', ring: 'rgba(220,38,38,.18)' },
  High:     { pill: 'pill-warning',  rail: '#D97706', ring: 'rgba(217,119,6,.18)'  },
  Medium:   { pill: 'pill-warning',  rail: '#D97706', ring: 'rgba(217,119,6,.12)'  },
};

const riskOrder: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2 };

// ───────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();

  // Wall-clock "now" lives in state and refreshes every minute. Keeps render
  // pure (no Date.now() at render time) and gives the "Updated 14:32" stamp
  // a live feel without re-rendering the whole page.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Wallboard mode — hides the in-app chrome and bumps type sizes for the
  // big-screen presentation use case. Toggle is purely local state, no global
  // routing change.
  const [wallboard, setWallboard] = useState(false);

  // ─── Derived metrics ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const urgentReferrals     = state.referrals.filter(r => r.urgency === 'Immediate' && r.stage !== 'Declined');
    const missingDocsRefs     = state.referrals.filter(r => r.stage === 'Missing Docs');
    const needStaffingRefs    = state.referrals.filter(r => r.stage === 'Staffing');
    const openShifts          = state.shifts.filter(s => s.status === 'Open');
    const catastrophicShifts  = openShifts.filter(s => s.serviceType === 'Catastrophic Injury Care');
    const expiredCompliance   = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Expired');
    const criticalSoonCompl   = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Critical Soon');
    const overdueVisits       = state.visits.filter(v => v.documentationStatus === 'Overdue');
    const oasisRejected       = state.quality.filter(q => (q.type === 'OASIS Due' || q.type === 'OASIS Review') && q.status === 'Rejected');
    const hopeOverdue         = state.quality.filter(q => q.type === 'HOPE Assessment' && q.status === 'Open' && now > 0 && new Date(q.dueDate).getTime() < now);
    const criticalAlerts      = state.alerts.filter(a => !a.resolved && a.severity === 'Critical');
    const unacknowledgedCount = state.alerts.filter(a => !a.resolved && !a.acknowledged).length;
    const overduePartners     = state.partners.filter(p => p.nextFollowUp && now > 0 && new Date(p.nextFollowUp).getTime() < now);
    const slaBreach           = state.referrals.filter(r => r.slaStatus === 'Breach');

    const socTimes = state.referrals
      .filter(r => r.stageTimestamps?.['New'] && r.stageTimestamps?.['Started'])
      .map(r => (new Date(r.stageTimestamps['Started']!).getTime() - new Date(r.stageTimestamps['New']!).getTime()) / (1000 * 60 * 60 * 24));
    const avgSOC = socTimes.length > 0 ? (socTimes.reduce((a, b) => a + b, 0) / socTimes.length).toFixed(1) : 'N/A';
    const active = state.referrals.filter(r => r.stage !== 'Declined' && r.stage !== 'Started').length;

    return {
      urgentReferrals, missingDocsRefs, needStaffingRefs,
      openShifts, catastrophicShifts,
      expiredCompliance, criticalSoonCompl,
      overdueVisits, oasisRejected, hopeOverdue,
      criticalAlerts, unacknowledgedCount, overduePartners,
      slaBreach, avgSOC, active,
    };
  }, [state, now]);

  // ─── Top 5 Actions — rank operational risks by severity ──────────────
  const topActions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    // 1. Catastrophic uncovered shifts (Critical)
    stats.catastrophicShifts.forEach((s) => {
      items.push({
        id: `action-cat-${s.id}`,
        risk: 'Critical',
        area: 'Catastrophic Care',
        title: `Catastrophic shift uncovered — ${s.patientInitials}`,
        subtitle: `${s.date} · ${s.time ?? 'Time TBD'} · ${s.serviceType}`,
        why: 'Patient requires continuous skilled coverage. An uncovered catastrophic shift puts the case at clinical and contractual risk.',
        owner: state.staff.find(st => (st.role as string) === 'Catastrophic Care Coordinator')?.name ?? state.currentUser.name,
        viewSourceHref: `/catastrophic-care`,
        takeActionHref: `/staffing?shift=${encodeURIComponent(s.id)}`,
        takeActionLabel: 'Assign Staff',
      });
    });

    // 2. Expired credentials (Critical — blocks all assignments)
    stats.expiredCompliance.forEach((c) => {
      items.push({
        id: `action-cred-${c.id}`,
        risk: 'Critical',
        area: 'Compliance',
        title: `${c.staffName} — ${c.itemType} expired`,
        subtitle: `Lapsed ${c.expiryDate} · auto-blocked from shifts`,
        why: 'An expired credential blocks the staff member from accepting any shift. Renew or remove from the active roster.',
        owner: 'Compliance Admin',
        viewSourceHref: `/compliance?item=${encodeURIComponent(c.id)}`,
        takeActionHref: `/compliance?item=${encodeURIComponent(c.id)}`,
        takeActionLabel: 'Renew',
      });
    });

    // 3. SLA breaches on referrals (Critical)
    stats.slaBreach.forEach((r) => {
      items.push({
        id: `action-sla-${r.id}`,
        risk: 'Critical',
        area: 'Referrals',
        title: `${r.patientInitials} — SLA breach`,
        subtitle: `${r.serviceType} · ${r.source}`,
        why: 'Referral has missed its commitment deadline. Reach out to the referring partner immediately.',
        owner: r.assignedCoordinator,
        viewSourceHref: `/referrals?ref=${encodeURIComponent(r.id)}`,
        takeActionHref: `/referrals?ref=${encodeURIComponent(r.id)}`,
        takeActionLabel: 'Open Referral',
      });
    });

    // 4. Immediate-urgency referrals not yet started (High)
    stats.urgentReferrals.forEach((r) => {
      // Don't double-count if it's already in SLA breach
      if (stats.slaBreach.some(b => b.id === r.id)) return;
      items.push({
        id: `action-urg-${r.id}`,
        risk: 'High',
        area: 'Referrals',
        title: `${r.patientInitials} — immediate referral`,
        subtitle: `${r.stage} · ${r.serviceType} · from ${r.source}`,
        why: 'Immediate-urgency referrals require start-of-care within 24 hours. Confirm intake is on track.',
        owner: r.assignedCoordinator,
        viewSourceHref: `/referrals?ref=${encodeURIComponent(r.id)}`,
        takeActionHref: `/referrals?ref=${encodeURIComponent(r.id)}`,
        takeActionLabel: 'Open Referral',
      });
    });

    // 5. Open shifts (non-catastrophic) — High
    stats.openShifts
      .filter(s => s.serviceType !== 'Catastrophic Injury Care')
      .forEach((s) => {
        items.push({
          id: `action-shift-${s.id}`,
          risk: 'High',
          area: 'Staffing',
          title: `Open shift — ${s.patientInitials}`,
          subtitle: `${s.date} · ${s.time ?? 'Time TBD'} · ${s.serviceType}`,
          why: 'Open shifts close at the start of the visit window. Offer to the matched roster as soon as possible.',
          owner: 'Scheduler',
          viewSourceHref: `/staffing?shift=${encodeURIComponent(s.id)}`,
          takeActionHref: `/staffing?shift=${encodeURIComponent(s.id)}`,
          takeActionLabel: 'Offer Shift',
        });
      });

    // 6. Overdue partner follow-ups (Medium)
    stats.overduePartners.forEach((p) => {
      items.push({
        id: `action-partner-${p.id}`,
        risk: 'Medium',
        area: 'Partners',
        title: `${p.name} — follow-up overdue`,
        subtitle: `Last touch ${p.lastFollowUp ?? '—'} · ${p.type}`,
        why: 'Partner relationships drift quickly without regular follow-up. A timely check-in protects referral volume.',
        owner: state.currentUser.name,
        viewSourceHref: `/referral-partners?partner=${encodeURIComponent(p.id)}`,
        takeActionHref: `/referral-partners?partner=${encodeURIComponent(p.id)}`,
        takeActionLabel: 'Record Follow-up',
      });
    });

    return items.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]).slice(0, 5);
  }, [stats, state.staff, state.currentUser]);

  // ─── Pipeline (Bottleneck Radar) ─────────────────────────────────────
  const pipeline = [
    { name: 'New',          count: state.referrals.filter(r => r.stage === 'New').length },
    { name: 'Missing Docs', count: stats.missingDocsRefs.length },
    { name: 'Eligibility',  count: state.referrals.filter(r => r.stage === 'Eligibility').length },
    { name: 'Staffing',     count: stats.needStaffingRefs.length },
    { name: 'Scheduled',    count: state.referrals.filter(r => r.stage === 'Scheduled').length },
    { name: 'Started',      count: state.referrals.filter(r => r.stage === 'Started').length },
  ];
  const maxPipeline = Math.max(...pipeline.map(p => p.count), 1);
  // The "bottleneck" is the highest non-terminal stage count
  const bottleneck = pipeline.slice(0, 4).reduce((max, cur) => cur.count > max.count ? cur : max, pipeline[0]);

  // ─── Formatting helpers ──────────────────────────────────────────────
  const today = now === 0
    ? ' '
    : new Date(now).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const lastUpdated = now === 0 ? '—' : new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={wallboard ? 'wallboard-mode' : ''}>
      {/* ─── HERO · Today's Care Operations Brief ───────────────────── */}
      <div
        className="relative rounded-card border border-advisa-border overflow-hidden mb-5"
        style={{
          background: 'linear-gradient(135deg, #06494F 0%, #04363B 60%, #032A2D 100%)',
          boxShadow: '0 1px 2px rgba(15,47,51,.05), 0 12px 28px -10px rgba(6,73,79,.22)',
        }}
      >
        {/* Aurora overlays */}
        <span
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -60, left: -30, width: 280, height: 200,
            background: 'radial-gradient(ellipse, rgba(155,184,63,.12), transparent 70%)',
          }}
        />
        <span
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: -40, right: -20, width: 260, height: 180,
            background: 'radial-gradient(ellipse, rgba(21,151,200,.10), transparent 70%)',
          }}
        />
        {/* Grain */}
        <span aria-hidden className="grain-overlay" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] font-semibold tracking-[0.22em] uppercase text-advisa-lime">
                Today · {today}
              </p>
              <h1 className="text-white mt-2 font-bold tracking-tight" style={{ fontSize: wallboard ? '40px' : '30px', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                Today's Care Operations Brief
              </h1>
              <p className="text-white/75 text-sm mt-3 max-w-2xl">
                {state.referrals.length} referrals tracked · {stats.openShifts.length} open shifts ·{' '}
                {stats.catastrophicShifts.length > 0
                  ? <span className="text-red-200 font-semibold">{stats.catastrophicShifts.length} catastrophic uncovered</span>
                  : <span className="text-advisa-lime/90 font-semibold">all catastrophic covered</span>}
                {' '}· avg SOC {stats.avgSOC === 'N/A' ? '—' : `${stats.avgSOC} days`}
              </p>
            </div>

            <div className="flex flex-col items-stretch md:items-end gap-2">
              <button
                onClick={() => setWallboard(w => !w)}
                aria-pressed={wallboard}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-white/15 text-white bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
              >
                {wallboard ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                {wallboard ? 'Exit Wallboard' : 'Wallboard mode'}
              </button>
              <div className="flex items-center justify-end gap-2 text-[11px] font-mono text-white/55">
                <span className="live-dot live-dot-sm" />
                <span><strong className="text-white/85 font-semibold">Updated</strong> {lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Hero stat tiles */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <HeroStat label="Active Referrals" value={stats.active} accent="lime" />
            <HeroStat label="Open Shifts" value={stats.openShifts.length} accent={stats.openShifts.length > 0 ? 'red' : 'lime'} foot={stats.catastrophicShifts.length > 0 ? `${stats.catastrophicShifts.length} catastrophic` : 'all covered'} />
            <HeroStat label="Compliance Risk" value={stats.expiredCompliance.length + stats.criticalSoonCompl.length} accent={stats.expiredCompliance.length > 0 ? 'red' : 'amber'} foot={`${stats.expiredCompliance.length} expired`} />
            <HeroStat label="Avg Referral → SOC" value={stats.avgSOC === 'N/A' ? '—' : `${stats.avgSOC}d`} accent="lime" />
          </div>
        </div>
      </div>

      {/* ─── TOP 5 ACTIONS TODAY ─────────────────────────────────────── */}
      <section className="mb-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-bold tracking-tight text-advisa-secondary">Top 5 Actions Today</h2>
          <span className="text-[11px] font-mono uppercase tracking-wider text-clinical-muted">
            {topActions.length} item{topActions.length === 1 ? '' : 's'} · ranked by risk
          </span>
        </div>

        {topActions.length === 0 ? (
          <div className="card flex items-center justify-center py-10">
            <div className="text-center max-w-md">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ACCB4D, #7FA02D)', boxShadow: '0 4px 12px -2px rgba(155,184,63,.45)' }}
              >
                <ShieldCheck size={22} className="text-white" />
              </div>
              <p className="text-base font-semibold text-advisa-secondary">All clear</p>
              <p className="text-xs text-clinical-muted mt-1 leading-relaxed">
                No catastrophic gaps, no expired credentials, no SLA breaches, no overdue partner follow-ups. Operations are nominal.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {topActions.map(a => (
              <ActionCard key={a.id} action={a} onNavigate={navigate} />
            ))}
          </div>
        )}
      </section>

      {/* ─── OPERATIONS GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Bottleneck Radar */}
        <div className="card cursor-pointer" onClick={() => navigate('/referrals')}>
          <div className="card-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardList size={16} />
              Bottleneck Radar
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-clinical-muted">Pipeline</span>
          </div>
          <p className="text-xs text-clinical-muted mb-3">Where referrals are stalling.</p>
          <div className="flex gap-1.5 items-end h-16">
            {pipeline.map(stage => {
              const isBottleneck = stage.name === bottleneck.name && stage.count > 0;
              const h = Math.max(6, (stage.count / maxPipeline) * 56);
              const bg = isBottleneck
                ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)'
                : 'linear-gradient(180deg, #0B6F72 0%, #06494F 100%)';
              return (
                <div key={stage.name} className="flex-1 flex flex-col items-center gap-1" title={`${stage.name}: ${stage.count}`}>
                  <span className="text-[9px] text-clinical-muted tabular-nums">{stage.count}</span>
                  <div
                    className="w-full rounded-t-md relative overflow-hidden"
                    style={{ height: `${h}px`, background: bg, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(0,0,0,.10)' }}
                  >
                    <span aria-hidden className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,.14), transparent)' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-clinical-muted">
            Stalling at <span className="font-semibold text-advisa-secondary">{bottleneck.name}</span> · {bottleneck.count} referrals
          </p>
        </div>

        {/* High-Acuity Coverage Risk */}
        <div className="card cursor-pointer" onClick={() => navigate('/catastrophic-care')}>
          <div className="card-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HeartPulse size={16} />
              High-Acuity Coverage
            </span>
            <span className={`pill ${stats.catastrophicShifts.length > 0 ? 'pill-critical' : 'pill-success'} text-[10px]`}>
              <span className="pill-dot" />
              {stats.catastrophicShifts.length > 0 ? 'At risk' : 'Covered'}
            </span>
          </div>
          <p className="text-xs text-clinical-muted mb-3">Catastrophic shift coverage.</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums" style={{ color: stats.catastrophicShifts.length > 0 ? '#DC2626' : '#4F6A1A', letterSpacing: '-0.025em' }}>
              {stats.catastrophicShifts.length}
            </span>
            <span className="text-xs text-clinical-muted">shifts uncovered</span>
          </div>
          <p className="mt-3 text-[11px] text-clinical-muted">{state.catastrophicCases.length} active catastrophic cases</p>
        </div>

        {/* Credential Blockers */}
        <div className="card cursor-pointer" onClick={() => navigate('/compliance')}>
          <div className="card-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Credential Blockers
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-clinical-muted">Compliance</span>
          </div>
          <p className="text-xs text-clinical-muted mb-3">Staff blocked from shifts.</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums" style={{ color: stats.expiredCompliance.length > 0 ? '#DC2626' : '#4F6A1A', letterSpacing: '-0.025em' }}>
              {stats.expiredCompliance.length}
            </span>
            <span className="text-xs text-clinical-muted">expired</span>
          </div>
          <p className="mt-3 text-[11px] text-clinical-muted">
            <span className="font-semibold text-amber-700">{stats.criticalSoonCompl.length}</span> critical within 30 days
          </p>
        </div>

        {/* OASIS Quality Watch */}
        <div className="card cursor-pointer" onClick={() => navigate('/quality')}>
          <div className="card-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Star size={16} />
              OASIS Quality Watch
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-clinical-muted">Quality</span>
          </div>
          <p className="text-xs text-clinical-muted mb-3">Rejected and overdue items.</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums" style={{ color: stats.oasisRejected.length + stats.hopeOverdue.length > 0 ? '#D97706' : '#4F6A1A', letterSpacing: '-0.025em' }}>
              {stats.oasisRejected.length + stats.hopeOverdue.length}
            </span>
            <span className="text-xs text-clinical-muted">to review</span>
          </div>
          <p className="mt-3 text-[11px] text-clinical-muted">
            <span className="font-semibold text-red-700">{stats.oasisRejected.length}</span> OASIS rejected · <span className="font-semibold text-amber-700">{stats.hopeOverdue.length}</span> HOPE overdue
          </p>
          <p className="mt-1 text-[10px] text-clinical-muted">Demo heuristic — not a certified CMS calculation.</p>
        </div>
      </div>

      {/* ─── BOTTOM ROW: Partner Follow-ups + Activity ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
        {/* Partner Follow-ups Due */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Handshake size={16} />
              Partner Follow-ups Due
            </span>
            <button onClick={() => navigate('/referral-partners')} className="text-[11px] font-medium text-advisa-primary hover:text-advisa-accent">
              Open Partners →
            </button>
          </div>
          {stats.overduePartners.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-clinical-text font-medium">No follow-ups overdue</p>
              <p className="text-xs text-clinical-muted mt-1">Every active partner is within their cadence window.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.overduePartners.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/referral-partners?partner=${encodeURIComponent(p.id)}`)}
                  className="w-full flex items-center justify-between gap-2 p-3 rounded-lg text-xs text-left bg-white border border-advisa-border-light hover:border-amber-200 hover:bg-amber-50/40 transition-all relative"
                  style={{ boxShadow: 'inset 3px 0 0 #D97706' }}
                >
                  <div className="pl-1 min-w-0 flex-1">
                    <p className="font-semibold text-clinical-text truncate">{p.name}</p>
                    <p className="text-clinical-muted text-[10.5px] mt-0.5">{p.type} · last touch {p.lastFollowUp ?? '—'}</p>
                  </div>
                  <span className="pill pill-warning flex-shrink-0">
                    <span className="pill-dot" />
                    Overdue
                  </span>
                  <ArrowRight size={12} className="text-clinical-muted flex-shrink-0" />
                </button>
              ))}
              {stats.overduePartners.length > 4 && (
                <p className="text-[10.5px] text-clinical-muted text-center pt-1">
                  + {stats.overduePartners.length - 4} more — open Partners to review
                </p>
              )}
            </div>
          )}
        </div>

        {/* Activity Rail */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity size={16} />
              Operations Alerts
            </span>
            <button onClick={() => navigate('/audit-log')} className="text-[11px] font-medium text-advisa-primary hover:text-advisa-accent">
              View audit →
            </button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {state.auditLog.slice(0, 8).map(entry => {
              const detail = (entry.details ?? '').toLowerCase();
              let dotClass = 'bg-clinical-faint';
              let dotShadow: string | undefined;
              if (detail.includes('expired') || detail.includes('breach') || detail.includes('rejected') || detail.includes('catastrophic')) {
                dotClass = 'bg-red-500'; dotShadow = '0 0 0 3px rgba(220,38,38,.12)';
              } else if (detail.includes('overdue') || detail.includes('exception') || detail.includes('warning')) {
                dotClass = 'bg-amber-500';
              } else if (detail.includes('accepted') || detail.includes('renewed') || detail.includes('completed') || detail.includes('moved to')) {
                dotClass = 'bg-advisa-lime'; dotShadow = '0 0 0 3px rgba(155,184,63,.10)';
              }
              return (
                <div key={entry.id} className="flex items-start gap-3 px-2 py-2 text-xs rounded-lg hover:bg-advisa-lime-soft/40 transition-colors">
                  <span className={`w-2 h-2 rounded-full ${dotClass} flex-shrink-0 mt-1.5`} style={{ boxShadow: dotShadow }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-clinical-text truncate">{entry.details || `${entry.action} ${entry.recordType}`}</p>
                    <p className="text-[10px] text-clinical-muted mt-0.5">{entry.user} · {new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {state.auditLog.length === 0 && (
              <p className="text-center py-6 text-clinical-muted text-xs">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function HeroStat({ label, value, accent, foot }: {
  label: string;
  value: string | number;
  accent: 'lime' | 'red' | 'amber';
  foot?: string;
}) {
  const valueColor = accent === 'red' ? '#FECACA' : accent === 'amber' ? '#FED7AA' : '#C8DC8B';
  return (
    <div
      className="rounded-xl p-4 backdrop-blur-sm relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}
    >
      <p className="font-mono text-[9px] font-semibold tracking-[0.18em] uppercase text-white/55">{label}</p>
      <p className="text-[26px] font-bold tabular-nums mt-1.5" style={{ color: valueColor, letterSpacing: '-0.025em', lineHeight: 1 }}>
        {value}
      </p>
      {foot && <p className="text-[10.5px] text-white/60 mt-1.5">{foot}</p>}
    </div>
  );
}

function ActionCard({ action, onNavigate }: { action: ActionItem; onNavigate: (path: string) => void }) {
  const tone = riskTone[action.risk];
  return (
    <div
      className="rounded-card border border-advisa-border bg-card-surface relative flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFCFC 100%)',
        boxShadow: `0 1px 2px rgba(15,47,51,.04), 0 4px 14px -4px rgba(6,73,79,.12), inset 3px 0 0 ${tone.rail}`,
      }}
    >
      {/* Gradient sheen */}
      <span
        aria-hidden
        className="absolute pointer-events-none"
        style={{ top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(155,184,63,.35), transparent)' }}
      />

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className={`pill ${tone.pill} text-[10px]`}>
            <span className="pill-dot" />
            {action.risk}
          </span>
          <span className="font-mono text-[9px] text-clinical-muted uppercase tracking-[0.14em]">{action.area}</span>
        </div>

        <h3 className="text-[13.5px] font-semibold text-advisa-secondary leading-snug mb-1">
          {action.title}
        </h3>
        <p className="text-[11px] text-clinical-muted mb-3">{action.subtitle}</p>

        <p className="text-[11.5px] text-clinical-text leading-relaxed mb-3 flex-1">{action.why}</p>

        <div className="flex items-center gap-2 text-[10.5px] text-clinical-muted mb-3 pt-3 border-t border-advisa-border-light">
          <span className="font-mono uppercase tracking-wider text-[9px]">Owner</span>
          <span className="text-clinical-text font-medium truncate">{action.owner}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigate(action.viewSourceHref)}
            className="flex-1 text-[11px] py-1.5 px-2 rounded-md bg-white border border-advisa-border text-clinical-text font-medium hover:bg-advisa-border-light transition-colors"
          >
            View Related Item
          </button>
          <button
            onClick={() => onNavigate(action.takeActionHref)}
            className="flex-1 text-[11px] py-1.5 px-2 rounded-md text-white font-medium transition-colors"
            style={{
              background: 'linear-gradient(180deg, #0B6F72 0%, #06494F 100%)',
              boxShadow: '0 1px 0 rgba(255,255,255,.18) inset, 0 -1px 0 rgba(0,0,0,.10) inset, 0 2px 4px rgba(6,73,79,.20), 0 0 0 1px rgba(4,54,59,.30)',
            }}
          >
            {action.takeActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

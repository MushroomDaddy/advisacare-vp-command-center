import { useAppState } from '../context/AppContext';
import { useMemo, useState } from 'react';
import { calculateDashboardKPIs, getSLACategory, calculatePipelineAnalytics, calculateQualityRiskScore } from '../utils/dataLogic';
import { exportToCSV } from '../lib/csvUtils';
import type { AlertItem } from '../types';
import {
  LayoutDashboard, AlertTriangle, FileText, ShieldAlert,
  Bell, Eye, TrendingUp, Download, Clock, Activity,
  Siren, CheckCircle, XCircle, BarChart3, Users
} from 'lucide-react';

function KPICard({ label, value, icon: Icon, color, subtext }: {
  label: string; value: number | string; icon: React.ElementType; color: string; subtext?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className={`stat-value ${color}`}>{value}</p>
      {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}

function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  const { acknowledgeAlert } = useAppState();
  const critical = alerts.filter(a => a.severity === 'critical' && !a.acknowledged && !a.resolved);
  if (critical.length === 0) return null;

  return (
    <div className="mb-5 p-4 bg-red-50 border-2 border-red-200 rounded-xl" data-testid="alert-banner">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={18} className="text-red-600" />
        <p className="text-sm font-bold text-red-800">{critical.length} Critical Alert{critical.length > 1 ? 's' : ''}</p>
      </div>
      <div className="space-y-2">
        {critical.slice(0, 5).map(alert => (
          <div key={alert.id} className="flex items-center justify-between p-2 bg-white border border-red-200 rounded-lg text-xs">
            <div className="flex-1">
              <p className="font-semibold text-red-800">{alert.title}</p>
              <p className="text-red-600 mt-0.5">{alert.details}</p>
              {alert.owner && <p className="text-red-400 mt-0.5">Owner: {alert.owner}</p>}
            </div>
            <button
              onClick={() => acknowledgeAlert(alert.id)}
              className="btn-secondary text-[10px] py-1 px-2 ml-2"
            >
              Acknowledge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottleneckRadar({ referrals }: { referrals: ReturnType<typeof useAppState>['state']['referrals'] }) {
  const analytics = useMemo(() => calculatePipelineAnalytics(referrals), [referrals]);

  const stuckCount = Object.values(analytics.stuckByOwner).reduce((a, b) => a + b, 0);
  const slaBreach = referrals.filter(r => getSLACategory(r.slaDeadlineAt || r.slaDeadline) === 'Breach').length;
  const slaRisk = referrals.filter(r => getSLACategory(r.slaDeadlineAt || r.slaDeadline) === 'Risk').length;
  const missingDocs = referrals.filter(r => r.stage === 'Missing Docs').length;
  const unstaffed = referrals.filter(r => r.stage === 'Staffing' && r.urgency === 'Immediate').length;

  const bottlenecks = [
    { label: 'SLA Breached', value: slaBreach, color: 'text-red-600', severity: slaBreach > 0 ? 'critical' : 'ok' },
    { label: 'SLA Risk (<24h)', value: slaRisk, color: 'text-amber-600', severity: slaRisk > 0 ? 'warn' : 'ok' },
    { label: 'Stuck >48h', value: stuckCount, color: 'text-orange-600', severity: stuckCount > 2 ? 'critical' : stuckCount > 0 ? 'warn' : 'ok' },
    { label: 'Missing Docs', value: missingDocs, color: 'text-sky-600', severity: missingDocs > 2 ? 'warn' : 'ok' },
    { label: 'Unstaffed Urgent', value: unstaffed, color: 'text-red-600', severity: unstaffed > 0 ? 'critical' : 'ok' },
  ];

  return (
    <div className="card bg-gradient-to-r from-amber-50 to-red-50 border-amber-200" data-testid="bottleneck-radar">
      <div className="card-header text-amber-900 flex items-center gap-2 mb-3">
        <Activity size={15} className="text-amber-600" /> Bottleneck Radar
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {bottlenecks.map(b => (
          <div key={b.label} className="text-center p-2 bg-white/60 rounded-lg">
            <p className={`text-xl font-bold ${b.color}`}>{b.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{b.label}</p>
            <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${b.severity === 'critical' ? 'bg-red-500 animate-pulse' : b.severity === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </div>
        ))}
      </div>

      {/* Stuck-by-owner breakdown */}
      {stuckCount > 0 && (
        <div className="mt-3 p-2 bg-white/60 rounded-lg">
          <p className="text-[10px] text-slate-500 mb-1">Stuck by Owner</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.stuckByOwner).map(([owner, count]) => (
              <span key={owner} className="text-xs text-orange-700">
                {owner}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationCenter() {
  const { state, acknowledgeAlert } = useAppState();
  const [showAll, setShowAll] = useState(false);

  const active = state.alerts.filter(a => !a.resolved);
  const display = showAll ? active : active.slice(0, 8);

  const severityBadge = (s: string) =>
    s === 'critical' ? 'badge-urgent' : s === 'high' ? 'badge-warning' : s === 'medium' ? 'badge-info' : 'badge-neutral';

  const severityIcon = (s: string) =>
    s === 'critical' ? <ShieldAlert size={11} className="text-red-500" />
    : s === 'high' ? <AlertTriangle size={11} className="text-amber-500" />
    : <Bell size={11} className="text-slate-400" />;

  return (
    <div className="card" data-testid="notification-center">
      <div className="card-header mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2"><Bell size={15} className="text-advisa-accent" /> Notification Center</span>
        <span className="badge badge-info text-[10px]">{active.length} active</span>
      </div>
      {active.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No active alerts</p>
      ) : (
        <div className="space-y-2">
          {display.map(alert => (
            <div key={alert.id} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${alert.acknowledged ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-advisa-border'}`}>
              {severityIcon(alert.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`badge ${severityBadge(alert.severity)} text-[8px]`}>{alert.severity}</span>
                  <span className="font-semibold text-slate-700 truncate">{alert.title}</span>
                </div>
                <p className="text-slate-500 mt-0.5 line-clamp-1">{alert.details}</p>
                {alert.recommendedAction && (
                  <p className="text-sky-600 mt-0.5 text-[10px]">→ {alert.recommendedAction}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {!alert.acknowledged && (
                  <button onClick={() => acknowledgeAlert(alert.id)} className="text-[9px] text-advisa-accent hover:underline">Ack</button>
                )}
                {alert.acknowledged && (
                  <span className="text-[8px] text-slate-400">✓ {alert.acknowledgedBy}</span>
                )}
              </div>
            </div>
          ))}
          {active.length > 8 && (
            <button onClick={() => setShowAll(!showAll)} className="text-xs text-advisa-accent hover:underline">
              {showAll ? 'Show less' : `Show all ${active.length} alerts`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { state } = useAppState();
  const kpis = useMemo(() => calculateDashboardKPIs(state.referrals, state.staff, state.compliance), [state.referrals, state.staff, state.compliance]);
  const riskScore = useMemo(() => calculateQualityRiskScore(state.quality, state.oasisAssessments, state.hopeAssessments, state.visits), [state.quality, state.oasisAssessments, state.hopeAssessments, state.visits]);

  const activeReferrals = state.referrals.filter(r => r.stage !== 'Declined' && r.stage !== 'Started').length;
  const breachCount = state.referrals.filter(r => getSLACategory(r.slaDeadlineAt || r.slaDeadline) === 'Breach').length;
  const handleExportCSV = () => {
    const rows = state.referrals.map(r => ({
      ID: r.id,
      Patient: r.patientInitials,
      Service: r.serviceType,
      Stage: r.stage,
      Urgency: r.urgency,
      Source: r.source,
      Owner: r.assignedOwner,
      SLA: r.slaDeadline,
      Insurance: r.insuranceStatus,
      'Missing Docs': r.documents.filter(d => !d.uploaded).length,
    }));
    exportToCSV(rows, 'advisacare-pipeline-export.csv');
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <LayoutDashboard size={22} className="text-advisa-accent" />
            Executive Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">Last refreshed: {new Date(state.lastRefreshed).toLocaleTimeString()}</p>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary text-xs">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Critical Alert Banner */}
      <AlertBanner alerts={state.alerts} />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-5">
        <KPICard label="Active Referrals" value={activeReferrals} icon={FileText} color="text-sky-600" />
        <KPICard label="New (24h)" value={kpis.newReferrals24h} icon={TrendingUp} color="text-emerald-600" />
        <KPICard label="SLA Breach" value={breachCount} icon={Clock} color="text-red-600" subtext={breachCount > 0 ? 'Immediate action' : 'All clear'} />
        <KPICard label="Uncovered Urgent" value={kpis.uncoveredHighAcuity} icon={Users} color="text-orange-600" />
        <KPICard label="Expired Creds" value={kpis.expiredCredentials} icon={ShieldAlert} color="text-red-600" />
        <KPICard label="Quality Risk" value={`${riskScore}%`} icon={AlertTriangle} color={riskScore > 50 ? 'text-red-600' : riskScore > 25 ? 'text-amber-600' : 'text-emerald-600'} />
      </div>

      {/* Bottleneck Radar */}
      <BottleneckRadar referrals={state.referrals} />

      {/* Catastrophic Care Coverage Quick View */}
      {state.catastrophicCases.length > 0 && (
        <div className="card mt-5 bg-red-50/30 border-red-200" data-testid="cat-care-summary">
          <div className="card-header mb-3 text-red-800 flex items-center gap-2">
            <Siren size={15} className="text-red-500" /> Catastrophic Care Coverage
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.catastrophicCases.map(c => {
              const uncoveredShifts = c.shiftCoverage.filter(s => !s.covered).length;
              return (
                <div key={c.id} className={`p-3 rounded-lg border ${c.coverageRisk === 'Covered' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.patientInitials}</p>
                      <p className="text-[10px] text-slate-500">{c.conditions.join(', ')} · {c.payerType}</p>
                    </div>
                    <span className={`badge ${c.coverageRisk === 'Covered' ? 'badge-success' : c.coverageRisk === 'Partial' ? 'badge-warning' : 'badge-urgent'}`}>
                      {c.coverageRisk}
                    </span>
                  </div>
                  {uncoveredShifts > 0 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <XCircle size={10} /> {uncoveredShifts} uncovered shift{uncoveredShifts > 1 ? 's' : ''}
                    </p>
                  )}
                  {uncoveredShifts === 0 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={10} /> All shifts covered
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Pipeline Overview + Notification Center */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* Pipeline Snapshot */}
        <div className="card">
          <div className="card-header mb-3 flex items-center gap-2">
            <BarChart3 size={15} className="text-advisa-accent" /> Pipeline Snapshot
          </div>
          <div className="space-y-2">
            {(['New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started'] as const).map(stage => {
              const count = state.referrals.filter(r => r.stage === stage).length;
              const pct = state.referrals.length > 0 ? (count / state.referrals.length) * 100 : 0;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-slate-600">{stage}</span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-advisa-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification Center */}
        <NotificationCenter />
      </div>

      {/* Recent Audit Log */}
      <div className="card mt-5">
        <div className="card-header mb-3 flex items-center gap-2">
          <Eye size={15} className="text-advisa-accent" /> Recent Activity
        </div>
        <div className="space-y-1.5">
          {state.auditLog.slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg text-xs">
              <Activity size={11} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-700"><strong>{entry.user}</strong> {entry.action.toLowerCase()} {entry.recordType} <span className="text-slate-400">{entry.recordId}</span></p>
                <p className="text-slate-400">{entry.details}</p>
                <p className="text-[10px] text-slate-300 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

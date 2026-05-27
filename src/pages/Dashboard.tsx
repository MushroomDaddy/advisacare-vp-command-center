import { useAppState } from '../context/AppContext';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getComplianceCategory } from '../lib/complianceUtils';
import {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone,
  Star, Handshake, AlertTriangle, Clock, ArrowRight, TrendingUp,
  Bell, Calendar,
} from 'lucide-react';

export default function Dashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const urgentReferrals = state.referrals.filter(r => r.urgency === 'Immediate' && r.stage !== 'Declined');
    const missingDocs = state.referrals.filter(r => r.stage === 'Missing Docs');
    const needStaffing = state.referrals.filter(r => r.stage === 'Staffing');
    const openShifts = state.shifts.filter(s => s.status === 'Open');
    const expiredCompliance = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Expired');
    const criticalSoonCompliance = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Critical Soon');
    const dueSoonCompliance = state.compliance.filter(c => getComplianceCategory(c.expiryDate) === 'Due Soon');
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

    // Active referrals
    const active = state.referrals.filter(r => r.stage !== 'Declined' && r.stage !== 'Started');

    // Partners needing follow-up
    const overduePartners = state.partners.filter(p => p.nextFollowUp && new Date(p.nextFollowUp) < new Date());

    return {
      urgentReferrals, missingDocs, needStaffing, openShifts,
      expiredCompliance, criticalSoonCompliance, dueSoonCompliance, pendingVisits, overdueVisits,
      openQuality, criticalAlerts, unacknowledgedAlerts, avgSOC, active, overduePartners,
    };
  }, [state]);

  // Pipeline distribution for referrals
  const pipelineStages = ['New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started', 'Declined'];
  const pipeline = pipelineStages.map(stage => ({
    name: stage,
    count: state.referrals.filter(r => r.stage === stage).length,
  }));
  const maxPipeline = Math.max(...pipeline.map(p => p.count), 1);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <LayoutDashboard size={22} className="text-advisa-accent" />
            VP Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time overview · {state.referrals.length} referrals · {state.staff.length} staff</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={13} />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {stats.criticalAlerts.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <p className="text-xs font-bold text-red-700">{stats.criticalAlerts.length} Critical Alerts</p>
          </div>
          <div className="space-y-1.5">
            {stats.criticalAlerts.slice(0, 3).map(alert => (
              <p key={alert.id} className="text-xs text-red-600">• {alert.message}</p>
            ))}
            {stats.criticalAlerts.length > 3 && (
              <p className="text-[10px] text-red-400">+ {stats.criticalAlerts.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card cursor-pointer hover:shadow-card-hover" onClick={() => navigate('/referrals')}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center"><ClipboardList size={16} className="text-sky-600" /></div>
            <p className="stat-label">Active Referrals</p>
          </div>
          <p className="stat-value text-slate-800">{stats.active.length}</p>
          <p className="text-[10px] text-red-500 mt-1">{stats.urgentReferrals.length} immediate</p>
        </div>

        <div className="stat-card cursor-pointer hover:shadow-card-hover" onClick={() => navigate('/staffing')}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><Users size={16} className="text-red-600" /></div>
            <p className="stat-label">Open Shifts</p>
          </div>
          <p className="stat-value text-red-600">{stats.openShifts.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">{stats.needStaffing.length} need staffing</p>
        </div>

        <div className="stat-card cursor-pointer hover:shadow-card-hover" onClick={() => navigate('/compliance')}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center"><ShieldCheck size={16} className="text-amber-600" /></div>
            <p className="stat-label">Compliance</p>
          </div>
          <p className={`stat-value ${stats.expiredCompliance.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {stats.expiredCompliance.length > 0 ? `${stats.expiredCompliance.length} expired` : 'All clear'}
          </p>
          <p className="text-[10px] text-amber-600 mt-1">{stats.criticalSoonCompliance.length} critical soon · {stats.dueSoonCompliance.length} due soon</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center"><TrendingUp size={16} className="text-emerald-600" /></div>
            <p className="stat-label">Avg Referral→SOC</p>
          </div>
          <p className="stat-value text-emerald-600">{stats.avgSOC}{stats.avgSOC !== 'N/A' ? ' days' : ''}</p>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card cursor-pointer hover:shadow-card-hover" onClick={() => navigate('/field-assistant')}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center"><Smartphone size={16} className="text-violet-600" /></div>
            <p className="stat-label">Pending Visits</p>
          </div>
          <p className="stat-value text-slate-800">{stats.pendingVisits.length}</p>
          <p className="text-[10px] text-red-500 mt-1">{stats.overdueVisits.length} overdue</p>
        </div>

        <div className="stat-card cursor-pointer hover:shadow-card-hover" onClick={() => navigate('/quality')}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center"><Star size={16} className="text-amber-600" /></div>
            <p className="stat-label">Quality Issues</p>
          </div>
          <p className="stat-value text-amber-600">{stats.openQuality.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">high priority open</p>
        </div>

        <div className="stat-card cursor-pointer hover:shadow-card-hover" onClick={() => navigate('/referral-partners')}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center"><Handshake size={16} className="text-teal-600" /></div>
            <p className="stat-label">Partners</p>
          </div>
          <p className="stat-value text-slate-800">{state.partners.length}</p>
          <p className="text-[10px] text-amber-600 mt-1">{stats.overduePartners.length} overdue follow-ups</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><Bell size={16} className="text-red-600" /></div>
            <p className="stat-label">Unread Alerts</p>
          </div>
          <p className="stat-value text-red-600">{stats.unacknowledgedAlerts.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">{state.alerts.filter(a => !a.resolved).length} total active</p>
        </div>
      </div>

      {/* Referral Pipeline — gradient bars with shine, Started/Declined get
          accent colors so the final stages read distinctly. */}
      <div className="card mb-5">
        <div className="card-header">
          <ClipboardList size={16} className="text-advisa-accent" />
          Referral Pipeline
        </div>
        <div className="flex gap-2 items-end h-24">
          {pipeline.map(stage => {
            const heightPx = Math.max(8, (stage.count / maxPipeline) * 64);
            // Gradient mapping per stage: lime for Started (success), red for
            // Declined (terminal), teal for everything else.
            let bg = 'linear-gradient(180deg, #0B6F72 0%, #06494F 100%)';
            if (stage.name === 'Started')  bg = 'linear-gradient(180deg, #ACCB4D 0%, #86A832 100%)';
            if (stage.name === 'Declined') bg = 'linear-gradient(180deg, #FCA5A5 0%, #DC2626 100%)';
            return (
              <div key={stage.name} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-clinical-text tabular-nums">{stage.count}</span>
                <div
                  className="w-full rounded-t-lg transition-all relative overflow-hidden"
                  style={{
                    height: `${heightPx}px`,
                    background: bg,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.20), inset 0 -1px 0 rgba(0,0,0,.12), 0 1px 2px rgba(6,73,79,.10)',
                  }}
                >
                  {/* Diagonal shine on top half */}
                  <span
                    aria-hidden
                    className="absolute top-0 left-0 right-0 rounded-t-lg pointer-events-none"
                    style={{
                      height: '50%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,.16), transparent)',
                    }}
                  />
                </div>
                <span className="text-[9px] text-clinical-muted text-center leading-tight">{stage.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Urgent Items — single-signal cards: tone rail + pill, neutral row bg */}
        <div className="card">
          <div className="card-header">
            <AlertTriangle size={16} className="text-red-500" />
            Action Required
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.urgentReferrals.map(r => (
              <button
                key={r.id}
                onClick={() => navigate(`/referrals?ref=${encodeURIComponent(r.id)}`)}
                className="w-full flex items-center justify-between gap-2 p-3 rounded-lg text-xs text-left bg-white border border-advisa-border-light hover:border-red-200 hover:bg-red-50/40 transition-all relative"
                style={{ boxShadow: 'inset 3px 0 0 #DC2626' }}
              >
                <div className="pl-1 min-w-0 flex-1">
                  <p className="font-semibold text-clinical-text truncate">{r.patientInitials} — {r.serviceType}</p>
                  <p className="text-clinical-muted text-[10px] mt-0.5">{r.stage} · {r.source}</p>
                </div>
                <span className="pill pill-critical flex-shrink-0">
                  <span className="pill-dot" />
                  Immediate
                </span>
                <ArrowRight size={12} className="text-clinical-muted flex-shrink-0" />
              </button>
            ))}
            {stats.openShifts.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/staffing?shift=${encodeURIComponent(s.id)}`)}
                className="w-full flex items-center justify-between gap-2 p-3 rounded-lg text-xs text-left bg-white border border-advisa-border-light hover:border-amber-200 hover:bg-amber-50/40 transition-all relative"
                style={{ boxShadow: 'inset 3px 0 0 #D97706' }}
              >
                <div className="pl-1 min-w-0 flex-1">
                  <p className="font-semibold text-clinical-text truncate">Open Shift: {s.patientInitials}</p>
                  <p className="text-clinical-muted text-[10px] mt-0.5">{s.date} · {s.serviceType}</p>
                </div>
                <span className="pill pill-warning flex-shrink-0">
                  <span className="pill-dot" />
                  Open
                </span>
                <ArrowRight size={12} className="text-clinical-muted flex-shrink-0" />
              </button>
            ))}
            {stats.expiredCompliance.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/compliance?item=${encodeURIComponent(c.id)}`)}
                className="w-full flex items-center justify-between gap-2 p-3 rounded-lg text-xs text-left bg-white border border-advisa-border-light hover:border-red-200 hover:bg-red-50/40 transition-all relative"
                style={{ boxShadow: 'inset 3px 0 0 #DC2626' }}
              >
                <div className="pl-1 min-w-0 flex-1">
                  <p className="font-semibold text-clinical-text truncate">Expired: {c.staffName} — {c.itemType}</p>
                  <p className="text-clinical-muted text-[10px] mt-0.5">Blocks shift assignment</p>
                </div>
                <span className="pill pill-critical flex-shrink-0">
                  <span className="pill-dot" />
                  Expired
                </span>
                <ArrowRight size={12} className="text-clinical-muted flex-shrink-0" />
              </button>
            ))}
            {stats.urgentReferrals.length + stats.openShifts.length + stats.expiredCompliance.length === 0 && (
              <p className="text-center py-6 text-clinical-muted text-xs">All clear — no urgent items</p>
            )}
          </div>
        </div>

        {/* Recent Activity — refined dots with halo */}
        <div className="card">
          <div className="card-header">
            <Calendar size={16} className="text-advisa-accent" />
            Recent Activity
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {state.auditLog.slice(0, 8).map(entry => {
              const detail = (entry.details ?? '').toLowerCase();
              let dotClass = 'bg-clinical-faint';
              if (detail.includes('expired') || detail.includes('breach') || detail.includes('rejected') || detail.includes('catastrophic')) {
                dotClass = 'bg-red-500';
              } else if (detail.includes('overdue') || detail.includes('exception') || detail.includes('warning')) {
                dotClass = 'bg-amber-500';
              } else if (detail.includes('accepted') || detail.includes('renewed') || detail.includes('completed') || detail.includes('moved to')) {
                dotClass = 'bg-advisa-lime';
              }
              return (
                <div key={entry.id} className="flex items-start gap-3 px-2 py-2 text-xs rounded-lg hover:bg-advisa-lime-soft/40 transition-colors">
                  <span
                    className={`w-2 h-2 rounded-full ${dotClass} flex-shrink-0 mt-1.5`}
                    style={{ boxShadow: dotClass === 'bg-red-500' ? '0 0 0 3px rgba(220,38,38,.12)' : '0 0 0 3px rgba(155,184,63,.10)' }}
                  />
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

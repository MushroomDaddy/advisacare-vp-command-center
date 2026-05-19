import { useAppState } from '../context/AppContext';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, ShieldCheck, Smartphone,
  Star, Handshake, AlertTriangle, Clock, ArrowRight, TrendingUp,
  Bell, Calendar,
} from 'lucide-react';

export default function Dashboard() {
  const { state, getComplianceStatus } = useAppState();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const urgentReferrals = state.referrals.filter(r => r.urgency === 'Immediate' && r.stage !== 'Declined');
    const missingDocs = state.referrals.filter(r => r.stage === 'Missing Docs');
    const needStaffing = state.referrals.filter(r => r.stage === 'Staffing');
    const openShifts = state.shifts.filter(s => s.status === 'Open');
    const expiredCompliance = state.compliance.filter(c => getComplianceStatus(c) === 'Expired');
    const dueSoonCompliance = state.compliance.filter(c => getComplianceStatus(c) === 'Due Soon');
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
      expiredCompliance, dueSoonCompliance, pendingVisits, overdueVisits,
      openQuality, criticalAlerts, unacknowledgedAlerts, avgSOC, active, overduePartners,
    };
  }, [state, getComplianceStatus]);

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
          <p className="text-[10px] text-amber-600 mt-1">{stats.dueSoonCompliance.length} due soon</p>
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

      {/* Referral Pipeline */}
      <div className="card mb-5">
        <div className="card-header">
          <ClipboardList size={16} className="text-advisa-accent" />
          Referral Pipeline
        </div>
        <div className="flex gap-2 items-end h-24">
          {pipeline.map(stage => (
            <div key={stage.name} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-slate-800">{stage.count}</span>
              <div
                className="w-full bg-advisa-accent/20 rounded-t-lg transition-all"
                style={{ height: `${Math.max(8, (stage.count / maxPipeline) * 64)}px`, backgroundColor: stage.name === 'Declined' ? '#fca5a5' : undefined }}
              />
              <span className="text-[9px] text-slate-500 text-center leading-tight">{stage.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Urgent Items */}
        <div className="card">
          <div className="card-header">
            <AlertTriangle size={16} className="text-red-500" />
            Action Required
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.urgentReferrals.map(r => (
              <div key={r.id} onClick={() => navigate('/referrals')} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg text-xs cursor-pointer hover:bg-red-100">
                <div>
                  <p className="font-semibold text-red-700">{r.patientInitials} — {r.serviceType}</p>
                  <p className="text-red-500 text-[10px]">{r.stage} · {r.source}</p>
                </div>
                <ArrowRight size={12} className="text-red-400" />
              </div>
            ))}
            {stats.openShifts.map(s => (
              <div key={s.id} onClick={() => navigate('/staffing')} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg text-xs cursor-pointer hover:bg-amber-100">
                <div>
                  <p className="font-semibold text-amber-700">Open Shift: {s.patientInitials}</p>
                  <p className="text-amber-500 text-[10px]">{s.date} · {s.serviceType}</p>
                </div>
                <ArrowRight size={12} className="text-amber-400" />
              </div>
            ))}
            {stats.expiredCompliance.map(c => (
              <div key={c.id} onClick={() => navigate('/compliance')} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg text-xs cursor-pointer hover:bg-red-100">
                <div>
                  <p className="font-semibold text-red-700">Expired: {c.staffName} — {c.itemType}</p>
                  <p className="text-red-500 text-[10px]">Blocks assignment</p>
                </div>
                <ArrowRight size={12} className="text-red-400" />
              </div>
            ))}
            {stats.urgentReferrals.length + stats.openShifts.length + stats.expiredCompliance.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-xs">All clear — no urgent items</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <Calendar size={16} className="text-advisa-accent" />
            Recent Activity
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.auditLog.slice(0, 8).map(entry => (
              <div key={entry.id} className="flex items-center gap-2 p-2 text-xs hover:bg-slate-50 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-advisa-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 truncate">{entry.details || `${entry.action} ${entry.recordType}`}</p>
                  <p className="text-[10px] text-slate-400">{entry.user} · {new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {state.auditLog.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-xs">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

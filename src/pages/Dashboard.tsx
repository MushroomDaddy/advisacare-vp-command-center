import { useAppState } from '../context/AppContext';
import { calculateDashboardKPIs, getComplianceStatus } from '../utils/dataLogic';
import { getDaysUntilExpiry } from '../lib/dateUtils';
import { useState } from 'react';
import {
  LayoutDashboard, AlertTriangle, Clock, TrendingUp, TrendingDown,
  FileText, Users, ShieldCheck, Star, Activity, Monitor, Minus
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

export default function Dashboard() {
  const { state } = useAppState();
  const [branchFilter, setBranchFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [wallboardMode, setWallboardMode] = useState(false);

  const branches = ['All', ...new Set(state.referrals.map(r => r.branch))];
  const serviceTypes = ['All', ...new Set(state.referrals.map(r => r.serviceType))];

  // Filtered referrals
  const filteredReferrals = state.referrals.filter(r =>
    (branchFilter === 'All' || r.branch === branchFilter) &&
    (serviceFilter === 'All' || r.serviceType === serviceFilter)
  );

  const kpis = calculateDashboardKPIs(filteredReferrals, state.staff, state.compliance, state.quality);

  // Compliance counts using calculated status
  const complianceCounts = {
    expired: state.compliance.filter(c => getComplianceStatus(c) === 'Expired').length,
    criticalSoon: state.compliance.filter(c => getComplianceStatus(c) === 'Critical Soon').length,
    dueSoon: state.compliance.filter(c => getComplianceStatus(c) === 'Due Soon').length,
    compliant: state.compliance.filter(c => getComplianceStatus(c) === 'Compliant').length,
  };

  // Referral pipeline data for chart
  const pipelineData = [
    { stage: 'New', count: filteredReferrals.filter(r => r.stage === 'New').length },
    { stage: 'Missing Docs', count: filteredReferrals.filter(r => r.stage === 'Missing Docs').length },
    { stage: 'Eligibility', count: filteredReferrals.filter(r => r.stage === 'Eligibility').length },
    { stage: 'Staffing', count: filteredReferrals.filter(r => r.stage === 'Staffing').length },
    { stage: 'Scheduled', count: filteredReferrals.filter(r => r.stage === 'Scheduled').length },
    { stage: 'Started', count: filteredReferrals.filter(r => r.stage === 'Started').length },
  ];

  // Service distribution for pie chart
  const serviceDistData = serviceTypes.filter(s => s !== 'All').map(s => ({
    name: s,
    value: filteredReferrals.filter(r => r.serviceType === s).length,
  })).filter(d => d.value > 0);

  // Stuck referrals by owner
  const now = new Date();
  const stuckByOwner = filteredReferrals
    .filter(r => {
      if (r.stage === 'Started' || r.stage === 'Declined') return false;
      const hours = (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      return hours > 48;
    })
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.assignedOwner] = (acc[r.assignedOwner] || 0) + 1;
      return acc;
    }, {});

  // SLA breaches
  const slaBreaches = filteredReferrals.filter(r => {
    if (r.stage === 'Started' || r.stage === 'Declined') return false;
    const daysLeft = getDaysUntilExpiry(r.slaDeadline);
    return daysLeft <= 1;
  });

  // Late notes
  const lateNotes = state.quality.filter(q => q.type === 'Late Note' && q.status !== 'Complete');

  // Quality risk score (simple: high-priority open items / total items * 100)
  const openHighPriority = state.quality.filter(q => q.priority === 'High' && q.status !== 'Complete').length;
  const qualityRiskScore = state.quality.length > 0
    ? Math.round((openHighPriority / state.quality.length) * 100)
    : 0;

  // Trend placeholders (since we have demo data, show static deltas)
  const trendDelta = (val: number): { icon: React.ReactNode; label: string; color: string } => {
    if (val > 0) return { icon: <TrendingUp size={11} />, label: `+${val}`, color: 'text-red-500' };
    if (val < 0) return { icon: <TrendingDown size={11} />, label: `${val}`, color: 'text-emerald-500' };
    return { icon: <Minus size={11} />, label: '0', color: 'text-slate-400' };
  };

  if (wallboardMode) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white z-50 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AdvisaCare — Executive Wallboard</h1>
          <button onClick={() => setWallboardMode(false)} className="btn-secondary text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
            Exit Wallboard
          </button>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">New Referrals (24h)</p>
            <p className="text-4xl font-bold mt-2">{kpis.newReferrals24h}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Urgent Referrals</p>
            <p className="text-4xl font-bold mt-2 text-red-400">{kpis.urgentReferrals}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Open Shifts</p>
            <p className="text-4xl font-bold mt-2 text-amber-400">{kpis.openShifts}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Quality Risk</p>
            <p className="text-4xl font-bold mt-2 text-sky-400">{qualityRiskScore}%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-sm font-semibold text-slate-300 mb-4">Referral Pipeline</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineData}>
                <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-sm font-semibold text-slate-300 mb-4">SLA Breaches</p>
            {slaBreaches.length === 0 ? (
              <p className="text-slate-500 text-sm">No SLA breaches</p>
            ) : (
              <div className="space-y-2">
                {slaBreaches.map(r => (
                  <div key={r.id} className="flex justify-between text-sm">
                    <span>{r.patientInitials} — {r.source}</span>
                    <span className="text-red-400">{r.stage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <LayoutDashboard size={22} className="text-advisa-accent" />
            VP Operations Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {filteredReferrals.length} referrals · {state.staff.length} staff · {state.quality.length} quality items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="select text-xs" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
          </select>
          <select className="select text-xs" value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
            {serviceTypes.map(s => <option key={s} value={s}>{s === 'All' ? 'All Services' : s}</option>)}
          </select>
          <button onClick={() => setWallboardMode(true)} className="btn-secondary text-xs py-1.5" title="Executive Wallboard">
            <Monitor size={13} /> Wallboard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-sky-500" /><p className="stat-label">New Referrals</p></div>
          <p className="stat-value text-sky-600">{kpis.newReferrals24h}</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${trendDelta(2).color}`}>{trendDelta(2).icon} {trendDelta(2).label} vs 7d avg</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className="text-red-500" /><p className="stat-label">Urgent Referrals</p></div>
          <p className="stat-value text-red-600">{kpis.urgentReferrals}</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${trendDelta(1).color}`}>{trendDelta(1).icon} {trendDelta(1).label} vs yesterday</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-amber-500" /><p className="stat-label">Open Shifts</p></div>
          <p className="stat-value text-amber-600">{kpis.openShifts}</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${trendDelta(0).color}`}>{trendDelta(0).icon} {trendDelta(0).label} vs yesterday</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Star size={14} className="text-violet-500" /><p className="stat-label">Quality Risk</p></div>
          <p className="stat-value text-violet-600">{qualityRiskScore}%</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${trendDelta(-5).color}`}>{trendDelta(-5).icon} {trendDelta(-5).label}% vs 30d</div>
        </div>
      </div>

      {/* Urgent Activity */}
      {(slaBreaches.length > 0 || complianceCounts.expired > 0 || lateNotes.length > 0) && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="urgent-activity">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-2">
            <AlertTriangle size={14} /> Urgent Activity
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {slaBreaches.length > 0 && (
              <div className="text-red-700">
                <p className="font-medium">{slaBreaches.length} SLA breach{slaBreaches.length > 1 ? 'es' : ''}</p>
                {slaBreaches.slice(0, 3).map(r => (
                  <p key={r.id} className="text-red-600 mt-0.5">{r.patientInitials} — {r.source}</p>
                ))}
              </div>
            )}
            {complianceCounts.expired > 0 && (
              <div className="text-red-700">
                <p className="font-medium">{complianceCounts.expired} expired credential{complianceCounts.expired > 1 ? 's' : ''}</p>
                <p className="text-red-600 mt-0.5">{complianceCounts.criticalSoon} critical soon</p>
              </div>
            )}
            {lateNotes.length > 0 && (
              <div className="text-red-700">
                <p className="font-medium">{lateNotes.length} late note{lateNotes.length > 1 ? 's' : ''}</p>
                {lateNotes.slice(0, 2).map(n => (
                  <p key={n.id} className="text-red-600 mt-0.5">{n.patientInitials} — {n.assignedTo}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="card-header"><Activity size={15} />Referral Pipeline</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData}>
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-header"><TrendingUp size={15} />Service Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={serviceDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                {serviceDistData.map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stuck Referrals */}
        <div className="card">
          <div className="card-header"><Clock size={15} />Stuck Referrals by Owner</div>
          {Object.keys(stuckByOwner).length === 0 ? (
            <p className="text-xs text-slate-400">No stuck referrals</p>
          ) : (
            <div className="space-y-2 text-sm">
              {Object.entries(stuckByOwner).map(([owner, count]) => (
                <div key={owner} className="flex justify-between items-center">
                  <span className="text-slate-600">{owner}</span>
                  <span className="badge badge-warning">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Summary */}
        <div className="card">
          <div className="card-header"><ShieldCheck size={15} />Compliance Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-red-600">Expired</span><span className="font-semibold">{complianceCounts.expired}</span></div>
            <div className="flex justify-between"><span className="text-orange-600">Critical Soon</span><span className="font-semibold">{complianceCounts.criticalSoon}</span></div>
            <div className="flex justify-between"><span className="text-amber-600">Due Soon</span><span className="font-semibold">{complianceCounts.dueSoon}</span></div>
            <div className="flex justify-between"><span className="text-emerald-600">Compliant</span><span className="font-semibold">{complianceCounts.compliant}</span></div>
          </div>
        </div>

        {/* High-Acuity Uncovered */}
        <div className="card">
          <div className="card-header"><AlertTriangle size={15} />Uncovered High-Acuity</div>
          {filteredReferrals.filter(r => r.urgency === 'Immediate' && r.stage === 'Staffing').length === 0 ? (
            <p className="text-xs text-slate-400">No uncovered high-acuity cases</p>
          ) : (
            <div className="space-y-2 text-sm">
              {filteredReferrals.filter(r => r.urgency === 'Immediate' && r.stage === 'Staffing').map(r => (
                <div key={r.id} className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">{r.patientInitials}</span>
                  <span className="badge badge-urgent">{r.serviceType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

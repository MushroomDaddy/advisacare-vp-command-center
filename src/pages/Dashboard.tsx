import { useAppState } from '../context/AppContext';
import { calculateDashboardKPIs, getComplianceStatus, getSLACategory, calculateQualityRiskScore, calculateQAOFromOASIS } from '../utils/dataLogic';
import { getDaysUntilExpiry } from '../lib/dateUtils';
import { exportToCSV } from '../lib/csvUtils';
import { useState } from 'react';
import {
  LayoutDashboard, AlertTriangle, Clock, TrendingUp, TrendingDown,
  FileText, Users, ShieldCheck, Star, Activity, Monitor, Minus,
  Zap, Download, Printer, Brain
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

  const kpis = calculateDashboardKPIs(filteredReferrals, state.staff, state.compliance);
  const qao = calculateQAOFromOASIS(state.oasisAssessments);
  const qualityRiskScore = calculateQualityRiskScore(state.quality, state.oasisAssessments, state.hopeAssessments, state.visits);

  // Compliance counts
  const complianceCounts = {
    expired: state.compliance.filter(c => getComplianceStatus(c) === 'Expired').length,
    criticalSoon: state.compliance.filter(c => getComplianceStatus(c) === 'Critical Soon').length,
    dueSoon: state.compliance.filter(c => getComplianceStatus(c) === 'Due Soon').length,
    compliant: state.compliance.filter(c => getComplianceStatus(c) === 'Compliant').length,
  };

  // Referral pipeline data
  const pipelineData = [
    { stage: 'New', count: filteredReferrals.filter(r => r.stage === 'New').length },
    { stage: 'Missing Docs', count: filteredReferrals.filter(r => r.stage === 'Missing Docs').length },
    { stage: 'Eligibility', count: filteredReferrals.filter(r => r.stage === 'Eligibility').length },
    { stage: 'Staffing', count: filteredReferrals.filter(r => r.stage === 'Staffing').length },
    { stage: 'Scheduled', count: filteredReferrals.filter(r => r.stage === 'Scheduled').length },
    { stage: 'Started', count: filteredReferrals.filter(r => r.stage === 'Started').length },
  ];

  // Service distribution
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

  // SLA breaches and risks (separate)
  const slaBreaches = filteredReferrals.filter(r =>
    r.stage !== 'Started' && r.stage !== 'Declined' && getSLACategory(r.slaDeadline) === 'Breach'
  );
  const slaRisks = filteredReferrals.filter(r =>
    r.stage !== 'Started' && r.stage !== 'Declined' && getSLACategory(r.slaDeadline) === 'Risk'
  );

  // Late notes
  const lateNotes = state.quality.filter(q => q.type === 'Late Note' && q.status !== 'Complete');

  // Trend placeholders
  const trendDelta = (val: number): { icon: React.ReactNode; label: string; color: string } => {
    if (val > 0) return { icon: <TrendingUp size={11} />, label: `+${val}`, color: 'text-red-500' };
    if (val < 0) return { icon: <TrendingDown size={11} />, label: `${val}`, color: 'text-emerald-500' };
    return { icon: <Minus size={11} />, label: '0', color: 'text-slate-400' };
  };

  // --- "What Changed Since Yesterday?" Executive Brief ---
  const yesterdayBrief = {
    newUrgentReferrals: filteredReferrals.filter(r => {
      const hours = (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
      return hours < 24 && r.urgency === 'Immediate';
    }).length,
    slaBreaches: slaBreaches.length,
    slaRisks: slaRisks.length,
    openShifts: kpis.openShifts,
    uncoveredHighAcuity: kpis.uncoveredHighAcuity,
    expiredCredentials: kpis.expiredCredentials,
    lateNotes: lateNotes.length,
    oasisOverdue: state.oasisAssessments.filter(o => o.status === 'Due' && new Date(o.dueDate) < now).length,
    hopeOverdue: state.hopeAssessments.filter(h => h.status === 'Due' && new Date(h.dueDate) < now).length,
    partnerFollowUpsDue: state.partners.filter(p => p.nextFollowUpReminder <= now.toISOString().split('T')[0]).length,
  };

  // --- Top 5 Actions Today ---
  const topActions: { action: string; urgency: string; icon: React.ReactNode }[] = [];
  if (slaBreaches.length > 0) topActions.push({ action: `Resolve ${slaBreaches.length} SLA breach${slaBreaches.length > 1 ? 'es' : ''} — overdue referrals need immediate action`, urgency: 'Critical', icon: <AlertTriangle size={12} className="text-red-600" /> });
  if (kpis.uncoveredHighAcuity > 0) topActions.push({ action: `Staff ${kpis.uncoveredHighAcuity} uncovered high-acuity patient${kpis.uncoveredHighAcuity > 1 ? 's' : ''}`, urgency: 'Critical', icon: <Users size={12} className="text-red-600" /> });
  if (kpis.expiredCredentials > 0) topActions.push({ action: `Address ${kpis.expiredCredentials} expired credential${kpis.expiredCredentials > 1 ? 's' : ''} — staff cannot work`, urgency: 'High', icon: <ShieldCheck size={12} className="text-orange-600" /> });
  if (slaRisks.length > 0) topActions.push({ action: `Monitor ${slaRisks.length} SLA risk${slaRisks.length > 1 ? 's' : ''} — deadline within 24 hours`, urgency: 'High', icon: <Clock size={12} className="text-amber-600" /> });
  if (lateNotes.length > 0) topActions.push({ action: `Follow up on ${lateNotes.length} late documentation note${lateNotes.length > 1 ? 's' : ''}`, urgency: 'Medium', icon: <FileText size={12} className="text-amber-600" /> });
  if (yesterdayBrief.oasisOverdue > 0) topActions.push({ action: `${yesterdayBrief.oasisOverdue} OASIS assessment${yesterdayBrief.oasisOverdue > 1 ? 's' : ''} overdue`, urgency: 'High', icon: <Star size={12} className="text-orange-600" /> });
  if (yesterdayBrief.partnerFollowUpsDue > 0) topActions.push({ action: `${yesterdayBrief.partnerFollowUpsDue} partner follow-up${yesterdayBrief.partnerFollowUpsDue > 1 ? 's' : ''} due today`, urgency: 'Medium', icon: <Activity size={12} className="text-sky-600" /> });

  // --- Branch Comparison ---
  const branchComparison = [...new Set(state.referrals.map(r => r.branch))].map(branch => {
    const branchRefs = state.referrals.filter(r => r.branch === branch);
    return {
      branch,
      total: branchRefs.length,
      active: branchRefs.filter(r => r.stage !== 'Started' && r.stage !== 'Declined').length,
      slaIssues: branchRefs.filter(r => getSLACategory(r.slaDeadline) !== 'On Track' && r.stage !== 'Started' && r.stage !== 'Declined').length,
    };
  });

  // --- Export Executive Brief ---
  const handleExportBrief = () => {
    const rows = [
      { metric: 'New Urgent Referrals (24h)', value: String(yesterdayBrief.newUrgentReferrals) },
      { metric: 'SLA Breaches', value: String(yesterdayBrief.slaBreaches) },
      { metric: 'SLA Risks', value: String(yesterdayBrief.slaRisks) },
      { metric: 'Open Shifts', value: String(yesterdayBrief.openShifts) },
      { metric: 'Uncovered High-Acuity', value: String(yesterdayBrief.uncoveredHighAcuity) },
      { metric: 'Expired Credentials', value: String(yesterdayBrief.expiredCredentials) },
      { metric: 'Late Notes', value: String(yesterdayBrief.lateNotes) },
      { metric: 'Overdue OASIS', value: String(yesterdayBrief.oasisOverdue) },
      { metric: 'Overdue HOPE', value: String(yesterdayBrief.hopeOverdue) },
      { metric: 'Partner Follow-ups Due', value: String(yesterdayBrief.partnerFollowUpsDue) },
      { metric: 'Quality Risk Score', value: String(qualityRiskScore) + '%' },
      { metric: 'QAO (OASIS)', value: String(qao.qaoPct) + '%' },
    ];
    exportToCSV(rows, 'executive-brief.csv');
  };

  // --- Staffing Heatmap for wallboard ---
  const heatmapData = state.staff.map(s => ({
    name: s.name,
    load: Math.round((s.todayVisits / s.maxVisits) * 100),
    visits: s.todayVisits,
    max: s.maxVisits,
  }));

  if (wallboardMode) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white z-50 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AdvisaCare — Executive Wallboard</h1>
          <button onClick={() => setWallboardMode(false)} className="btn-secondary text-xs bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
            Exit Wallboard
          </button>
        </div>

        {/* Large Alert Tiles */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className={`bg-slate-800 rounded-xl p-6 border ${slaBreaches.length > 0 ? 'border-red-500 animate-pulse' : 'border-slate-700'}`}>
            <p className="text-slate-400 text-sm">SLA Breaches</p>
            <p className="text-4xl font-bold mt-2 text-red-400">{slaBreaches.length}</p>
          </div>
          <div className={`bg-slate-800 rounded-xl p-6 border ${slaRisks.length > 0 ? 'border-amber-500' : 'border-slate-700'}`}>
            <p className="text-slate-400 text-sm">SLA Risks</p>
            <p className="text-4xl font-bold mt-2 text-amber-400">{slaRisks.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Open Shifts</p>
            <p className="text-4xl font-bold mt-2 text-amber-400">{kpis.openShifts}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Quality Risk</p>
            <p className={`text-4xl font-bold mt-2 ${qualityRiskScore > 50 ? 'text-red-400' : qualityRiskScore > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>{qualityRiskScore}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Referral Pipeline */}
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

          {/* Staffing Heatmap */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-sm font-semibold text-slate-300 mb-4">Staffing Heatmap</p>
            <div className="space-y-2">
              {heatmapData.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-28 truncate">{item.name}</span>
                  <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.load >= 90 ? 'bg-red-500' : item.load >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(item.load, 100)}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">{item.visits}/{item.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* SLA Issues */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-sm font-semibold text-slate-300 mb-4">SLA Breaches & Risks</p>
            {slaBreaches.length === 0 && slaRisks.length === 0 ? (
              <p className="text-slate-500 text-sm">✅ All SLAs on track</p>
            ) : (
              <div className="space-y-2">
                {slaBreaches.map(r => (
                  <div key={r.id} className="flex justify-between text-sm">
                    <span>{r.patientInitials} — {r.source}</span>
                    <span className="text-red-400 font-semibold">BREACH</span>
                  </div>
                ))}
                {slaRisks.map(r => (
                  <div key={r.id} className="flex justify-between text-sm">
                    <span>{r.patientInitials} — {r.source}</span>
                    <span className="text-amber-400">AT RISK</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partner Follow-ups */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-sm font-semibold text-slate-300 mb-4">Partner Follow-ups Due</p>
            {state.partners.filter(p => p.nextFollowUpReminder <= now.toISOString().split('T')[0]).length === 0 ? (
              <p className="text-slate-500 text-sm">✅ All follow-ups current</p>
            ) : (
              <div className="space-y-2">
                {state.partners.filter(p => p.nextFollowUpReminder <= now.toISOString().split('T')[0]).map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.name}</span>
                    <span className="text-amber-400">Due: {p.nextFollowUpReminder}</span>
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
            {filteredReferrals.length} referrals · {state.staff.length} staff · QAO {qao.qaoPct}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="select text-xs" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
            {branches.map(b => <option key={b} value={b}>{b === 'All' ? 'All Branches' : b}</option>)}
          </select>
          <select className="select text-xs" value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
            {serviceTypes.map(s => <option key={s} value={s}>{s === 'All' ? 'All Services' : s}</option>)}
          </select>
          <button onClick={handleExportBrief} className="btn-secondary text-xs py-1.5" title="Export Executive Brief">
            <Download size={13} /> Brief
          </button>
          <button onClick={() => window.print()} className="btn-secondary text-xs py-1.5" title="Print">
            <Printer size={13} />
          </button>
          <button onClick={() => setWallboardMode(true)} className="btn-secondary text-xs py-1.5" title="Executive Wallboard">
            <Monitor size={13} /> Wallboard
          </button>
        </div>
      </div>

      {/* "What Changed Since Yesterday?" Brief */}
      <div className="card mb-5 bg-gradient-to-r from-sky-50 to-violet-50 border-advisa-accent/20" data-testid="exec-brief">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Zap size={14} className="text-advisa-accent" /> What Changed Since Yesterday?</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="p-2 bg-white/60 rounded-lg">
            <p className="text-slate-500">Urgent Referrals</p>
            <p className="text-lg font-bold text-red-600">{yesterdayBrief.newUrgentReferrals}</p>
          </div>
          <div className="p-2 bg-white/60 rounded-lg">
            <p className="text-slate-500">SLA Breaches / Risks</p>
            <p className="text-lg font-bold"><span className="text-red-600">{yesterdayBrief.slaBreaches}</span> / <span className="text-amber-600">{yesterdayBrief.slaRisks}</span></p>
          </div>
          <div className="p-2 bg-white/60 rounded-lg">
            <p className="text-slate-500">Open Shifts</p>
            <p className="text-lg font-bold text-amber-600">{yesterdayBrief.openShifts}</p>
          </div>
          <div className="p-2 bg-white/60 rounded-lg">
            <p className="text-slate-500">Expired Creds</p>
            <p className="text-lg font-bold text-red-600">{yesterdayBrief.expiredCredentials}</p>
          </div>
          <div className="p-2 bg-white/60 rounded-lg">
            <p className="text-slate-500">Quality Risk</p>
            <p className={`text-lg font-bold ${qualityRiskScore > 50 ? 'text-red-600' : qualityRiskScore > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>{qualityRiskScore}%</p>
          </div>
        </div>
      </div>

      {/* Top 5 Actions Today */}
      {topActions.length > 0 && (
        <div className="card mb-5 bg-amber-50/50 border-amber-200" data-testid="top-actions">
          <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3"><AlertTriangle size={14} className="text-amber-600" /> Top Actions Today</p>
          <div className="space-y-2">
            {topActions.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-amber-100">
                <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-700">{i + 1}</span>
                {a.icon}
                <span className="text-sm text-slate-700 flex-1">{a.action}</span>
                <span className={`badge text-[10px] ${a.urgency === 'Critical' ? 'badge-urgent' : a.urgency === 'High' ? 'badge-warning' : 'badge-info'}`}>{a.urgency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-sky-500" /><p className="stat-label">New Referrals</p></div>
          <p className="stat-value text-sky-600">{kpis.newReferrals24h}</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${trendDelta(2).color}`}>{trendDelta(2).icon} {trendDelta(2).label} vs 7d avg</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className="text-red-500" /><p className="stat-label">SLA Breaches</p></div>
          <p className="stat-value text-red-600">{slaBreaches.length}</p>
          <p className="text-[10px] text-amber-500 mt-1">{slaRisks.length} at risk</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-amber-500" /><p className="stat-label">Open Shifts</p></div>
          <p className="stat-value text-amber-600">{kpis.openShifts}</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${trendDelta(0).color}`}>{trendDelta(0).icon} {trendDelta(0).label} vs yesterday</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Star size={14} className="text-violet-500" /><p className="stat-label">QAO (OASIS)</p></div>
          <p className="stat-value text-violet-600">{qao.qaoPct}%</p>
          <p className="text-[10px] text-slate-400 mt-1">{qao.accepted}/{qao.eligible} accepted</p>
        </div>
      </div>

      {/* Urgent Activity — SLA Breach + Risk separated */}
      {(slaBreaches.length > 0 || slaRisks.length > 0 || complianceCounts.expired > 0 || lateNotes.length > 0) && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="urgent-activity">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-2 mb-2">
            <AlertTriangle size={14} /> Urgent Activity
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {slaBreaches.length > 0 && (
              <div className="text-red-700">
                <p className="font-medium">{slaBreaches.length} SLA Breach{slaBreaches.length > 1 ? 'es' : ''}</p>
                {slaBreaches.slice(0, 3).map(r => (
                  <p key={r.id} className="text-red-600 mt-0.5">{r.patientInitials} — {getDaysUntilExpiry(r.slaDeadline)}d overdue</p>
                ))}
              </div>
            )}
            {slaRisks.length > 0 && (
              <div className="text-amber-700">
                <p className="font-medium">{slaRisks.length} SLA Risk{slaRisks.length > 1 ? 's' : ''}</p>
                {slaRisks.slice(0, 3).map(r => (
                  <p key={r.id} className="text-amber-600 mt-0.5">{r.patientInitials} — {getDaysUntilExpiry(r.slaDeadline)}d left</p>
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

      {/* Branch Comparison + Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Branch Comparison */}
        <div className="card">
          <div className="card-header"><LayoutDashboard size={15} />Branch Comparison</div>
          <div className="space-y-2 text-sm">
            {branchComparison.map(b => (
              <div key={b.branch} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-700">{b.branch}</p>
                  <p className="text-[10px] text-slate-400">{b.total} total · {b.active} active</p>
                </div>
                {b.slaIssues > 0 ? (
                  <span className="badge badge-urgent text-[10px]">{b.slaIssues} SLA issue{b.slaIssues > 1 ? 's' : ''}</span>
                ) : (
                  <span className="badge badge-success text-[10px]">On Track</span>
                )}
              </div>
            ))}
          </div>
        </div>

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
      </div>

      {/* AI Placeholders */}
      <div className="card bg-violet-50/50 border-violet-200">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-violet-600" />
          <p className="text-sm font-bold text-violet-800">AI Command Center (Planned)</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            'AI Referral Packet Summarizer',
            'Missing Document Detector',
            'Predictive Staffing Risk',
            'Referral Source Growth Prediction',
            'Late Documentation Prediction',
            'Smart Scheduling & Routing',
            'Ask the Command Center',
            'Readmission Risk Predictor',
          ].map(feature => (
            <div key={feature} className="p-2 bg-white/60 rounded-lg border border-violet-200 text-violet-700">
              <Brain size={10} className="inline mr-1 text-violet-400" />
              {feature}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-violet-500 mt-2 italic">
          ⚠ These are placeholder features for future AI/ML integration. Currently rules-based demo data only.
        </p>
      </div>
    </div>
  );
}

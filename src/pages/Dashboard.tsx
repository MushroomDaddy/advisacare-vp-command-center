import { useAppState } from '../context/AppContext';
import { exportToCSV } from '../lib/csvUtils';
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Inbox, AlertTriangle, FileWarning, UserCheck, ShieldAlert,
  IdCard, Clock, ClipboardCheck, CalendarCheck, Download,
  TrendingUp, Activity, Target, Zap,
} from 'lucide-react';

const PIE_COLORS = { compliant: '#059669', dueSoon: '#d97706', expired: '#dc2626' };
const BAR_RISK = { Low: '#059669', Medium: '#d97706', High: '#dc2626' };

export default function Dashboard() {
  const { state, getComplianceStatus } = useAppState();
  
  const handleExport = () => {
    const columns = ['Patient Initials', 'Service Type', 'Urgency', 'Source', 'Stage', 'Insurance Status'];
    const data = state.referrals.map(r => ({
      'Patient Initials': r.patientInitials,
      'Service Type': r.serviceType,
      'Urgency': r.urgency,
      'Source': r.source,
      'Stage': r.stage,
      'Insurance Status': r.insuranceStatus,
    }));
    exportToCSV(columns, data, 'advisacare-referrals.csv');
  };
  
  const stats = useMemo(() => {
    const newReferrals = state.referrals.filter(r => {
      const d = new Date(r.createdAt);
      const now = new Date();
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 1;
    }).length;
    
    const urgentReferrals = state.referrals.filter(r => r.urgency === 'Immediate' || r.urgency === 'Urgent 24-48 hours').length;
    const missingDocs = state.referrals.filter(r => r.stage === 'Missing Docs').length;
    const openShifts = state.staff.filter(s => s.availability === 'Available').length;
    const highRisk = state.staff.filter(s => s.overtimeRisk === 'High').length;
    const expired = state.compliance.filter(c => getComplianceStatus(c) === 'Expired').length;
    const dueSoon = state.compliance.filter(c => getComplianceStatus(c) === 'Due Soon').length;
    const pendingQA = state.quality.filter(q => q.status === 'Open').length;
    const openSOC = state.referrals.filter(r => r.stage === 'Scheduled' || r.stage === 'Started').length;
    
    return { newReferrals, urgentReferrals, missingDocs, openShifts, highRisk, expired, dueSoon, pendingQA, openSOC };
  }, [state, getComplianceStatus]);

  const pipelineData = useMemo(() => {
    const stages = ['New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started', 'Declined'];
    return stages.map(stage => ({
      stage: stage === 'Missing Docs' ? 'Missing\nDocs' : stage,
      count: state.referrals.filter(r => r.stage === stage).length,
    }));
  }, [state.referrals]);

  const complianceDonut = useMemo(() => {
    const compliant = state.compliance.filter(c => getComplianceStatus(c) === 'Compliant').length;
    const dueSoon = state.compliance.filter(c => getComplianceStatus(c) === 'Due Soon').length;
    const expired = state.compliance.filter(c => getComplianceStatus(c) === 'Expired').length;
    return [
      { name: 'Compliant', value: compliant, color: PIE_COLORS.compliant },
      { name: 'Due Soon', value: dueSoon, color: PIE_COLORS.dueSoon },
      { name: 'Expired', value: expired, color: PIE_COLORS.expired },
    ].filter(d => d.value > 0);
  }, [state.compliance, getComplianceStatus]);

  const staffWorkload = useMemo(() => {
    return state.staff.map(s => ({
      name: s.name.split(' ')[0],
      visits: s.todayVisits,
      risk: s.overtimeRisk,
    }));
  }, [state.staff]);

  const qualityByType = useMemo(() => {
    const types = ['OASIS Due', 'QA Review', 'Readmission Follow-up', 'Hospice Comfort', 'CAHPS Follow-up', 'Missed Visit', 'Late Note'];
    return types.map(type => ({
      type: type.replace(' Follow-up', '').replace(' Due', ''),
      open: state.quality.filter(q => q.type === type && q.status === 'Open').length,
      inProgress: state.quality.filter(q => q.type === type && q.status === 'In Progress').length,
      complete: state.quality.filter(q => q.type === type && q.status === 'Complete').length,
    })).filter(d => d.open + d.inProgress + d.complete > 0);
  }, [state.quality]);

  const urgentActivities = useMemo(() => {
    const activities: { text: string; severity: 'critical' | 'high' | 'medium' }[] = [];
    
    state.referrals.filter(r => r.urgency === 'Immediate').forEach(r => {
      activities.push({ text: `${r.patientInitials} (${r.serviceType}) — Immediate urgency`, severity: 'critical' });
    });
    
    state.compliance.filter(c => getComplianceStatus(c) === 'Expired').forEach(c => {
      activities.push({ text: `${c.staffName} — ${c.itemType} expired`, severity: 'high' });
    });
    
    state.quality.filter(q => q.priority === 'High' && q.status === 'Open').forEach(q => {
      activities.push({ text: `${q.type} for ${q.patientInitials} — High priority`, severity: 'medium' });
    });
    
    return activities.slice(0, 5);
  }, [state, getComplianceStatus]);

  const kpiCards = [
    { label: 'New Referrals', sub: '24h', value: stats.newReferrals, color: 'text-sky-600', bg: 'bg-sky-50', icon: Inbox },
    { label: 'Urgent Referrals', value: stats.urgentReferrals, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
    { label: 'Missing Docs', value: stats.missingDocs, color: 'text-amber-600', bg: 'bg-amber-50', icon: FileWarning },
    { label: 'Open Shifts', sub: 'Today', value: stats.openShifts, color: 'text-violet-600', bg: 'bg-violet-50', icon: UserCheck },
    { label: 'High-Risk Staff', value: stats.highRisk, color: 'text-red-600', bg: 'bg-red-50', icon: ShieldAlert },
    { label: 'Expired Licenses', value: stats.expired, color: 'text-red-600', bg: 'bg-red-50', icon: IdCard },
    { label: 'Due Soon', value: stats.dueSoon, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    { label: 'Pending QA', value: stats.pendingQA, color: 'text-orange-600', bg: 'bg-orange-50', icon: ClipboardCheck },
    { label: 'SOC Active', value: stats.openSOC, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CalendarCheck },
  ];

  const tooltipStyle = {
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: '12px',
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Activity size={22} className="text-advisa-accent" />
            Executive Morning Brief
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time operational overview</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download size={15} />
          Export CSV
        </button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 mb-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon size={16} className={card.color} />
              </div>
              <p className="stat-label">{card.label}</p>
              {card.sub && <p className="text-[10px] text-slate-400">{card.sub}</p>}
              <p className={`stat-value ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="card-header">
            <TrendingUp size={16} />
            Referral Pipeline
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipelineData} margin={{ top: 5, right: 16, left: -8, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[5, 5, 0, 0]} name="Referrals" maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <Target size={16} />
            Compliance Overview
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={complianceDonut}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {complianceDonut.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: '#475569', fontSize: '12px', fontWeight: 500 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="card-header">
            <UserCheck size={16} />
            Staff Workload Today
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={staffWorkload} margin={{ top: 5, right: 16, left: -8, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="visits" name="Visits" radius={[5, 5, 0, 0]} maxBarSize={36}>
                {staffWorkload.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_RISK[entry.risk as keyof typeof BAR_RISK] || '#0ea5e9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-1 text-[10px] text-slate-500 justify-center">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Low Risk</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-600" /> Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-600" /> High</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <ClipboardCheck size={16} />
            Quality Items by Type
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={qualityByType} margin={{ top: 5, right: 16, left: -8, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="open" stackId="a" fill="#dc2626" name="Open" maxBarSize={36} />
              <Bar dataKey="inProgress" stackId="a" fill="#d97706" name="In Progress" />
              <Bar dataKey="complete" stackId="a" fill="#059669" name="Complete" radius={[5, 5, 0, 0]} />
              <Legend iconType="circle" iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: '#475569', fontSize: '11px', fontWeight: 500 }}>{value}</span>
                )}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Urgent + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <div className="card-header">
            <Zap size={16} className="text-red-500" />
            <span className="text-red-700">Urgent Activity</span>
          </div>
          <ul className="space-y-2">
            {urgentActivities.map((activity, i) => (
              <li key={i} className="flex items-start gap-3 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  activity.severity === 'critical' ? 'bg-red-500' : activity.severity === 'high' ? 'bg-amber-500' : 'bg-orange-400'
                }`} />
                <span className="text-slate-600 leading-relaxed">{activity.text}</span>
              </li>
            ))}
            {urgentActivities.length === 0 && (
              <li className="text-xs text-slate-400">No urgent activities</li>
            )}
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <CalendarCheck size={16} />
            Today's Milestones
          </div>
          <ul className="space-y-2">
            {[
              { label: 'SOCs scheduled today', value: state.referrals.filter(r => r.stage === 'Scheduled').length },
              { label: 'QA reviews completed', value: state.quality.filter(q => q.status === 'Complete').length },
              { label: 'Visits documented', value: state.visits.filter(v => v.documentationStatus === 'Complete').length },
              { label: 'Staff available now', value: state.staff.filter(s => s.availability === 'Available').length },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-slate-600">{item.value} {item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-advisa-primary to-advisa-secondary border-0 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-300 mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Urgent Referrals', href: '/referrals' },
            { label: 'Staffing Gaps', href: '/staffing' },
            { label: 'Compliance Review', href: '/compliance' },
            { label: 'Audit Log', href: '/audit-log' },
          ].map(({ label, href }) => (
            <a key={label} href={href} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors border border-white/10">
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

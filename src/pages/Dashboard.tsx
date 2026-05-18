import { useAppState } from '../context/AppContext';
import { useMemo } from 'react';

export default function Dashboard() {
  const { state } = useAppState();
  
  const stats = useMemo(() => {
    const newReferrals = state.referrals.filter(r => {
      const d = new Date(r.createdAt);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 1;
    }).length;
    
    const urgentReferrals = state.referrals.filter(r => r.urgency === 'Immediate' || r.urgency === 'Urgent 24-48 hours').length;
    const missingDocs = state.referrals.filter(r => r.stage === 'Missing Docs').length;
    const openShifts = state.staff.filter(s => s.availability === 'Available').length;
    const highRisk = state.staff.filter(s => s.overtimeRisk === 'High').length;
    const expired = state.compliance.filter(c => c.status === 'Expired').length;
    const dueSoon = state.compliance.filter(c => c.status === 'Due Soon').length;
    const pendingQA = state.quality.filter(q => q.status === 'Open').length;
    const openSOC = state.referrals.filter(r => r.stage === 'Scheduled' || r.stage === 'Started').length;
    
    return { newReferrals, urgentReferrals, missingDocs, openShifts, highRisk, expired, dueSoon, pendingQA, openSOC };
  }, [state]);

  const urgentActivities = useMemo(() => {
    const activities: { text: string; type: string }[] = [];
    
    state.referrals.filter(r => r.urgency === 'Immediate').forEach(r => {
      activities.push({ text: `Referral ${r.patientInitials} (${r.serviceType}) - IMMEDIATE urgency`, type: 'urgent' });
    });
    
    state.compliance.filter(c => c.status === 'Expired').forEach(c => {
      activities.push({ text: `License expired for ${c.staffName} (${c.itemType})`, type: 'urgent' });
    });
    
    state.quality.filter(q => q.priority === 'High' && q.status === 'Open').forEach(q => {
      activities.push({ text: `${q.type} for ${q.patientInitials} - HIGH priority`, type: 'urgent' });
    });
    
    return activities.slice(0, 5);
  }, [state]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-advisa-primary mb-6">Executive Morning Brief</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'New Referrals (24h)', value: stats.newReferrals, color: 'text-blue-600', bg: 'bg-blue-50', icon: '📥' },
          { label: 'Urgent Referrals', value: stats.urgentReferrals, color: 'text-hipaa-red', bg: 'bg-hipaa-red/10', icon: '🚨' },
          { label: 'Missing Documents', value: stats.missingDocs, color: 'text-hipaa-yellow', bg: 'bg-hipaa-yellow/10', icon: '📄' },
          { label: 'Open Shifts Today', value: stats.openShifts, color: 'text-purple-600', bg: 'bg-purple-50', icon: '👥' },
          { label: 'High-Risk Uncovered', value: stats.highRisk, color: 'text-hipaa-red', bg: 'bg-hipaa-red/10', icon: '⚠️' },
          { label: 'Expired Licenses', value: stats.expired, color: 'text-hipaa-red', bg: 'bg-hipaa-red/10', icon: '🪪' },
          { label: 'Due Soon', value: stats.dueSoon, color: 'text-hipaa-yellow', bg: 'bg-hipaa-yellow/10', icon: '⏰' },
          { label: 'Pending QA Reviews', value: stats.pendingQA, color: 'text-orange-600', bg: 'bg-orange-50', icon: '⭐' },
          { label: 'SOC Active', value: stats.openSOC, color: 'text-blue-600', bg: 'bg-blue-50', icon: '✅' },
        ].map((card) => (
          <div key={card.label} className={`card ${card.bg} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{card.icon}</span>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-advisa-primary mb-4">🚨 Urgent Activity</h3>
          <ul className="space-y-3">
            {urgentActivities.map((activity, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-hipaa-red mt-1.5 flex-shrink-0"></span>
                <span className="text-gray-700">{activity.text}</span>
              </li>
            ))}
            {urgentActivities.length === 0 && (
              <li className="text-sm text-gray-400">No urgent activities 🎉</li>
            )}
          </ul>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-advisa-primary mb-4">✅ Today's Milestones</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-advisa-accent flex-shrink-0"></span>
              <span className="text-gray-700">{state.referrals.filter(r => r.stage === 'Scheduled').length} SOCs scheduled today</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-advisa-accent flex-shrink-0"></span>
              <span className="text-gray-700">{state.quality.filter(q => q.status === 'Complete').length} QA reviews completed</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-advisa-accent flex-shrink-0"></span>
              <span className="text-gray-700">{state.visits.filter(v => v.documentationStatus === 'Complete').length} visits documented</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-advisa-accent flex-shrink-0"></span>
              <span className="text-gray-700">{state.staff.filter(s => s.availability === 'Available').length} staff available now</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 card bg-gradient-to-r from-advisa-primary to-advisa-secondary text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            ['View Urgent Referrals', '/referrals'],
            ['Check Staffing Gaps', '/staffing'],
            ['Review Compliance', '/compliance'],
            ['Audit Log', '/audit-log'],
          ].map(([label, path]) => (
            <a key={label} href={path} className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors">
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

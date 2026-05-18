import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import { calculatePartnerRiskLabel } from '../utils/dataLogic';
import type { ReferralPartner, PartnerRiskLabel } from '../types';
import {
  Handshake, TrendingUp, TrendingDown, Minus, X, Eye, Phone, Mail,
  Calendar, User, Activity, AlertTriangle, BarChart3
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const riskLabelColors: Record<PartnerRiskLabel, string> = {
  'Growing': 'badge-success',
  'Stable': 'badge-info',
  'Needs Attention': 'badge-warning',
  'At Risk': 'badge-urgent',
};

const riskLabelIcons: Record<PartnerRiskLabel, React.ReactNode> = {
  'Growing': <TrendingUp size={11} className="text-emerald-600" />,
  'Stable': <Minus size={11} className="text-sky-600" />,
  'Needs Attention': <AlertTriangle size={11} className="text-amber-600" />,
  'At Risk': <TrendingDown size={11} className="text-red-600" />,
};

function PartnerDetailDrawer({ partner, onClose }: { partner: ReferralPartner; onClose: () => void }) {
  const { state, updatePartner, addAuditEntry, addToast } = useAppState();
  const riskLabel = calculatePartnerRiskLabel(partner);
  const conversionRate = partner.volume > 0 ? Math.round((partner.acceptedReferrals / partner.volume) * 100) : 0;

  const trendData = partner.trends.map(t => ({
    period: t.period,
    Volume: t.volume,
    Accepted: t.accepted,
    Declined: t.declined,
  })).reverse();

  const handleFollowUp = () => {
    const now = new Date().toISOString().split('T')[0];
    const nextDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    updatePartner(partner.id, {
      lastFollowUp: now,
      nextFollowUpReminder: nextDate,
      timeline: [...partner.timeline, { date: now, action: 'Follow-up completed', user: state.currentUser.name }],
    });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Partner',
      recordId: partner.id,
      details: `Follow-up completed for ${partner.name}. Next: ${nextDate}`,
    });
    addToast(`Follow-up recorded for ${partner.name}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[480px] bg-white shadow-2xl overflow-y-auto border-l border-advisa-border">
        <div className="sticky top-0 bg-white border-b border-advisa-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-lg font-bold text-slate-800">{partner.name}</p>
            <p className="text-xs text-slate-400">{partner.type} · {partner.contactName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Risk Label + Scorecard */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="stat-label">Risk Label</p>
              <span className={`badge ${riskLabelColors[riskLabel]} mt-1 flex items-center gap-1 w-fit`}>
                {riskLabelIcons[riskLabel]} {riskLabel}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="stat-label">Conversion Rate</p>
              <p className={`text-xl font-bold ${conversionRate >= 70 ? 'text-emerald-600' : conversionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {conversionRate}%
              </p>
            </div>
          </div>

          {/* Scorecard */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-sky-50 rounded-lg"><p className="text-slate-500">30d Volume</p><p className="text-lg font-bold text-sky-600">{partner.volume}</p></div>
            <div className="p-3 bg-emerald-50 rounded-lg"><p className="text-slate-500">Accepted</p><p className="text-lg font-bold text-emerald-600">{partner.acceptedReferrals}</p></div>
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-slate-500">Declined</p><p className="text-lg font-bold text-red-600">{partner.declinedReferrals}</p></div>
            <div className="p-3 bg-violet-50 rounded-lg"><p className="text-slate-500">Avg Referral→SOC</p><p className="text-lg font-bold text-violet-600">{partner.avgTimeToSOC}</p></div>
          </div>

          {/* Lost Reasons */}
          {partner.lostReasons.length > 0 && (
            <div>
              <p className="section-title mb-2">Lost Reasons</p>
              <div className="flex gap-1.5 flex-wrap">
                {partner.lostReasons.map(r => (
                  <span key={r} className="badge badge-urgent text-[10px]">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="section-title mb-2">Contact</p>
            <div className="space-y-1.5 text-xs">
              <p className="flex items-center gap-2"><User size={11} className="text-slate-400" /> {partner.contactName}</p>
              <p className="flex items-center gap-2"><Mail size={11} className="text-slate-400" /> {partner.contactEmail}</p>
              <p className="flex items-center gap-2"><Phone size={11} className="text-slate-400" /> {partner.contactPhone}</p>
              <p className="flex items-center gap-2"><User size={11} className="text-slate-400" /> Owner: <strong>{partner.relationshipOwner}</strong></p>
            </div>
          </div>

          {/* Follow-Up */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="section-title">Follow-Up</p>
              <button onClick={handleFollowUp} className="btn-primary text-[10px] py-1 px-2">
                <Calendar size={10} /> Record Follow-Up
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p><span className="text-slate-400">Last:</span> <strong>{partner.lastFollowUp}</strong></p>
              <p><span className="text-slate-400">Next:</span> <strong>{partner.nextFollowUpReminder}</strong></p>
            </div>
          </div>

          {/* Trend Chart */}
          {trendData.length > 0 && (
            <div>
              <p className="section-title mb-2 flex items-center gap-2"><BarChart3 size={13} /> 30/60/90 Day Trend</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trendData}>
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Volume" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Accepted" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Declined" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Timeline */}
          {partner.timeline.length > 0 && (
            <div>
              <p className="section-title mb-2 flex items-center gap-2"><Activity size={13} /> Activity Timeline</p>
              <div className="space-y-2 relative pl-4 border-l-2 border-advisa-border">
                {partner.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-advisa-accent rounded-full border-2 border-white" />
                    <p className="text-xs font-semibold text-slate-700">{event.action}</p>
                    <p className="text-[10px] text-slate-400">{event.date} · {event.user}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {partner.notes && (
            <div>
              <p className="section-title mb-1">Notes</p>
              <p className="text-xs text-slate-600 p-2 bg-slate-50 rounded">{partner.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReferralPartners() {
  const { state } = useAppState();
  const [selectedPartner, setSelectedPartner] = useState<ReferralPartner | null>(null);
  const [filterRisk, setFilterRisk] = useState<PartnerRiskLabel | 'All'>('All');

  const filtered = state.partners.filter(p =>
    filterRisk === 'All' || p.riskLabel === filterRisk
  );

  const totalVolume = state.partners.reduce((s, p) => s + p.volume, 0);
  const totalAccepted = state.partners.reduce((s, p) => s + p.acceptedReferrals, 0);
  const overallConversion = totalVolume > 0 ? Math.round((totalAccepted / totalVolume) * 100) : 0;
  const followUpsDue = state.partners.filter(p => p.nextFollowUpReminder <= new Date().toISOString().split('T')[0]).length;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Handshake size={22} className="text-advisa-accent" />
            Referral Partners
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {state.partners.length} partners · {totalVolume} referrals (30d) · {overallConversion}% conversion
            {followUpsDue > 0 && <span className="text-amber-600"> · {followUpsDue} follow-up{followUpsDue > 1 ? 's' : ''} due</span>}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <p className="stat-label">Total Volume (30d)</p>
          <p className="stat-value text-sky-600">{totalVolume}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Conversion</p>
          <p className={`stat-value ${overallConversion >= 70 ? 'text-emerald-600' : overallConversion >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{overallConversion}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">At Risk Partners</p>
          <p className="stat-value text-red-600">{state.partners.filter(p => p.riskLabel === 'At Risk' || p.riskLabel === 'Needs Attention').length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Follow-ups Due</p>
          <p className="stat-value text-amber-600">{followUpsDue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select className="select" value={filterRisk} onChange={e => setFilterRisk(e.target.value as PartnerRiskLabel | 'All')}>
          <option value="All">All Risk Labels</option>
          <option value="Growing">Growing</option>
          <option value="Stable">Stable</option>
          <option value="Needs Attention">Needs Attention</option>
          <option value="At Risk">At Risk</option>
        </select>
      </div>

      {/* Partners Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Partner</th>
              <th className="table-head">Type</th>
              <th className="table-head">Volume (30d)</th>
              <th className="table-head">Accepted</th>
              <th className="table-head">Declined</th>
              <th className="table-head">Conversion</th>
              <th className="table-head">Avg SOC Time</th>
              <th className="table-head">Risk</th>
              <th className="table-head">Next Follow-up</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const conv = p.volume > 0 ? Math.round((p.acceptedReferrals / p.volume) * 100) : 0;
              const followUpDue = p.nextFollowUpReminder <= new Date().toISOString().split('T')[0];
              return (
                <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${followUpDue ? 'bg-amber-50/30' : ''}`}>
                  <td className="table-cell font-semibold text-slate-800">{p.name}</td>
                  <td className="table-cell"><span className="badge badge-info text-[10px]">{p.type}</span></td>
                  <td className="table-cell">{p.volume}</td>
                  <td className="table-cell text-emerald-600">{p.acceptedReferrals}</td>
                  <td className="table-cell text-red-500">{p.declinedReferrals}</td>
                  <td className="table-cell">
                    <span className={`font-semibold ${conv >= 70 ? 'text-emerald-600' : conv >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{conv}%</span>
                  </td>
                  <td className="table-cell text-slate-500">{p.avgTimeToSOC}</td>
                  <td className="table-cell">
                    <span className={`badge ${riskLabelColors[p.riskLabel]} flex items-center gap-1 w-fit`}>
                      {riskLabelIcons[p.riskLabel]} {p.riskLabel}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={followUpDue ? 'text-amber-600 font-medium' : 'text-slate-500'}>
                      {p.nextFollowUpReminder}
                      {followUpDue && <AlertTriangle size={10} className="inline ml-1 text-amber-500" />}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => setSelectedPartner(p)} className="text-advisa-accent hover:text-advisa-accent-dark">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No partners match your filters</div>}
      </div>

      {/* Detail Drawer */}
      {selectedPartner && (
        <PartnerDetailDrawer partner={selectedPartner} onClose={() => setSelectedPartner(null)} />
      )}
    </div>
  );
}

import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import type { ReferralPartner } from '../types';
import {
  Handshake, Users, TrendingUp, Plus, ChevronDown, ChevronUp,
  Phone, Mail, BarChart3, Calendar, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function ReferralPartners() {
  const { state, addPartner, updatePartner, addAuditEntry } = useAppState();
  const [filterType, setFilterType] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [newPartner, setNewPartner] = useState({ name: '', type: 'Hospital' as ReferralPartner['type'], contactName: '', contactEmail: '', contactPhone: '', volume: '' });

  const types = ['All', 'Hospital', 'Physician', 'Discharge Planner', 'Case Manager', 'Attorney'];

  const filtered = state.partners.filter(p => filterType === 'All' || p.type === filterType);
  const totalVolume = state.partners.reduce((sum, p) => sum + p.volume, 0);
  const totalAccepted = state.partners.reduce((sum, p) => sum + p.acceptedReferrals, 0);
  const totalDeclined = state.partners.reduce((sum, p) => sum + p.declinedReferrals, 0);
  const overallConversion = totalVolume > 0 ? Math.round((totalAccepted / totalVolume) * 100) : 0;

  // Follow-up reminders (due today or past due)
  const today = new Date().toISOString().split('T')[0];
  const dueReminders = state.partners.filter(p => p.nextFollowUpReminder <= today);

  // Chart data for partner performance
  const chartData = state.partners.map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    Accepted: p.acceptedReferrals,
    Declined: p.declinedReferrals,
  }));

  const handleAddPartner = () => {
    if (!newPartner.name) return;
    const partner: ReferralPartner = {
      id: 'p' + Date.now(),
      name: newPartner.name,
      type: newPartner.type,
      volume: parseInt(newPartner.volume) || 0,
      acceptedReferrals: 0,
      declinedReferrals: 0,
      avgTimeToSOC: '—',
      lostReasons: [],
      lastFollowUp: today,
      nextFollowUpReminder: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      contactName: newPartner.contactName,
      contactEmail: newPartner.contactEmail,
      contactPhone: newPartner.contactPhone,
      timeline: [{ date: today, action: 'Partner added', user: state.currentUser.name }],
    };
    addPartner(partner);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Partner',
      recordId: partner.id,
      details: `New partner added: ${partner.name}`,
    });
    setNewPartner({ name: '', type: 'Hospital', contactName: '', contactEmail: '', contactPhone: '', volume: '' });
    setShowAddForm(false);
  };

  const handleFollowUp = (partnerId: string) => {
    const partner = state.partners.find(p => p.id === partnerId);
    if (!partner) return;
    const newTimeline = [...partner.timeline, { date: today, action: 'Follow-up completed', user: state.currentUser.name }];
    const nextReminder = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // eslint-disable-line react-hooks/purity
    updatePartner(partnerId, {
      lastFollowUp: today,
      nextFollowUpReminder: nextReminder,
      timeline: newTimeline,
    });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Partner',
      recordId: partnerId,
      details: `Follow-up completed for ${partner.name}`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Handshake size={22} className="text-advisa-accent" />
            Referral Partner CRM
          </h2>
          <p className="text-xs text-slate-400 mt-1">{state.partners.length} partners · {totalVolume} referrals (30d)</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary"><Plus size={15} />Add Partner</button>
      </div>

      {/* Follow-up Reminders */}
      {dueReminders.length > 0 && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-2 mb-1">
            <AlertTriangle size={13} /> Follow-up Reminders Due
          </p>
          <div className="space-y-1 text-xs text-amber-700">
            {dueReminders.map(p => (
              <p key={p.id}><strong>{p.name}</strong> — last contact: {p.lastFollowUp}</p>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center mb-2"><Users size={16} className="text-sky-600" /></div>
          <p className="stat-label">Partners</p>
          <p className="stat-value text-slate-800">{state.partners.length}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2"><TrendingUp size={16} className="text-emerald-600" /></div>
          <p className="stat-label">Accepted</p>
          <p className="stat-value text-emerald-600">{totalAccepted}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-2"><XCircle size={16} className="text-red-600" /></div>
          <p className="stat-label">Declined</p>
          <p className="stat-value text-red-600">{totalDeclined}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center mb-2"><BarChart3 size={16} className="text-violet-600" /></div>
          <p className="stat-label">Conversion</p>
          <p className="stat-value text-violet-600">{overallConversion}%</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="card mb-5">
        <div className="card-header"><BarChart3 size={15} /> Partner Performance</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="Accepted" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Declined" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card mb-5 bg-sky-50/50 border-sky-200">
          <p className="section-title mb-3">Add New Partner</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Partner Name" className="input" value={newPartner.name} onChange={e => setNewPartner({ ...newPartner, name: e.target.value })} />
            <select className="select" value={newPartner.type} onChange={e => setNewPartner({ ...newPartner, type: e.target.value as ReferralPartner['type'] })}>
              <option>Hospital</option><option>Physician</option><option>Discharge Planner</option><option>Case Manager</option><option>Attorney</option>
            </select>
            <input placeholder="Contact Name" className="input" value={newPartner.contactName} onChange={e => setNewPartner({ ...newPartner, contactName: e.target.value })} />
            <input placeholder="Email" type="email" className="input" value={newPartner.contactEmail} onChange={e => setNewPartner({ ...newPartner, contactEmail: e.target.value })} />
            <input placeholder="Phone" className="input" value={newPartner.contactPhone} onChange={e => setNewPartner({ ...newPartner, contactPhone: e.target.value })} />
            <input placeholder="Volume (30d)" type="number" className="input" value={newPartner.volume} onChange={e => setNewPartner({ ...newPartner, volume: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAddPartner} className="btn-primary">Save</button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-5">
        <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Partner</th>
              <th className="table-head">Type</th>
              <th className="table-head">Contact</th>
              <th className="table-head">Volume</th>
              <th className="table-head">Conversion</th>
              <th className="table-head">Avg SOC</th>
              <th className="table-head">Last Follow-up</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((partner) => {
              const convRate = partner.volume > 0 ? Math.round((partner.acceptedReferrals / partner.volume) * 100) : 0;
              return (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell">
                    <p className="font-semibold text-slate-800">{partner.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{partner.notes.slice(0, 50)}{partner.notes.length > 50 ? '…' : ''}</p>
                  </td>
                  <td className="table-cell"><span className="badge badge-neutral">{partner.type}</span></td>
                  <td className="table-cell">
                    <div className="text-xs space-y-0.5">
                      <p className="font-medium text-slate-700">{partner.contactName}</p>
                      <p className="text-slate-400 flex items-center gap-1"><Mail size={10} />{partner.contactEmail}</p>
                      <p className="text-slate-400 flex items-center gap-1"><Phone size={10} />{partner.contactPhone}</p>
                    </div>
                  </td>
                  <td className="table-cell font-semibold">{partner.volume}</td>
                  <td className="table-cell">
                    <div className="text-xs">
                      <span className="font-semibold text-emerald-600">{convRate}%</span>
                      <span className="text-slate-400 ml-1">({partner.acceptedReferrals}/{partner.volume})</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-500">{partner.avgTimeToSOC}</td>
                  <td className="table-cell text-slate-500 text-xs">{partner.lastFollowUp}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleFollowUp(partner.id)} className="btn-primary text-xs py-1 px-2.5">Follow Up</button>
                      <button onClick={() => setSelectedPartner(selectedPartner === partner.id ? null : partner.id)}
                        className="text-advisa-accent hover:text-advisa-accent-dark transition-colors">
                        {selectedPartner === partner.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Partner Detail / Scorecard */}
      {selectedPartner && (() => {
        const partner = state.partners.find(p => p.id === selectedPartner);
        if (!partner) return null;
        const convRate = partner.volume > 0 ? Math.round((partner.acceptedReferrals / partner.volume) * 100) : 0;
        return (
          <div className="card mt-5 bg-sky-50/50 border-sky-200">
            <p className="section-title mb-3">{partner.name} — Scorecard</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div className="p-3 bg-white rounded-lg border border-advisa-border">
                <p className="stat-label">Referrals Sent</p>
                <p className="text-lg font-bold text-slate-800">{partner.volume}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-advisa-border">
                <p className="stat-label">Accepted</p>
                <p className="text-lg font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={14} /> {partner.acceptedReferrals}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-advisa-border">
                <p className="stat-label">Declined</p>
                <p className="text-lg font-bold text-red-600 flex items-center gap-1"><XCircle size={14} /> {partner.declinedReferrals}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-advisa-border">
                <p className="stat-label">Conversion</p>
                <p className="text-lg font-bold text-violet-600">{convRate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="stat-label">Avg SOC</p>
                <p className="font-medium text-slate-700">{partner.avgTimeToSOC}</p>
              </div>
              <div>
                <p className="stat-label">Lost Reasons</p>
                {partner.lostReasons.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {partner.lostReasons.map(r => <span key={r} className="badge badge-urgent text-[10px]">{r}</span>)}
                  </div>
                ) : <span className="text-slate-400">None</span>}
              </div>
            </div>

            {/* Timeline */}
            <p className="stat-label mb-2">Activity Timeline</p>
            <div className="space-y-2">
              {partner.timeline.slice(0, 10).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <Calendar size={11} className="text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 w-20">{entry.date}</span>
                  <span className="text-slate-600">{entry.action}</span>
                  <span className="text-slate-400">by {entry.user}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

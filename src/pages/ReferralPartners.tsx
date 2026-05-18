import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import { Handshake, Users, TrendingUp, Clock, Plus, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';

export default function ReferralPartners() {
  const { state, addAuditEntry } = useAppState();
  const [filterType, setFilterType] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  
  const types = ['All', 'Hospital', 'Physician', 'Discharge Planner', 'Case Manager', 'Attorney'];
  
  const filtered = state.partners.filter(p => filterType === 'All' || p.type === filterType);
  const totalVolume = state.partners.reduce((sum, p) => sum + p.volume, 0);

  const handleFollowUp = (partnerId: string) => {
    const partner = state.partners.find(p => p.id === partnerId);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Partner',
      recordId: partnerId,
      details: `Follow-up completed for ${partner?.name}`,
    });
    alert(`Follow-up logged for ${partner?.name}`);
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
      
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="stat-card">
          <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center mb-2"><Users size={16} className="text-sky-600" /></div>
          <p className="stat-label">Partners</p>
          <p className="stat-value text-slate-800">{state.partners.length}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2"><TrendingUp size={16} className="text-emerald-600" /></div>
          <p className="stat-label">Volume (30d)</p>
          <p className="stat-value text-emerald-600">{totalVolume}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center mb-2"><Clock size={16} className="text-violet-600" /></div>
          <p className="stat-label">Avg SOC Time</p>
          <p className="stat-value text-violet-600">2.4d</p>
        </div>
      </div>

      {showAddForm && (
        <div className="card mb-5 bg-sky-50/50 border-sky-200">
          <p className="section-title mb-3">Add New Partner</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Partner Name" className="input" />
            <select className="select"><option>Select Type</option><option>Hospital</option><option>Physician</option><option>Discharge Planner</option><option>Case Manager</option><option>Attorney</option></select>
            <input placeholder="Contact Name" className="input" />
            <input placeholder="Email" type="email" className="input" />
            <input placeholder="Phone" className="input" />
            <input placeholder="Volume (30d)" type="number" className="input" />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary">Save</button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-5">
        <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {types.map(t => <option key={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Partner</th>
              <th className="table-head">Type</th>
              <th className="table-head">Contact</th>
              <th className="table-head">Volume</th>
              <th className="table-head">Avg SOC</th>
              <th className="table-head">Lost Reasons</th>
              <th className="table-head">Last Follow-up</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((partner) => (
              <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell">
                  <p className="font-semibold text-slate-800">{partner.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{partner.notes}</p>
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
                <td className="table-cell text-slate-500">{partner.avgTimeToSOC}</td>
                <td className="table-cell">
                  {partner.lostReasons.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {partner.lostReasons.map(r => <span key={r} className="badge badge-urgent">{r}</span>)}
                    </div>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>
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
            ))}
          </tbody>
        </table>
      </div>

      {selectedPartner && (() => {
        const partner = state.partners.find(p => p.id === selectedPartner);
        if (!partner) return null;
        return (
          <div className="card mt-5 bg-sky-50/50 border-sky-200">
            <p className="section-title mb-3">{partner.name} — Detail</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="stat-label">Contact</p><p className="font-medium text-slate-700">{partner.contactName}</p><p className="text-slate-500 text-xs">{partner.contactEmail}</p><p className="text-slate-500 text-xs">{partner.contactPhone}</p></div>
              <div><p className="stat-label">Performance</p><p className="font-medium text-slate-700">{partner.volume} referrals/mo</p><p className="text-slate-500 text-xs">Avg SOC: {partner.avgTimeToSOC}</p></div>
              <div className="col-span-2"><p className="stat-label">Relationship Notes</p><p className="text-slate-600 text-xs mt-1">{partner.notes}</p></div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

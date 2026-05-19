import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import type { ReferralPartner } from '../types';
import { useState, useMemo } from 'react';
import {
  Handshake, Plus, Calendar, TrendingUp, TrendingDown, AlertTriangle,
  X, Phone, Mail,
} from 'lucide-react';

export default function ReferralPartners() {
  const { state, addPartner, updatePartner, addAuditEntry, resolveAlert } = useAppState();
  const { showToast } = useToast();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState<string | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  // New partner form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ReferralPartner['type']>('Hospital');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const selectedPartner = useMemo(
    () => state.partners.find(p => p.id === selectedPartnerId),
    [state.partners, selectedPartnerId]
  );

  const filtered = useMemo(() => state.partners.filter(p =>
    (filterType === 'All' || p.type === filterType) &&
    (filterRisk === 'All' || p.riskLabel === filterRisk)
  ), [state.partners, filterType, filterRisk]);

  const totalVolume = state.partners.reduce((s, p) => s + p.volume, 0);
  const avgConversion = state.partners.length > 0 ? (state.partners.reduce((s, p) => s + p.conversionRate, 0) / state.partners.length * 100).toFixed(0) : 0;

  // Lost reason analytics
  const lostReasonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.partners.forEach(p => {
      (p.lostReasons || []).forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [state.partners]);

  const handleAddPartner = () => {
    if (!newName.trim()) {
      showToast('Partner name is required', 'error');
      return;
    }

    const newPartner: ReferralPartner = {
      id: `p_${Date.now()}`,
      name: newName,
      type: newType,
      volume: 0,
      conversionRate: 0,
      declineRate: 0,
      avgTimeToSOC: 'N/A',
      lostReasons: [],
      lastFollowUp: new Date().toISOString().split('T')[0],
      nextFollowUp: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; })(),
      notes: '',
      contactName: newContactName,
      contactEmail: newContactEmail,
      contactPhone: newContactPhone,
      riskLabel: 'Healthy',
      timeline: [{ timestamp: new Date().toISOString(), action: 'Partner added', user: state.currentUser.name }],
      trendData: [],
    };

    addPartner(newPartner);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'Partner', recordId: newPartner.id,
      details: `New partner: ${newName} (${newType})`,
    });

    showToast(`Partner ${newName} added`, 'success');
    setNewName(''); setNewType('Hospital'); setNewContactName(''); setNewContactEmail(''); setNewContactPhone('');
    setShowAddForm(false);
  };

  const handleFollowUp = () => {
    if (!showFollowUpModal) return;
    const partner = state.partners.find(p => p.id === showFollowUpModal);
    if (!partner) return;

    const now = new Date().toISOString();
    const defaultNext = new Date();
    defaultNext.setDate(defaultNext.getDate() + 14);

    updatePartner(showFollowUpModal, {
      lastFollowUp: now.split('T')[0],
      nextFollowUp: followUpDate || defaultNext.toISOString().split('T')[0],
      notes: followUpNotes ? (partner.notes ? `${partner.notes}\n---\n${now.split('T')[0]}: ${followUpNotes}` : `${now.split('T')[0]}: ${followUpNotes}`) : partner.notes,
      timeline: [...partner.timeline, { timestamp: now, action: 'Follow-up completed', user: state.currentUser.name, details: followUpNotes || undefined }],
    });

    // Resolve follow-up alert if exists
    const alert = state.alerts.find(a => a.sourceRecordType === 'Partner' && a.sourceRecordId === showFollowUpModal && !a.resolved);
    if (alert) resolveAlert(alert.id);

    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Partner', recordId: showFollowUpModal,
      details: `Follow-up: ${followUpNotes || 'No notes'}`,
    });

    showToast(`Follow-up recorded for ${partner.name}`, 'success');
    setShowFollowUpModal(null);
    setFollowUpNotes('');
    setFollowUpDate('');
  };

  const getRiskBadge = (risk: string) => {
    if (risk === 'Healthy') return 'badge-success';
    if (risk === 'At Risk') return 'badge-warning';
    return 'badge-urgent';
  };

  const isFollowUpOverdue = (nextFollowUp: string | undefined) => {
    if (!nextFollowUp) return false;
    return new Date(nextFollowUp) < new Date();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Handshake size={22} className="text-advisa-accent" />
            Referral Partners
          </h2>
          <p className="text-xs text-slate-400 mt-1">{state.partners.length} partners · {totalVolume} total referrals</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary"><Plus size={15} />Add Partner</button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <p className="stat-label">Total Volume</p><p className="stat-value text-slate-800">{totalVolume}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Conversion</p><p className="stat-value text-emerald-600">{avgConversion}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">At Risk</p><p className="stat-value text-amber-600">{state.partners.filter(p => p.riskLabel === 'At Risk').length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Critical</p><p className="stat-value text-red-600">{state.partners.filter(p => p.riskLabel === 'Critical').length}</p>
        </div>
      </div>

      {/* Add Partner Form */}
      {showAddForm && (
        <div className="card mb-5 bg-sky-50/50 border-sky-200">
          <p className="section-title mb-3">Add New Partner</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input className="input" placeholder="Partner Name *" value={newName} onChange={e => setNewName(e.target.value)} />
            <select className="select" value={newType} onChange={e => setNewType(e.target.value as ReferralPartner['type'])}>
              <option>Hospital</option><option>Physician</option><option>Attorney</option><option>Other</option>
            </select>
            <input className="input" placeholder="Contact Name" value={newContactName} onChange={e => setNewContactName(e.target.value)} />
            <input className="input" placeholder="Contact Email" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} />
            <input className="input" placeholder="Contact Phone" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddPartner} className="btn-primary">Save Partner</button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Types</option><option>Hospital</option><option>Physician</option><option>Attorney</option><option>Other</option>
        </select>
        <select className="select" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
          <option value="All">All Risk Levels</option><option>Healthy</option><option>At Risk</option><option>Critical</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Partners List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(partner => (
            <div
              key={partner.id}
              className={`card cursor-pointer transition-all ${selectedPartnerId === partner.id ? 'ring-2 ring-advisa-accent' : 'hover:shadow-card-hover'}`}
              onClick={() => setSelectedPartnerId(selectedPartnerId === partner.id ? null : partner.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-slate-800">{partner.name}</h3>
                    <span className="badge badge-neutral">{partner.type}</span>
                    <span className={`badge ${getRiskBadge(partner.riskLabel || 'Healthy')}`}>{partner.riskLabel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-2 text-xs">
                    <div><p className="stat-label">Volume</p><p className="font-bold text-slate-800">{partner.volume}</p></div>
                    <div><p className="stat-label">Conversion</p><p className="font-bold text-emerald-600">{(partner.conversionRate * 100).toFixed(0)}%</p></div>
                    <div><p className="stat-label">Decline Rate</p><p className={`font-bold ${(partner.declineRate || 0) > 0.1 ? 'text-red-600' : 'text-slate-600'}`}>{((partner.declineRate || 0) * 100).toFixed(0)}%</p></div>
                    <div><p className="stat-label">Avg SOC</p><p className="font-bold text-slate-700">{partner.avgTimeToSOC}</p></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isFollowUpOverdue(partner.nextFollowUp) && (
                    <span className="badge badge-urgent text-[9px]"><AlertTriangle size={9} />Follow-up overdue</span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setShowFollowUpModal(partner.id); setFollowUpNotes(''); }}
                    className="btn-secondary text-xs py-1 gap-1"
                  >
                    <Calendar size={11} />Follow Up
                  </button>
                </div>
              </div>

              {/* Trend Sparkline */}
              {partner.trendData && partner.trendData.length > 1 && (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Trend:</span>
                  <div className="flex items-end gap-0.5 h-4">
                    {partner.trendData.map((d, i) => (
                      <div
                        key={i}
                        className="w-3 bg-advisa-accent/30 rounded-sm"
                        style={{ height: `${Math.max(4, (d.volume / Math.max(...partner.trendData!.map(t => t.volume))) * 16)}px` }}
                        title={`${d.month}: ${d.volume}`}
                      />
                    ))}
                  </div>
                  {partner.trendData.length >= 2 && (
                    partner.trendData[partner.trendData.length - 1].volume >= partner.trendData[partner.trendData.length - 2].volume
                      ? <TrendingUp size={11} className="text-emerald-500" />
                      : <TrendingDown size={11} className="text-red-500" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="card">
          <div className="card-header">
            <Handshake size={16} className="text-advisa-accent" />
            Partner Detail
          </div>
          {selectedPartner ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-lg font-bold text-slate-800">{selectedPartner.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-neutral">{selectedPartner.type}</span>
                  <span className={`badge ${getRiskBadge(selectedPartner.riskLabel || 'Healthy')}`}>{selectedPartner.riskLabel}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5">
                <p className="stat-label mb-1">Contact</p>
                {selectedPartner.contactName && <p className="text-xs text-slate-700 font-medium">{selectedPartner.contactName}</p>}
                {selectedPartner.contactEmail && (
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} />{selectedPartner.contactEmail}</p>
                )}
                {selectedPartner.contactPhone && (
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} />{selectedPartner.contactPhone}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div><p className="stat-label">Volume</p><p className="font-bold text-slate-800">{selectedPartner.volume}</p></div>
                <div><p className="stat-label">Conversion</p><p className="font-bold text-emerald-600">{(selectedPartner.conversionRate * 100).toFixed(0)}%</p></div>
                <div><p className="stat-label">Last Follow-up</p><p className="text-slate-600">{selectedPartner.lastFollowUp}</p></div>
                <div><p className="stat-label">Next Follow-up</p>
                  <p className={isFollowUpOverdue(selectedPartner.nextFollowUp) ? 'text-red-600 font-semibold' : 'text-slate-600'}>{selectedPartner.nextFollowUp || 'Not set'}</p>
                </div>
              </div>

              {/* Lost Reasons */}
              {selectedPartner.lostReasons && selectedPartner.lostReasons.length > 0 && (
                <div>
                  <p className="stat-label mb-1">Lost Reasons</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPartner.lostReasons.map((r, i) => <span key={i} className="badge badge-warning">{r}</span>)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPartner.notes && (
                <div>
                  <p className="stat-label mb-1">Notes</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg whitespace-pre-wrap">{selectedPartner.notes}</p>
                </div>
              )}

              {/* Timeline */}
              {selectedPartner.timeline && selectedPartner.timeline.length > 0 && (
                <div>
                  <p className="stat-label mb-2">Timeline</p>
                  <div className="space-y-2">
                    {selectedPartner.timeline.slice(-5).reverse().map((t, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-advisa-accent mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-slate-700 font-medium">{t.action}</p>
                          <p className="text-slate-400 text-[10px]">{t.user} · {new Date(t.timestamp).toLocaleDateString()}</p>
                          {t.details && <p className="text-slate-500 text-[10px]">{t.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { setShowFollowUpModal(selectedPartner.id); setFollowUpNotes(''); }}
                className="btn-primary w-full"
              >
                <Calendar size={13} />Record Follow-up
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Handshake size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Select a partner to view details</p>
            </div>
          )}

          {/* Lost Reason Analytics */}
          {lostReasonCounts.length > 0 && (
            <div className="mt-5 pt-4 border-t border-advisa-border">
              <p className="stat-label mb-2">Lost Reason Analytics (All Partners)</p>
              <div className="space-y-1.5">
                {lostReasonCounts.map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{reason}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5"><div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(count / Math.max(...lostReasonCounts.map(c => c[1]))) * 100}%` }} /></div>
                      <span className="text-slate-500 font-medium w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowFollowUpModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Record Follow-up</h3>
              <button onClick={() => setShowFollowUpModal(null)} className="p-1 hover:bg-slate-100 rounded"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="stat-label block mb-1">Follow-up Notes</label>
                <textarea className="input" rows={3} placeholder="What was discussed..." value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} />
              </div>
              <div>
                <label className="stat-label block mb-1">Next Follow-up Date</label>
                <input type="date" className="input" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleFollowUp} className="btn-primary flex-1">Save Follow-up</button>
              <button onClick={() => setShowFollowUpModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

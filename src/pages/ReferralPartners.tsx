import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import { calculatePartnerRiskLabel } from '../utils/dataLogic';
import { formatDate } from '../lib/dateUtils';
import {
  Handshake, TrendingUp, TrendingDown, AlertTriangle,
  Mail, Phone, Calendar, Activity, X,
  MessageSquare
} from 'lucide-react';

const riskColors: Record<string, string> = {
  'Growing': 'badge-success',
  'Stable': 'badge-info',
  'Needs Attention': 'badge-warning',
  'At Risk': 'badge-urgent',
};

function PartnerDrawer({ partnerId, onClose, onRecordFollowUp }: {
  partnerId: string;
  onClose: () => void;
  onRecordFollowUp: (id: string, notes: string) => void;
}) {
  const { state } = useAppState();
  // Derive from state for fresh data
  const partner = state.partners.find(p => p.id === partnerId);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  if (!partner) return null;

  const calculatedRisk = calculatePartnerRiskLabel(partner);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[480px] bg-white shadow-2xl overflow-y-auto border-l border-advisa-border">
        <div className="sticky top-0 bg-white border-b border-advisa-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-lg font-bold text-slate-800">{partner.name}</p>
            <p className="text-xs text-slate-400">{partner.type}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Risk Label */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Risk Assessment</span>
            <span className={`badge ${riskColors[calculatedRisk]}`}>{calculatedRisk}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="stat-label">Total Volume</p>
              <p className="stat-value text-sky-600">{partner.volume}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="stat-label">Accepted</p>
              <p className="stat-value text-emerald-600">{partner.acceptedReferrals}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="stat-label">Declined</p>
              <p className="stat-value text-red-600">{partner.declinedReferrals}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="stat-label">Avg Time to SOC</p>
              <p className="stat-value text-violet-600">{partner.avgTimeToSOC}</p>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
            <p className="text-xs font-semibold text-sky-800 mb-1">Conversion Rate</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-sky-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${partner.volume > 0 ? (partner.acceptedReferrals / partner.volume) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-bold text-sky-700">
                {partner.volume > 0 ? Math.round((partner.acceptedReferrals / partner.volume) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-slate-700">Contact</p>
            <p className="text-xs text-slate-600">{partner.contactName}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail size={11} /> {partner.contactEmail}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone size={11} /> {partner.contactPhone}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={11} /> Last follow-up: {formatDate(partner.lastFollowUp)}
            </div>
          </div>

          {/* Trends */}
          {partner.trends.length > 0 && (
            <div>
              <p className="section-title mb-2">Volume Trends</p>
              <div className="space-y-1.5">
                {partner.trends.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
                    <span className="text-slate-500">{t.period}</span>
                    <span className="text-slate-700">Vol: <strong>{t.volume}</strong></span>
                    <span className="text-emerald-600">Acc: {t.accepted}</span>
                    <span className="text-red-600">Dec: {t.declined}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lost Reasons */}
          {partner.lostReasons.length > 0 && (
            <div>
              <p className="section-title mb-2">Lost Reasons</p>
              <div className="flex flex-wrap gap-1.5">
                {partner.lostReasons.map(r => (
                  <span key={r} className="badge badge-urgent text-[10px]">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {partner.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <p className="font-semibold mb-1">Notes</p>
              <p>{partner.notes}</p>
            </div>
          )}

          {/* Record Follow-Up */}
          <div>
            {!showFollowUpForm ? (
              <button onClick={() => setShowFollowUpForm(true)} className="btn-primary text-sm w-full">
                <MessageSquare size={14} /> Record Follow-Up
              </button>
            ) : (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-sky-800">Record Follow-Up</p>
                <textarea
                  className="w-full text-xs p-2 border border-sky-200 rounded-lg bg-white resize-none"
                  rows={3}
                  placeholder="Follow-up notes..."
                  value={followUpNotes}
                  onChange={e => setFollowUpNotes(e.target.value)}
                  data-testid="followup-notes"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (followUpNotes.trim()) {
                        onRecordFollowUp(partner.id, followUpNotes);
                        setFollowUpNotes('');
                        setShowFollowUpForm(false);
                      }
                    }}
                    className="btn-primary text-xs flex-1"
                    data-testid="submit-followup"
                  >
                    Save Follow-Up
                  </button>
                  <button onClick={() => setShowFollowUpForm(false)} className="btn-secondary text-xs">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {partner.timeline.length > 0 && (
            <div>
              <p className="section-title mb-2 flex items-center gap-2"><Activity size={13} /> Timeline</p>
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
        </div>
      </div>
    </div>
  );
}

export default function ReferralPartners() {
  const { state, updatePartner, addAuditEntry, addToast } = useAppState();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('All');

  const types = ['All', ...new Set(state.partners.map(p => p.type))];
  const filtered = state.partners.filter(p => filterType === 'All' || p.type === filterType);

  const handleRecordFollowUp = (partnerId: string, notes: string) => {
    const partner = state.partners.find(p => p.id === partnerId);
    if (!partner) return;
    const today = new Date().toISOString().split('T')[0];
    updatePartner(partnerId, {
      lastFollowUp: today,
      nextFollowUpReminder: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      timeline: [...partner.timeline, { date: today, action: `Follow-up: ${notes}`, user: state.currentUser.name }],
      notes: notes,
    });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Partner', recordId: partnerId,
      details: `Follow-up recorded for ${partner.name}: ${notes}`,
    });
    addToast(`Follow-up recorded for ${partner.name}`, 'success');
  };

  // Follow-up overdue partners
  const overduePartners = state.partners.filter(p => new Date(p.nextFollowUpReminder) <= new Date());

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Handshake size={22} className="text-advisa-accent" />
            Referral Partners
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {state.partners.length} partners · {overduePartners.length} follow-ups overdue
          </p>
        </div>
      </div>

      {/* Overdue Follow-Up Warning */}
      {overduePartners.length > 0 && (
        <div className="card mb-5 bg-amber-50/50 border-amber-200">
          <p className="section-title text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle size={13} /> Follow-Up Overdue</p>
          <div className="flex flex-wrap gap-2">
            {overduePartners.map(p => (
              <button key={p.id} onClick={() => setSelectedPartnerId(p.id)} className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs text-amber-800 hover:bg-amber-50">
                {p.name} — due {formatDate(p.nextFollowUpReminder)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3 mb-5">
        <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(partner => {
          const risk = calculatePartnerRiskLabel(partner);
          const convRate = partner.volume > 0 ? Math.round((partner.acceptedReferrals / partner.volume) * 100) : 0;
          const isOverdue = new Date(partner.nextFollowUpReminder) <= new Date();

          return (
            <div key={partner.id}
              onClick={() => setSelectedPartnerId(partner.id)}
              className={`card cursor-pointer hover:shadow-card transition-all ${isOverdue ? 'border-amber-200' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{partner.name}</p>
                  <p className="text-[10px] text-slate-400">{partner.type} · Owner: {partner.relationshipOwner}</p>
                </div>
                <span className={`badge ${riskColors[risk]}`}>
                  {risk === 'Growing' && <TrendingUp size={10} />}
                  {risk === 'At Risk' && <TrendingDown size={10} />}
                  {risk}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-1.5 bg-slate-50 rounded text-[10px]">
                  <p className="font-semibold text-slate-700">{partner.volume}</p>
                  <p className="text-slate-400">Volume</p>
                </div>
                <div className="text-center p-1.5 bg-slate-50 rounded text-[10px]">
                  <p className={`font-semibold ${convRate >= 70 ? 'text-emerald-600' : convRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{convRate}%</p>
                  <p className="text-slate-400">Conv Rate</p>
                </div>
                <div className="text-center p-1.5 bg-slate-50 rounded text-[10px]">
                  <p className="font-semibold text-violet-600">{partner.avgTimeToSOC}</p>
                  <p className="text-slate-400">Avg SOC</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Follow-up: {formatDate(partner.nextFollowUpReminder)}</span>
                {isOverdue && (
                  <span className="text-amber-600 flex items-center gap-0.5">
                    <AlertTriangle size={9} /> Overdue
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No partners match your filter</p>}

      {/* Partner Drawer — uses ID, derives fresh partner from state */}
      {selectedPartnerId && (
        <PartnerDrawer
          partnerId={selectedPartnerId}
          onClose={() => setSelectedPartnerId(null)}
          onRecordFollowUp={handleRecordFollowUp}
        />
      )}
    </div>
  );
}

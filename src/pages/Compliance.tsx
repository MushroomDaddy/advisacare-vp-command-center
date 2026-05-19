import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useState } from 'react';
import { ShieldCheck, CheckCircle, Clock, XCircle, RefreshCw, Upload, X } from 'lucide-react';

interface RenewModalData {
  itemId: string;
  staffName: string;
  itemType: string;
}

export default function Compliance() {
  const { state, updateComplianceItem, getComplianceStatus, addAuditEntry, resolveAlert, createAlert } = useAppState();
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [renewModal, setRenewModal] = useState<RenewModalData | null>(null);
  const [renewDate, setRenewDate] = useState('');
  const [renewProof, setRenewProof] = useState('');

  const filtered = state.compliance.filter(item =>
    (filterStatus === 'All' || getComplianceStatus(item) === filterStatus) &&
    (filterType === 'All' || item.itemType === filterType)
  );

  const counts = {
    compliant: state.compliance.filter(i => getComplianceStatus(i) === 'Compliant').length,
    dueSoon: state.compliance.filter(i => getComplianceStatus(i) === 'Due Soon').length,
    expired: state.compliance.filter(i => getComplianceStatus(i) === 'Expired').length,
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Compliant') return 'badge-success';
    if (status === 'Due Soon') return 'badge-warning';
    return 'badge-urgent';
  };

  const openRenewModal = (itemId: string) => {
    const item = state.compliance.find(c => c.id === itemId);
    if (!item) return;
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    setRenewDate(defaultDate.toISOString().split('T')[0]);
    setRenewProof('');
    setRenewModal({ itemId, staffName: item.staffName, itemType: item.itemType });
  };

  const handleRenewSubmit = () => {
    if (!renewModal || !renewDate) {
      showToast('Please select a new expiry date', 'error');
      return;
    }

    const item = state.compliance.find(c => c.id === renewModal.itemId);
    const oldStatus = item ? getComplianceStatus(item) : 'Unknown';
    const oldExpiry = item?.expiryDate || '';

    updateComplianceItem(renewModal.itemId, {
      status: 'Compliant',
      expiryDate: renewDate,
      lastCompleted: new Date().toISOString().split('T')[0],
    });

    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Compliance',
      recordId: renewModal.itemId,
      details: `Renewal completed for ${renewModal.staffName} — ${renewModal.itemType}${renewProof ? `, proof: ${renewProof}` : ''}, new expiry: ${renewDate}`,
      before: `status: ${oldStatus}, expiryDate: ${oldExpiry}`,
      after: `status: Compliant, expiryDate: ${renewDate}`,
    });

    // Resolve any related alerts
    const relatedAlert = state.alerts.find(a => a.sourceRecordId === renewModal.itemId && !a.resolved);
    if (relatedAlert) {
      resolveAlert(relatedAlert.id);
    }

    showToast(`${renewModal.staffName} — ${renewModal.itemType} renewed successfully`, 'success');
    setRenewModal(null);
  };

  // Create alerts for expired/due soon items that don't have one yet
  const checkAlerts = () => {
    state.compliance.forEach(item => {
      const status = getComplianceStatus(item);
      if (status === 'Expired') {
        createAlert({
          type: 'Expired Credential',
          severity: 'High',
          message: `${item.staffName} — ${item.itemType} expired`,
          sourceRecordType: 'Compliance',
          sourceRecordId: item.id,
        });
      } else if (status === 'Due Soon') {
        createAlert({
          type: 'Due Soon',
          severity: 'Medium',
          message: `${item.staffName} — ${item.itemType} due soon (${item.expiryDate})`,
          sourceRecordType: 'Compliance',
          sourceRecordId: item.id,
        });
      }
    });
  };

  // Check on first render
  useState(() => { checkAlerts(); });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <ShieldCheck size={22} className="text-advisa-accent" />
            Compliance Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">{state.compliance.length} items tracked · {counts.expired} expired</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#059669' }}>
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={15} className="text-emerald-600" /><p className="stat-label">Compliant</p></div>
          <p className="stat-value text-emerald-600">{counts.compliant}</p>
        </div>
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#d97706' }}>
          <div className="flex items-center gap-2 mb-1"><Clock size={15} className="text-amber-600" /><p className="stat-label">Due Soon</p></div>
          <p className="stat-value text-amber-600">{counts.dueSoon}</p>
        </div>
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#dc2626' }}>
          <div className="flex items-center gap-2 mb-1"><XCircle size={15} className="text-red-600" /><p className="stat-label">Expired</p></div>
          <p className="stat-value text-red-600">{counts.expired}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option><option value="Compliant">Compliant</option><option value="Due Soon">Due Soon</option><option value="Expired">Expired</option>
        </select>
        <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="All">All Types</option><option>RN License</option><option>LPN License</option><option>CNA License</option><option>CPR Certification</option>
          <option>Background Check</option><option>Drug Screen</option><option>OSHA Training</option><option>Confidentiality Ack</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Staff Member</th>
              <th className="table-head">Item Type</th>
              <th className="table-head">Status</th>
              <th className="table-head">Expiry</th>
              <th className="table-head">Last Completed</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status = getComplianceStatus(item);
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-semibold text-slate-800">{item.staffName}</td>
                  <td className="table-cell">{item.itemType}</td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
                  </td>
                  <td className="table-cell">
                    <span className={status === 'Expired' ? 'text-red-600 font-semibold' : 'text-slate-500'}>{item.expiryDate}</span>
                  </td>
                  <td className="table-cell text-slate-500">{item.lastCompleted}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {status !== 'Compliant' && (
                        <button onClick={() => openRenewModal(item.id)} className="btn-primary text-xs py-1 px-2.5 gap-1">
                          <RefreshCw size={11} />Renew
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedStaff(selectedStaff === item.staffId ? null : item.staffId)}
                        className="text-advisa-accent hover:text-advisa-accent-dark transition-colors text-xs"
                      >
                        View All
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedStaff && (() => {
        const staffItems = state.compliance.filter(c => c.staffId === selectedStaff);
        const staff = state.staff.find(s => s.id === selectedStaff);
        return (
          <div className="card mb-5 bg-sky-50/50 border-sky-200">
            <p className="section-title mb-3">{staff?.name || 'Unknown'} — All Compliance Items</p>
            <div className="space-y-2">
              {staffItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-white rounded-lg">
                  <span className="text-slate-700">{item.itemType}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{item.expiryDate}</span>
                    <span className={`badge ${getStatusBadge(getComplianceStatus(item))}`}>{getComplianceStatus(item)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Renew Modal */}
      {renewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setRenewModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Renew Compliance Item</h3>
              <button onClick={() => setRenewModal(null)} className="p-1 hover:bg-slate-100 rounded"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="stat-label">Staff Member</p>
                <p className="font-medium text-slate-700 mt-0.5">{renewModal.staffName}</p>
              </div>
              <div>
                <p className="stat-label">Item Type</p>
                <p className="font-medium text-slate-700 mt-0.5">{renewModal.itemType}</p>
              </div>
              <div>
                <label className="stat-label block mb-1">New Expiry Date *</label>
                <input type="date" className="input" value={renewDate} onChange={e => setRenewDate(e.target.value)} />
              </div>
              <div>
                <label className="stat-label block mb-1">Proof Document (optional)</label>
                <div className="flex items-center gap-2">
                  <input type="text" className="input" placeholder="e.g. Certificate #12345" value={renewProof} onChange={e => setRenewProof(e.target.value)} />
                  <button className="btn-secondary text-xs py-2 gap-1 flex-shrink-0" title="Demo only — no actual upload">
                    <Upload size={12} />Attach
                  </button>
                </div>
                <p className="text-[10px] text-amber-600 mt-1">⚠️ Demo mode — no files are actually stored</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleRenewSubmit} className="btn-primary flex-1">Confirm Renewal</button>
              <button onClick={() => setRenewModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-5 mt-5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Compliant</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600" />Due Soon (≤45 days)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" />Expired</div>
      </div>
    </div>
  );
}

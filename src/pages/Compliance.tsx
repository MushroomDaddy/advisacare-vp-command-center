import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import { ShieldCheck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function Compliance() {
  const { state, updateComplianceItem, getComplianceStatus, addAuditEntry } = useAppState();
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  
  const filtered = state.compliance.filter(item => 
    (filterStatus === 'All' || item.status === filterStatus) &&
    (filterType === 'All' || item.itemType === filterType)
  );

  const counts = {
    compliant: state.compliance.filter(i => i.status === 'Compliant').length,
    dueSoon: state.compliance.filter(i => i.status === 'Due Soon').length,
    expired: state.compliance.filter(i => i.status === 'Expired').length,
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Compliant') return 'badge-success';
    if (status === 'Due Soon') return 'badge-warning';
    return 'badge-urgent';
  };

  const handleRenew = (itemId: string) => {
    const item = state.compliance.find(c => c.id === itemId);
    const newExpiry = new Date();
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    
    updateComplianceItem(itemId, {
      status: 'Compliant',
      expiryDate: newExpiry.toISOString().split('T')[0],
      lastCompleted: new Date().toISOString().split('T')[0],
    });
    
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Compliance',
      recordId: itemId,
      details: `Renewal completed for ${item?.staffName} - ${item?.itemType}, new expiry: ${newExpiry.toISOString().split('T')[0]}`,
    });
    alert('Compliance item renewed successfully!');
  };

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
        <div className="stat-card border-l-3 border-emerald-500" style={{ borderLeftWidth: '3px', borderLeftColor: '#059669' }}>
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
          <option>All</option><option>Compliant</option><option>Due Soon</option><option>Expired</option>
        </select>
        <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option>All</option><option>RN License</option><option>LPN License</option><option>CPR Certification</option>
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
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell font-semibold text-slate-800">{item.staffName}</td>
                <td className="table-cell">{item.itemType}</td>
                <td className="table-cell">
                  <span className={`badge ${getStatusBadge(getComplianceStatus(item))}`}>{getComplianceStatus(item)}</span>
                </td>
                <td className="table-cell">
                  <span className={getComplianceStatus(item) === 'Expired' ? 'text-red-600 font-semibold' : 'text-slate-500'}>{item.expiryDate}</span>
                </td>
                <td className="table-cell text-slate-500">{item.lastCompleted}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {getComplianceStatus(item) !== 'Compliant' && (
                      <button onClick={() => handleRenew(item.id)} className="btn-primary text-xs py-1 px-2.5 gap-1">
                        <RefreshCw size={11} />Renew
                      </button>
                    )}
                    <button onClick={() => setSelectedStaff(selectedStaff === item.staffId ? null : item.staffId)}
                      className="text-advisa-accent hover:text-advisa-accent-dark transition-colors">
                      {selectedStaff === item.staffId ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
                  <span className={`badge ${getStatusBadge(getComplianceStatus(item))}`}>{getComplianceStatus(item)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="flex gap-5 mt-5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Compliant</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600" />Due Soon (30–90 days)</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" />Expired</div>
      </div>
    </div>
  );
}

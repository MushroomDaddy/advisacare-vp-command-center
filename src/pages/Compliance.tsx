import { useAppState } from '../context/AppContext';
import { getComplianceStatus, hasWorkRestriction, type ComplianceCategory } from '../utils/dataLogic';
import { getDaysUntilExpiry, formatDate } from '../lib/dateUtils';
import { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle, XCircle,
  RefreshCcw, AlertOctagon
} from 'lucide-react';

const statusColors: Record<ComplianceCategory, string> = {
  'Expired': 'badge-urgent',
  'Critical Soon': 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
  'Due Soon': 'badge-warning',
  'Compliant': 'badge-success',
};

const statusIcons: Record<ComplianceCategory, React.ReactNode> = {
  'Expired': <XCircle size={13} className="text-red-600" />,
  'Critical Soon': <AlertOctagon size={13} className="text-orange-600" />,
  'Due Soon': <Clock size={13} className="text-amber-600" />,
  'Compliant': <CheckCircle size={13} className="text-emerald-600" />,
};

export default function Compliance() {
  const { state, addAuditEntry } = useAppState();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterType, setFilterType] = useState('All');

  const statuses: string[] = ['All', 'Expired', 'Critical Soon', 'Due Soon', 'Compliant'];
  const types = ['All', ...new Set(state.compliance.map(c => c.itemType))];

  // Always calculate status from expiryDate, never trust stored value
  const itemsWithCalcStatus = state.compliance.map(item => ({
    ...item,
    calculatedStatus: getComplianceStatus(item),
    daysLeft: getDaysUntilExpiry(item.expiryDate),
  }));

  const filtered = itemsWithCalcStatus.filter(item =>
    (filterStatus === 'All' || item.calculatedStatus === filterStatus) &&
    (filterType === 'All' || item.itemType === filterType)
  );

  // Counts always from calculated status
  const counts = {
    expired: itemsWithCalcStatus.filter(i => i.calculatedStatus === 'Expired').length,
    criticalSoon: itemsWithCalcStatus.filter(i => i.calculatedStatus === 'Critical Soon').length,
    dueSoon: itemsWithCalcStatus.filter(i => i.calculatedStatus === 'Due Soon').length,
    compliant: itemsWithCalcStatus.filter(i => i.calculatedStatus === 'Compliant').length,
  };

  // Work restrictions
  const staffWithRestrictions = new Set<string>();
  state.compliance.forEach(c => {
    const restriction = hasWorkRestriction(c.staffId, state.compliance);
    if (restriction.restricted) staffWithRestrictions.add(c.staffId);
  });

  const handleRenewal = (itemId: string) => {
    const item = state.compliance.find(c => c.id === itemId);
    if (!item) return;
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Compliance',
      recordId: itemId,
      details: `Renewal initiated for ${item.staffName} — ${item.itemType}`,
    });
    alert(`Renewal initiated for ${item.staffName} — ${item.itemType} (demo action)`);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <ShieldCheck size={22} className="text-advisa-accent" />
          Compliance Tracker
        </h2>
        <p className="text-xs text-slate-400 mt-1">{state.compliance.length} items tracked</p>
      </div>

      {/* Work Restriction Warnings */}
      {staffWithRestrictions.size > 0 && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-800 flex items-center gap-2 mb-1">
            <AlertOctagon size={13} /> Work Restriction Active
          </p>
          <div className="text-xs text-red-700 space-y-1">
            {Array.from(staffWithRestrictions).map(staffId => {
              const restriction = hasWorkRestriction(staffId, state.compliance);
              const staffName = state.compliance.find(c => c.staffId === staffId)?.staffName;
              return (
                <p key={staffId}>
                  <strong>{staffName}</strong>: {restriction.reasons.join(', ')} — cannot be assigned to visits
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Cards — all use calculated counts */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#dc2626' }}>
          <div className="flex items-center gap-2 mb-1"><XCircle size={15} className="text-red-600" /><p className="stat-label">Expired</p></div>
          <p className="stat-value text-red-600">{counts.expired}</p>
        </div>
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#ea580c' }}>
          <div className="flex items-center gap-2 mb-1"><AlertOctagon size={15} className="text-orange-600" /><p className="stat-label">Critical Soon</p></div>
          <p className="stat-value text-orange-600">{counts.criticalSoon}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">0–30 days</p>
        </div>
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#d97706' }}>
          <div className="flex items-center gap-2 mb-1"><Clock size={15} className="text-amber-600" /><p className="stat-label">Due Soon</p></div>
          <p className="stat-value text-amber-600">{counts.dueSoon}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">31–90 days</p>
        </div>
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#059669' }}>
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={15} className="text-emerald-600" /><p className="stat-label">Compliant</p></div>
          <p className="stat-value text-emerald-600">{counts.compliant}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">&gt;90 days</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} data-testid="filter-status">
          {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>
        <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Staff</th>
              <th className="table-head">Item</th>
              <th className="table-head">Status</th>
              <th className="table-head">Expiry Date</th>
              <th className="table-head">Days Left</th>
              <th className="table-head">Last Completed</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell font-semibold text-slate-800">{item.staffName}</td>
                <td className="table-cell text-slate-600">{item.itemType}</td>
                <td className="table-cell">
                  <span className={`badge ${statusColors[item.calculatedStatus]} flex items-center gap-1 w-fit`}>
                    {statusIcons[item.calculatedStatus]}
                    {item.calculatedStatus}
                  </span>
                </td>
                <td className="table-cell text-slate-500">{formatDate(item.expiryDate)}</td>
                <td className="table-cell">
                  <span className={`font-mono text-xs font-semibold ${item.daysLeft < 0 ? 'text-red-600' : item.daysLeft <= 30 ? 'text-orange-600' : item.daysLeft <= 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d`}
                  </span>
                </td>
                <td className="table-cell text-slate-400 text-xs">{formatDate(item.lastCompleted)}</td>
                <td className="table-cell">
                  {item.calculatedStatus !== 'Compliant' && (
                    <button onClick={() => handleRenewal(item.id)} className="btn-primary text-xs py-1 px-2.5">
                      <RefreshCcw size={11} /> Renew
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No items match your filters</div>}

      {/* Prototype Disclaimer */}
      <div className="mt-5 card bg-slate-50">
        <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-slate-500" /><p className="text-xs font-semibold text-slate-600">HIPAA-Conscious Prototype Notice</p></div>
        <p className="text-[11px] text-slate-500">
          This compliance tracker uses demo data only. In production, real credential verification,
          automated expiry monitoring, and integration with state licensing boards would be required.
          No real PHI is stored or processed.
        </p>
      </div>
    </div>
  );
}

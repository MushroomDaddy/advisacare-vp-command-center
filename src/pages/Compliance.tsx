import { useAppState } from '../context/AppContext';
import { getComplianceStatus, type ComplianceCategory } from '../utils/dataLogic';
import { getDaysUntilExpiry, formatDate } from '../lib/dateUtils';
import { exportToCSV } from '../lib/csvUtils';
import { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle, Download,
  Filter, RefreshCw
} from 'lucide-react';

const statusColors: Record<ComplianceCategory, string> = {
  'Expired': 'badge-urgent',
  'Critical Soon': 'bg-orange-100 text-orange-800 border-orange-200',
  'Due Soon': 'badge-warning',
  'Compliant': 'badge-success',
};

const statusIcons: Record<ComplianceCategory, React.ReactNode> = {
  'Expired': <AlertTriangle size={11} className="text-red-500" />,
  'Critical Soon': <Clock size={11} className="text-orange-500" />,
  'Due Soon': <Clock size={11} className="text-amber-500" />,
  'Compliant': <CheckCircle size={11} className="text-emerald-500" />,
};

export default function Compliance() {
  const { state, addAuditEntry, addToast } = useAppState();
  const [filterStatus, setFilterStatus] = useState<ComplianceCategory | 'All'>('All');
  const [filterStaff, setFilterStaff] = useState('All');

  const staffNames = ['All', ...new Set(state.compliance.map(c => c.staffName))];

  const items = state.compliance
    .map(c => ({ ...c, complianceStatus: getComplianceStatus(c), daysLeft: getDaysUntilExpiry(c.expiryDate) }))
    .filter(c =>
      (filterStatus === 'All' || c.complianceStatus === filterStatus) &&
      (filterStaff === 'All' || c.staffName === filterStaff)
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Counts
  const counts = {
    expired: state.compliance.filter(c => getComplianceStatus(c) === 'Expired').length,
    criticalSoon: state.compliance.filter(c => getComplianceStatus(c) === 'Critical Soon').length,
    dueSoon: state.compliance.filter(c => getComplianceStatus(c) === 'Due Soon').length,
    compliant: state.compliance.filter(c => getComplianceStatus(c) === 'Compliant').length,
  };

  const handleRenew = (itemId: string, staffName: string, itemType: string) => {
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Compliance',
      recordId: itemId,
      details: `Initiated renewal for ${staffName} — ${itemType}`,
    });
    addToast(`Renewal initiated for ${staffName} — ${itemType}`, 'info');
  };

  const handleExport = () => {
    const rows = items.map(c => ({
      staffName: c.staffName,
      itemType: c.itemType,
      expiryDate: c.expiryDate,
      status: c.complianceStatus,
      daysLeft: String(c.daysLeft),
    }));
    exportToCSV(rows, 'compliance-report.csv');
    addToast('Compliance report exported', 'success');
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <ShieldCheck size={22} className="text-advisa-accent" />
            Credential Compliance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {state.compliance.length} credentials tracked · {counts.expired} expired · {counts.criticalSoon} critical soon
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary text-xs">
          <Download size={13} /> Export
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card border-red-200 bg-red-50/50">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className="text-red-500" /><p className="stat-label text-red-700">Expired</p></div>
          <p className="stat-value text-red-600">{counts.expired}</p>
        </div>
        <div className="stat-card border-orange-200 bg-orange-50/50">
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-orange-500" /><p className="stat-label text-orange-700">Critical Soon</p></div>
          <p className="stat-value text-orange-600">{counts.criticalSoon}</p>
        </div>
        <div className="stat-card border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-amber-500" /><p className="stat-label text-amber-700">Due Soon</p></div>
          <p className="stat-value text-amber-600">{counts.dueSoon}</p>
        </div>
        <div className="stat-card border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={14} className="text-emerald-500" /><p className="stat-label text-emerald-700">Compliant</p></div>
          <p className="stat-value text-emerald-600">{counts.compliant}</p>
        </div>
      </div>

      {/* Urgent Notifications */}
      {counts.expired > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-5 flex items-center gap-2 text-sm text-red-800" data-testid="compliance-urgent">
          <AlertTriangle size={14} />
          <strong>{counts.expired} staff member{counts.expired > 1 ? 's have' : ' has'} expired credentials</strong> — they cannot be assigned to visits until renewed.
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 items-center flex-wrap">
        <Filter size={14} className="text-slate-400" />
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as ComplianceCategory | 'All')}>
          <option value="All">All Statuses</option>
          <option value="Expired">Expired</option>
          <option value="Critical Soon">Critical Soon</option>
          <option value="Due Soon">Due Soon</option>
          <option value="Compliant">Compliant</option>
        </select>
        <select className="select" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
          {staffNames.map(s => <option key={s} value={s}>{s === 'All' ? 'All Staff' : s}</option>)}
        </select>
      </div>

      {/* Compliance Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Staff</th>
              <th className="table-head">Credential</th>
              <th className="table-head">Expiry Date</th>
              <th className="table-head">Days Left</th>
              <th className="table-head">Status</th>
              <th className="table-head">Last Completed</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${c.complianceStatus === 'Expired' ? 'bg-red-50/50' : ''}`}>
                <td className="table-cell font-semibold text-slate-800">{c.staffName}</td>
                <td className="table-cell">{c.itemType}</td>
                <td className="table-cell text-slate-500">{formatDate(c.expiryDate)}</td>
                <td className="table-cell">
                  <span className={`font-semibold ${c.daysLeft < 0 ? 'text-red-600' : c.daysLeft <= 30 ? 'text-orange-600' : c.daysLeft <= 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {c.daysLeft < 0 ? `${Math.abs(c.daysLeft)}d overdue` : `${c.daysLeft}d`}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${statusColors[c.complianceStatus]} flex items-center gap-1 w-fit`}>
                    {statusIcons[c.complianceStatus]}
                    {c.complianceStatus}
                  </span>
                </td>
                <td className="table-cell text-slate-400 text-xs">{formatDate(c.lastCompleted)}</td>
                <td className="table-cell">
                  {(c.complianceStatus === 'Expired' || c.complianceStatus === 'Critical Soon') && (
                    <button onClick={() => handleRenew(c.id, c.staffName, c.itemType)} className="btn-primary text-[10px] py-1 px-2">
                      <RefreshCw size={10} /> Renew
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No items match your filters</div>}
      </div>
    </div>
  );
}

import { useAppState } from '../context/AppContext';
import { exportToCSV } from '../lib/csvUtils';
import { useState } from 'react';
import { FileSearch, Download, Filter } from 'lucide-react';

export default function AuditLog() {
  const { state, addToast } = useAppState();
  const [filterAction, setFilterAction] = useState('All');
  const [filterRecordType, setFilterRecordType] = useState('All');
  const [filterUser, setFilterUser] = useState('All');

  const actions = ['All', ...new Set(state.auditLog.map(a => a.action))];
  const recordTypes = ['All', ...new Set(state.auditLog.map(a => a.recordType))];
  const users = ['All', ...new Set(state.auditLog.map(a => a.user))];

  const filtered = state.auditLog.filter(a =>
    (filterAction === 'All' || a.action === filterAction) &&
    (filterRecordType === 'All' || a.recordType === filterRecordType) &&
    (filterUser === 'All' || a.user === filterUser)
  );

  const handleExport = () => {
    const rows = filtered.map(a => ({
      timestamp: a.timestamp,
      user: a.user,
      role: a.role,
      action: a.action,
      recordType: a.recordType,
      recordId: a.recordId,
      details: a.details,
      before: a.before || '',
      after: a.after || '',
    }));
    exportToCSV(rows, 'audit-log.csv');
    addToast('Audit log exported', 'success');
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <FileSearch size={22} className="text-advisa-accent" />
            Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {state.auditLog.length} total entries · {filtered.length} shown
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary text-xs">
          <Download size={13} /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <Filter size={14} className="text-slate-400" />
        <select className="select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          {actions.map(a => <option key={a} value={a}>{a === 'All' ? 'All Actions' : a}</option>)}
        </select>
        <select className="select" value={filterRecordType} onChange={e => setFilterRecordType(e.target.value)}>
          {recordTypes.map(r => <option key={r} value={r}>{r === 'All' ? 'All Record Types' : r}</option>)}
        </select>
        <select className="select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          {users.map(u => <option key={u} value={u}>{u === 'All' ? 'All Users' : u}</option>)}
        </select>
      </div>

      {/* Audit Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Timestamp</th>
              <th className="table-head">User</th>
              <th className="table-head">Role</th>
              <th className="table-head">Action</th>
              <th className="table-head">Record</th>
              <th className="table-head">Details</th>
              <th className="table-head">Before → After</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell text-xs text-slate-500 whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</td>
                <td className="table-cell font-medium">{a.user}</td>
                <td className="table-cell text-xs text-slate-400">{a.role}</td>
                <td className="table-cell">
                  <span className={`badge text-[10px] ${a.action === 'Created' ? 'badge-success' : a.action === 'Updated' ? 'badge-info' : a.action === 'Viewed' ? 'badge-neutral' : 'badge-warning'}`}>
                    {a.action}
                  </span>
                </td>
                <td className="table-cell text-xs">
                  <span className="text-slate-500">{a.recordType}</span>
                  <span className="text-slate-300 ml-1">#{a.recordId}</span>
                </td>
                <td className="table-cell text-xs text-slate-600 max-w-[250px] truncate">{a.details}</td>
                <td className="table-cell text-xs">
                  {a.before || a.after ? (
                    <span>
                      <span className="text-red-400 line-through">{a.before}</span>
                      {a.before && a.after && ' → '}
                      <span className="text-emerald-600">{a.after}</span>
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No audit entries match your filters</div>}
      </div>
    </div>
  );
}

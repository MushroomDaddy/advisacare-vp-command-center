import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import { exportToCSV } from '../utils/csvUtils';
import {
  FileSearch, Download, Clock, User, FileText, Filter
} from 'lucide-react';

export default function AuditLog() {
  const { state } = useAppState();
  const [filterAction, setFilterAction] = useState('All');
  const [filterRecordType, setFilterRecordType] = useState('All');
  const [filterUser, setFilterUser] = useState('All');

  const actions = ['All', ...new Set(state.auditLog.map(e => e.action))];
  const recordTypes = ['All', ...new Set(state.auditLog.map(e => e.recordType))];
  const users = ['All', ...new Set(state.auditLog.map(e => e.user))];

  const filtered = state.auditLog.filter(entry =>
    (filterAction === 'All' || entry.action === filterAction) &&
    (filterRecordType === 'All' || entry.recordType === filterRecordType) &&
    (filterUser === 'All' || entry.user === filterUser)
  );

  const handleExport = () => {
    exportToCSV(
      filtered.map(e => ({
        timestamp: e.timestamp,
        user: e.user,
        role: e.role,
        action: e.action,
        recordType: e.recordType,
        recordId: e.recordId,
        details: e.details,
        before: e.before || '',
        after: e.after || '',
      })),
      'audit-log-export.csv'
    );
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <FileSearch size={22} className="text-advisa-accent" />
            Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-1">{state.auditLog.length} entries total · {filtered.length} displayed</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          {actions.map(a => <option key={a} value={a}>{a === 'All' ? 'All Actions' : a}</option>)}
        </select>
        <select className="select" value={filterRecordType} onChange={e => setFilterRecordType(e.target.value)}>
          {recordTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Record Types' : t}</option>)}
        </select>
        <select className="select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          {users.map(u => <option key={u} value={u}>{u === 'All' ? 'All Users' : u}</option>)}
        </select>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Filter size={12} /> {filtered.length} results
        </div>
      </div>

      {/* Table */}
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
              <th className="table-head">Before / After</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <Clock size={10} />
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </td>
                <td className="table-cell">
                  <span className="flex items-center gap-1 text-slate-700">
                    <User size={11} /> {entry.user}
                  </span>
                </td>
                <td className="table-cell"><span className="badge badge-neutral text-[10px]">{entry.role}</span></td>
                <td className="table-cell">
                  <span className={`badge ${entry.action === 'Created' ? 'badge-success' : entry.action === 'Updated' ? 'badge-info' : entry.action === 'Deleted' ? 'badge-urgent' : entry.action === 'Viewed' ? 'badge-neutral' : 'badge-warning'}`}>
                    {entry.action}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-xs">
                    <FileText size={10} className="text-slate-400" />
                    <span className="text-slate-700 font-medium">{entry.recordType}</span>
                    <span className="text-slate-400">#{entry.recordId}</span>
                  </div>
                </td>
                <td className="table-cell text-xs text-slate-600 max-w-[250px] truncate" title={entry.details}>
                  {entry.details}
                </td>
                <td className="table-cell text-xs">
                  {(entry.before || entry.after) ? (
                    <div className="space-y-0.5">
                      {entry.before && <p className="text-red-500"><span className="text-slate-400">−</span> {entry.before}</p>}
                      {entry.after && <p className="text-emerald-500"><span className="text-slate-400">+</span> {entry.after}</p>}
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No audit entries match your filters</div>}
    </div>
  );
}

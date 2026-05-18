import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import { FileSearch, List, Calendar, PenLine, PlusCircle, Download, Lock } from 'lucide-react';

export default function AuditLog() {
  const { state } = useAppState();
  const [filterRole, setFilterRole] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
  const roles = ['All', 'VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'];
  const actions = ['All', 'Created', 'Updated', 'Deleted', 'Exported', 'Viewed'];
  const types = ['All', 'Referral', 'Staff', 'Compliance', 'Visit', 'Quality', 'Partner'];
  
  const filtered = state.auditLog.filter(entry => 
    (filterRole === 'All' || entry.role === filterRole) &&
    (filterAction === 'All' || entry.action === filterAction) &&
    (filterType === 'All' || entry.recordType === filterType)
  );

  const stats = {
    total: state.auditLog.length,
    today: state.auditLog.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString()).length,
    updates: state.auditLog.filter(e => e.action === 'Updated').length,
    creates: state.auditLog.filter(e => e.action === 'Created').length,
  };

  const getActionBadge = (action: string) => {
    if (action === 'Created') return 'badge-success';
    if (action === 'Updated') return 'badge-warning';
    if (action === 'Deleted') return 'badge-urgent';
    return 'badge-neutral';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <FileSearch size={22} className="text-advisa-accent" />
            Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">{stats.total} entries · {stats.today} today</p>
        </div>
        <button className="btn-secondary"><Download size={15} />Export Log</button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mb-2"><List size={16} className="text-slate-600" /></div>
          <p className="stat-label">Total</p>
          <p className="stat-value text-slate-800">{stats.total}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center mb-2"><Calendar size={16} className="text-sky-600" /></div>
          <p className="stat-label">Today</p>
          <p className="stat-value text-sky-600">{stats.today}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2"><PenLine size={16} className="text-amber-600" /></div>
          <p className="stat-label">Updates</p>
          <p className="stat-value text-amber-600">{stats.updates}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2"><PlusCircle size={16} className="text-emerald-600" /></div>
          <p className="stat-label">Creates</p>
          <p className="stat-value text-emerald-600">{stats.creates}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          {roles.map(r => <option key={r}>{r === 'All' ? 'All Roles' : r}</option>)}
        </select>
        <select className="select" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
          {actions.map(a => <option key={a}>{a === 'All' ? 'All Actions' : a}</option>)}
        </select>
        <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {types.map(t => <option key={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Timestamp</th>
              <th className="table-head">User</th>
              <th className="table-head">Role</th>
              <th className="table-head">Action</th>
              <th className="table-head">Record</th>
              <th className="table-head">ID</th>
              <th className="table-head">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell text-slate-400 font-mono text-[11px]">{new Date(entry.timestamp).toLocaleString()}</td>
                <td className="table-cell font-semibold text-slate-800">{entry.user}</td>
                <td className="table-cell"><span className="badge badge-neutral">{entry.role}</span></td>
                <td className="table-cell"><span className={`badge ${getActionBadge(entry.action)}`}>{entry.action}</span></td>
                <td className="table-cell text-slate-600">{entry.recordType}</td>
                <td className="table-cell text-slate-400 font-mono text-[11px]">{entry.recordId}</td>
                <td className="table-cell text-slate-500 text-xs max-w-[280px] truncate">{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">No audit entries match your filters</div>
      )}

      <div className="mt-5 card bg-slate-50">
        <div className="flex items-center gap-2 mb-2"><Lock size={14} className="text-slate-500" /><p className="text-xs font-semibold text-slate-600">Security Requirements</p></div>
        <ul className="text-[11px] text-slate-500 space-y-1">
          <li>• Production: immutable append-only audit logging with hash chains</li>
          <li>• Encrypted storage with strict access controls</li>
          <li>• HIPAA minimum 6-year retention</li>
          <li>• Include IP address, user agent, and session ID</li>
        </ul>
      </div>
    </div>
  );
}

import { useAppState } from '../context/AppContext';
import { useState } from 'react';

export default function AuditLog() {
  const { state } = useAppState();
  const [filterRole, setFilterRole] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
  const roles = ['All', 'VP', 'Intake Coordinator', 'Scheduler', 'Field Staff', 'Compliance Admin'];
  const actions = ['All', 'Created', 'Updated', 'Deleted', 'Exported'];
  const types = ['All', 'Referral', 'Staff', 'Compliance', 'Quality', 'Partner'];
  
  const filtered = state.auditLog.filter(entry => 
    (filterRole === 'All' || entry.role === filterRole) &&
    (filterAction === 'All' || entry.action === filterAction) &&
    (filterType === 'All' || entry.recordType === filterType)
  );

  const stats = {
    total: state.auditLog.length,
    today: state.auditLog.filter(e => {
      const d = new Date(e.timestamp);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
    updates: state.auditLog.filter(e => e.action === 'Updated').length,
    creates: state.auditLog.filter(e => e.action === 'Created').length,
  };

  const getActionColor = (action: string) => {
    if (action === 'Created') return 'text-hipaa-green';
    if (action === 'Updated') return 'text-hipaa-yellow';
    if (action === 'Deleted') return 'text-hipaa-red';
    return 'text-gray-600';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-advisa-primary mb-6">Audit Log</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Total Entries</p>
          <p className="text-3xl font-bold text-advisa-primary">{stats.total}</p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-3xl font-bold text-hipaa-green">{stats.today}</p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Updates</p>
          <p className="text-3xl font-bold text-hipaa-yellow">{stats.updates}</p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Creates</p>
          <p className="text-3xl font-bold text-hipaa-green">{stats.creates}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          {actions.map(a => <option key={a}>{a}</option>)}
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="px-4 py-2 bg-advisa-primary text-white rounded-lg text-sm hover:bg-advisa-secondary">
          Export Log
        </button>
      </div>

      {/* Audit Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2">Timestamp</th>
              <th className="text-left py-3 px-2">User</th>
              <th className="text-left py-3 px-2">Role</th>
              <th className="text-left py-3 px-2">Action</th>
              <th className="text-left py-3 px-2">Record Type</th>
              <th className="text-left py-3 px-2">Record ID</th>
              <th className="text-left py-3 px-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-500 font-mono text-xs">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="py-3 px-2 font-medium">{entry.user}</td>
                <td className="py-3 px-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {entry.role}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`font-medium ${getActionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-600">{entry.recordType}</td>
                <td className="py-3 px-2 text-gray-400 font-mono text-xs">{entry.recordId}</td>
                <td className="py-3 px-2 text-gray-600 text-xs max-w-[300px] truncate">
                  {entry.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No audit entries match your filters
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium">🔒 Audit Log Security Requirements:</p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>• In production, use immutable audit logging (append-only database)</li>
          <li>• Implement cryptographic integrity verification (hash chains)</li>
          <li>• Store logs in secure, encrypted storage with access controls</li>
          <li>• Retain logs per HIPAA requirements (6 years minimum)</li>
          <li>• Include IP address, user agent, and session ID in entries</li>
        </ul>
      </div>
    </div>
  );
}

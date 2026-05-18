import { useAppState } from '../context/AppContext';
import type { QualityStatus } from '../types';
import { useState } from 'react';
import { Star, AlertTriangle, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

export default function Quality() {
  const { state, updateQualityStatus, addAuditEntry } = useAppState();
  const [filterType, setFilterType] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const types = ['All', 'OASIS Due', 'QA Review', 'Readmission Follow-up', 'Hospice Comfort', 'CAHPS Follow-up', 'Missed Visit', 'Late Note'];
  const priorities = ['All', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Open', 'In Progress', 'Complete'];
  
  const filtered = state.quality.filter(item => 
    (filterType === 'All' || item.type === filterType) &&
    (filterPriority === 'All' || item.priority === filterPriority) &&
    (filterStatus === 'All' || item.status === filterStatus)
  );

  const counts = {
    open: state.quality.filter(i => i.status === 'Open').length,
    inProgress: state.quality.filter(i => i.status === 'In Progress').length,
    complete: state.quality.filter(i => i.status === 'Complete').length,
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateQualityStatus(id, newStatus as QualityStatus);
    const item = state.quality.find(q => q.id === id);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Quality',
      recordId: id,
      details: `Status changed to ${newStatus} for ${item?.patientInitials} - ${item?.type}`,
    });
  };

  const highPriorityOpen = state.quality.filter(q => q.priority === 'High' && q.status !== 'Complete');

  return (
    <div>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Star size={22} className="text-advisa-accent" />
          Quality / OASIS / Hospice Watchboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">{state.quality.length} items · {counts.open} open</p>
      </div>

      {highPriorityOpen.length > 0 && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
          <AlertTriangle size={14} />
          {highPriorityOpen.length} high priority items need attention
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#dc2626' }}>
          <div className="flex items-center gap-2 mb-1"><XCircle size={15} className="text-red-600" /><p className="stat-label">Open</p></div>
          <p className="stat-value text-red-600">{counts.open}</p>
        </div>
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#d97706' }}>
          <div className="flex items-center gap-2 mb-1"><Clock size={15} className="text-amber-600" /><p className="stat-label">In Progress</p></div>
          <p className="stat-value text-amber-600">{counts.inProgress}</p>
        </div>
        <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#059669' }}>
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={15} className="text-emerald-600" /><p className="stat-label">Complete</p></div>
          <p className="stat-value text-emerald-600">{counts.complete}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {types.map(t => <option key={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <select className="select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          {priorities.map(p => <option key={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
        </select>
        <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {statuses.map(s => <option key={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Type</th>
              <th className="table-head">Patient</th>
              <th className="table-head">Priority</th>
              <th className="table-head">Due Date</th>
              <th className="table-head">Assigned To</th>
              <th className="table-head">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell font-semibold text-slate-800">{item.type}</td>
                <td className="table-cell">{item.patientInitials}</td>
                <td className="table-cell">
                  <span className={`badge ${
                    item.priority === 'High' ? 'badge-urgent' : item.priority === 'Medium' ? 'badge-warning' : 'badge-success'
                  }`}>{item.priority}</span>
                </td>
                <td className="table-cell text-slate-500">{item.dueDate}</td>
                <td className="table-cell text-slate-600">{item.assignedTo}</td>
                <td className="table-cell">
                  <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white">
                    <option>Open</option><option>In Progress</option><option>Complete</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header"><BarChart3 size={15} />Breakdown by Type</div>
          <div className="space-y-2 text-sm">
            {['OASIS Due', 'QA Review', 'Readmission Follow-up', 'Missed Visit', 'Late Note'].map(type => {
              const count = state.quality.filter(q => q.type === type && q.status !== 'Complete').length;
              return (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-slate-600">{type}</span>
                  <span className={`font-semibold text-xs ${count > 0 ? 'text-red-600' : 'text-slate-300'}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><AlertTriangle size={15} />Open by Priority</div>
          <div className="space-y-2 text-sm">
            {['High', 'Medium', 'Low'].map(priority => {
              const count = state.quality.filter(q => q.priority === priority && q.status !== 'Complete').length;
              return (
                <div key={priority} className="flex justify-between items-center">
                  <span className={priority === 'High' ? 'text-red-600 font-medium' : priority === 'Medium' ? 'text-amber-600' : 'text-slate-600'}>{priority}</span>
                  <span className="font-semibold text-xs">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useAppState } from '../context/AppContext';
import type { QualityStatus } from '../types';
import { useState } from 'react';

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
      <h2 className="text-2xl font-bold text-advisa-primary mb-6">Quality / OASIS / Hospice Watchboard</h2>
      
      {/* Alert for High Priority Open Items */}
      {highPriorityOpen.length > 0 && (
        <div className="mb-6 p-4 bg-hipaa-red/10 border border-hipaa-red/30 rounded-lg">
          <p className="font-medium text-hipaa-red">⚠️ {highPriorityOpen.length} High Priority Items Need Attention!</p>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-hipaa-red hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Open Items</p>
          <p className="text-3xl font-bold text-hipaa-red">{counts.open}</p>
        </div>
        <div className="card border-l-4 border-hipaa-yellow hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-3xl font-bold text-hipaa-yellow">{counts.inProgress}</p>
        </div>
        <div className="card border-l-4 border-hipaa-green hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-hipaa-green">{counts.complete}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          {priorities.map(p => <option key={p}>{p}</option>)}
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="px-4 py-2 bg-advisa-primary text-white rounded-lg text-sm hover:bg-advisa-secondary">
          + Add Quality Item
        </button>
      </div>

      {/* Quality Items Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Patient Initials</th>
              <th className="text-left py-3 px-2">Priority</th>
              <th className="text-left py-3 px-2">Due Date</th>
              <th className="text-left py-3 px-2">Assigned To</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{item.type}</td>
                <td className="py-3 px-2">{item.patientInitials}</td>
                <td className="py-3 px-2">
                  <span className={
                    item.priority === 'High' ? 'badge-urgent' :
                    item.priority === 'Medium' ? 'badge-warning' : 'badge-success'
                  }>
                    {item.priority}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-600">{item.dueDate}</td>
                <td className="py-3 px-2 text-sm">{item.assignedTo}</td>
                <td className="py-3 px-2">
                  <select 
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Complete</option>
                  </select>
                </td>
                <td className="py-3 px-2">
                  <button className="text-xs text-advisa-accent hover:underline">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="font-medium mb-2">By Type</h4>
          <div className="space-y-1 text-sm">
            {['OASIS Due', 'QA Review', 'Readmission Follow-up', 'Missed Visit'].map(type => {
              const count = state.quality.filter(q => q.type === type && q.status !== 'Complete').length;
              return (
                <div key={type} className="flex justify-between">
                  <span className="text-gray-600">{type}</span>
                  <span className={count > 0 ? 'text-hipaa-red font-medium' : 'text-gray-400'}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h4 className="font-medium mb-2">By Priority (Open)</h4>
          <div className="space-y-1 text-sm">
            {['High', 'Medium', 'Low'].map(priority => {
              const count = state.quality.filter(q => q.priority === priority && q.status !== 'Complete').length;
              return (
                <div key={priority} className="flex justify-between">
                  <span className={priority === 'High' ? 'text-hipaa-red' : priority === 'Medium' ? 'text-hipaa-yellow' : 'text-gray-600'}>
                    {priority}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

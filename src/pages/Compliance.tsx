import { useAppState } from '../context/AppContext';
import { useState } from 'react';

export default function Compliance() {
  const { state, addAuditEntry } = useAppState();
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
    // In real app, would update the item
    const item = state.compliance.find(c => c.id === itemId);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Compliance',
      recordId: itemId,
      details: `Renewal initiated for ${item?.staffName} - ${item?.itemType}`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-advisa-primary">Compliance Tracker</h2>
        <button className="px-4 py-2 bg-advisa-primary text-white rounded-lg text-sm hover:bg-advisa-secondary">
          + Add Compliance Item
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-hipaa-green hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Compliant</p>
          <p className="text-3xl font-bold text-hipaa-green">{counts.compliant}</p>
        </div>
        <div className="card border-l-4 border-hipaa-yellow hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Due Soon</p>
          <p className="text-3xl font-bold text-hipaa-yellow">{counts.dueSoon}</p>
        </div>
        <div className="card border-l-4 border-hipaa-red hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-3xl font-bold text-hipaa-red">{counts.expired}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>All</option>
          <option>Compliant</option>
          <option>Due Soon</option>
          <option>Expired</option>
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option>All</option>
          <option>RN License</option>
          <option>LPN License</option>
          <option>CPR Certification</option>
          <option>Background Check</option>
          <option>Drug Screen</option>
          <option>OSHA Training</option>
          <option>Confidentiality Ack</option>
        </select>
      </div>

      {/* Compliance Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2">Staff</th>
              <th className="text-left py-3 px-2">Item</th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-left py-3 px-2">Expiry Date</th>
              <th className="text-left py-3 px-2">Last Completed</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{item.staffName}</td>
                <td className="py-3 px-2">{item.itemType}</td>
                <td className="py-3 px-2">
                  <span className={getStatusBadge(item.status)}>
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={item.status === 'Expired' ? 'text-hipaa-red font-medium' : 'text-gray-600'}>
                    {item.expiryDate}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-500">{item.lastCompleted}</td>
                <td className="py-3 px-2">
                  {item.status !== 'Compliant' && (
                    <button 
                      onClick={() => handleRenew(item.id)}
                      className="text-xs px-3 py-1 bg-advisa-accent text-white rounded hover:bg-advisa-primary"
                    >
                      Renew
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedStaff(selectedStaff === item.staffId ? null : item.staffId)}
                    className="text-xs text-advisa-accent hover:underline ml-2"
                  >
                    {selectedStaff === item.staffId ? 'Hide' : 'Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Staff Compliance Detail */}
      {selectedStaff && (
        <div className="card mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-3">Compliance Summary</h3>
          {(() => {
            const staffItems = state.compliance.filter(c => c.staffId === selectedStaff);
            const staff = state.staff.find(s => s.id === selectedStaff);
            return (
              <div>
                <p className="font-medium">{staff?.name || 'Unknown Staff'}</p>
                <div className="mt-3 space-y-2">
                  {staffItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.itemType}</span>
                      <span className={getStatusBadge(item.status)}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-hipaa-green"></span>
          <span>Compliant (Green)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-hipaa-yellow"></span>
          <span>Due Soon (Yellow)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-hipaa-red"></span>
          <span>Expired (Red)</span>
        </div>
      </div>
    </div>
  );
}

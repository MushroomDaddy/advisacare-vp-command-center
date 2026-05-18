import { useAppState } from '../context/AppContext';
import { useState, useMemo } from 'react';

export default function Staffing() {
  const { state, addAuditEntry } = useAppState();
  const [filterRole, setFilterRole] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  
  const roles = ['All', 'RN', 'LPN', 'HHA', 'CNA', 'PT', 'OT', 'ST'];
  const availabilities = ['All', 'Available', 'Partially', 'Unavailable'];
  
  const filteredStaff = state.staff.filter(s => 
    (filterRole === 'All' || s.role === filterRole) &&
    (filterAvailability === 'All' || s.availability === filterAvailability)
  );

  const cprThreshold = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  }, []);

  const todayVisits = state.staff.reduce((sum, s) => sum + s.todayVisits, 0);
  const openShifts = state.staff
    .filter(s => s.availability !== 'Available')
    .reduce((sum, s) => sum + Math.max(0, 5 - s.todayVisits), 0);
  const highRiskUncovered = state.staff.filter(s => s.overtimeRisk === 'High').length;

  const getBestMatch = () => {
    const available = state.staff.filter(s => 
      s.availability === 'Available' && 
      s.specialties.includes('Wound Care') &&
      s.role === 'RN'
    );
    return available[0] || state.staff.find(s => s.availability === 'Available');
  };

  const bestMatch = getBestMatch();

  const handleAvailabilityToggle = (staffId: string) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (!staff) return;
    const newAvail = staff.availability === 'Available' ? 'Unavailable' : 'Available';
    // In real app, would update state here
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Staff',
      recordId: staffId,
      details: `Availability changed to ${newAvail} for ${staff.name}`,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-advisa-primary mb-6">Staffing Coverage Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Today's Visits</p>
          <p className="text-3xl font-bold text-advisa-primary">{todayVisits}</p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Open Shifts</p>
          <p className="text-3xl font-bold text-hipaa-red">{openShifts}</p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Staff Available</p>
          <p className="text-3xl font-bold text-hipaa-green">
            {state.staff.filter(s => s.availability === 'Available').length}
          </p>
        </div>
        <div className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">High Overtime Risk</p>
          <p className="text-3xl font-bold text-hipaa-yellow">{highRiskUncovered}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
        <select 
          className="px-4 py-2 border border-gray-200 rounded-lg"
          value={filterAvailability}
          onChange={(e) => setFilterAvailability(e.target.value)}
        >
          {availabilities.map(a => <option key={a}>{a}</option>)}
        </select>
        <button className="px-4 py-2 bg-advisa-primary text-white rounded-lg text-sm hover:bg-advisa-secondary">
          + Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-2">Name</th>
              <th className="text-left py-3 px-2">Role</th>
              <th className="text-left py-3 px-2">Specialties</th>
              <th className="text-left py-3 px-2">Availability</th>
              <th className="text-left py-3 px-2">Today's Visits</th>
              <th className="text-left py-3 px-2">Overtime Risk</th>
              <th className="text-left py-3 px-2">Location</th>
              <th className="text-left py-3 px-2">CPR Expiry</th>
              <th className="text-left py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr key={staff.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium">{staff.name}</td>
                <td className="py-3 px-2">
                  <span className="bg-advisa-primary/10 text-advisa-primary px-2 py-1 rounded text-xs font-medium">{staff.role}</span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-1">
                    {staff.specialties.map(s => (
                      <span key={s} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <button
                    onClick={() => handleAvailabilityToggle(staff.id)}
                    className={
                      staff.availability === 'Available' ? 'badge-success cursor-pointer' :
                      staff.availability === 'Partially' ? 'badge-warning cursor-pointer' : 'badge-urgent cursor-pointer'
                    }
                  >
                    {staff.availability}
                  </button>
                </td>
                <td className="py-3 px-2">{staff.todayVisits}</td>
                <td className="py-3 px-2">
                  <span className={
                    staff.overtimeRisk === 'High' ? 'badge-urgent' :
                    staff.overtimeRisk === 'Medium' ? 'badge-warning' : 'badge-success'
                  }>
                    {staff.overtimeRisk}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-600">{staff.location}</td>
                <td className="py-3 px-2">
                  <span className={
                    new Date(staff.cprExpiry) < cprThreshold
                      ? 'text-hipaa-red font-medium' 
                      : 'text-gray-600'
                  }>
                    {staff.cprExpiry}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <button 
                    onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)}
                    className="text-advisa-accent hover:underline text-xs"
                  >
                    {selectedStaff === staff.id ? 'Hide Details' : 'View Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Staff Detail Panel */}
      {selectedStaff && (
        <div className="card mt-6 bg-blue-50 border-blue-200">
          {(() => {
            const staff = state.staff.find(s => s.id === selectedStaff);
            if (!staff) return null;
            return (
              <div>
                <h3 className="text-lg font-semibold text-advisa-primary mb-3">
                  {staff.name} - Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{staff.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">License Expiry</p>
                    <p className="font-medium">{staff.licenseExpiry}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Today's Visits</p>
                    <p className="font-medium">{staff.todayVisits}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Overtime Risk</p>
                    <p className="font-medium">{staff.overtimeRisk}</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Best Match Suggestion */}
      <div className="card mt-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <h3 className="text-lg font-semibold text-advisa-primary mb-3">🎯 Best Staff Match</h3>
        <p className="text-sm text-gray-600 mb-3">For urgent referral needing Wound Care (J.D.):</p>
        {bestMatch && (
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <p className="font-medium">{bestMatch.name} ({bestMatch.role}) - {bestMatch.specialties.join(', ')}</p>
            <p className="text-sm text-gray-600 mt-1">
              ✅ {bestMatch.availability} • 📍 {bestMatch.location} • 
              ⭐ Specialties: {bestMatch.specialties.join(', ')}
            </p>
            <button className="mt-3 px-4 py-2 bg-advisa-accent text-white rounded-lg text-sm hover:bg-advisa-primary">
              Assign to Referral
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

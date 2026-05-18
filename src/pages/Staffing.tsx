import { useAppState } from '../context/AppContext';
import { useState, useMemo } from 'react';
import { Users, Calendar, AlertTriangle, UserCheck, Target, ChevronDown, ChevronUp, Phone, MapPin } from 'lucide-react';

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
      s.availability === 'Available' && s.specialties.includes('Wound Care') && s.role === 'RN'
    );
    return available[0] || state.staff.find(s => s.availability === 'Available');
  };

  const bestMatch = getBestMatch();

  const handleAvailabilityToggle = (staffId: string) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (!staff) return;
    const newAvail = staff.availability === 'Available' ? 'Unavailable' : 'Available';
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
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Users size={22} className="text-advisa-accent" />
          Staffing Coverage Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">{state.staff.length} team members · {filteredStaff.length} shown</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center mb-2"><Calendar size={16} className="text-sky-600" /></div>
          <p className="stat-label">Today's Visits</p>
          <p className="stat-value text-slate-800">{todayVisits}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-2"><AlertTriangle size={16} className="text-red-600" /></div>
          <p className="stat-label">Open Shifts</p>
          <p className="stat-value text-red-600">{openShifts}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2"><UserCheck size={16} className="text-emerald-600" /></div>
          <p className="stat-label">Available</p>
          <p className="stat-value text-emerald-600">{state.staff.filter(s => s.availability === 'Available').length}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2"><AlertTriangle size={16} className="text-amber-600" /></div>
          <p className="stat-label">High OT Risk</p>
          <p className="stat-value text-amber-600">{highRiskUncovered}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          {roles.map(r => <option key={r}>{r === 'All' ? 'All Roles' : r}</option>)}
        </select>
        <select className="select" value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}>
          {availabilities.map(a => <option key={a}>{a === 'All' ? 'All Availability' : a}</option>)}
        </select>
      </div>

      {/* Staff Table */}
      <div className="card p-0 overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Name</th>
              <th className="table-head">Role</th>
              <th className="table-head">Specialties</th>
              <th className="table-head">Status</th>
              <th className="table-head">Visits</th>
              <th className="table-head">OT Risk</th>
              <th className="table-head">Location</th>
              <th className="table-head">CPR Expiry</th>
              <th className="table-head"></th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                <td className="table-cell font-semibold text-slate-800">{staff.name}</td>
                <td className="table-cell"><span className="badge badge-info">{staff.role}</span></td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-1">
                    {staff.specialties.slice(0, 2).map(s => (
                      <span key={s} className="badge badge-neutral">{s}</span>
                    ))}
                    {staff.specialties.length > 2 && <span className="text-xs text-slate-400">+{staff.specialties.length - 2}</span>}
                  </div>
                </td>
                <td className="table-cell">
                  <button onClick={() => handleAvailabilityToggle(staff.id)}
                    className={`badge cursor-pointer ${
                      staff.availability === 'Available' ? 'badge-success' :
                      staff.availability === 'Partially' ? 'badge-warning' : 'badge-urgent'
                    }`}>{staff.availability}</button>
                </td>
                <td className="table-cell font-medium">{staff.todayVisits}</td>
                <td className="table-cell">
                  <span className={`badge ${
                    staff.overtimeRisk === 'High' ? 'badge-urgent' :
                    staff.overtimeRisk === 'Medium' ? 'badge-warning' : 'badge-success'
                  }`}>{staff.overtimeRisk}</span>
                </td>
                <td className="table-cell text-slate-500 text-xs">{staff.location}</td>
                <td className="table-cell">
                  <span className={new Date(staff.cprExpiry) < cprThreshold ? 'text-red-600 font-semibold text-xs' : 'text-slate-500 text-xs'}>{staff.cprExpiry}</span>
                </td>
                <td className="table-cell">
                  <button onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)}
                    className="text-advisa-accent hover:text-advisa-accent-dark transition-colors">
                    {selectedStaff === staff.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStaff && (() => {
        const staff = state.staff.find(s => s.id === selectedStaff);
        if (!staff) return null;
        return (
          <div className="card mb-5 bg-sky-50/50 border-sky-200">
            <p className="section-title mb-3">{staff.name} — Detail</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /><div><p className="stat-label">Phone</p><p className="font-medium text-slate-700">{staff.phone}</p></div></div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /><div><p className="stat-label">Location</p><p className="font-medium text-slate-700">{staff.location}</p></div></div>
              <div><p className="stat-label">License Expiry</p><p className="font-medium text-slate-700">{staff.licenseExpiry}</p></div>
              <div><p className="stat-label">All Specialties</p><div className="flex flex-wrap gap-1 mt-1">{staff.specialties.map(s => <span key={s} className="badge badge-neutral">{s}</span>)}</div></div>
            </div>
          </div>
        );
      })()}

      {/* Best Match */}
      <div className="card bg-gradient-to-r from-advisa-primary to-advisa-secondary border-0 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-sky-300" />
          <p className="text-sm font-semibold">Best Staff Match</p>
        </div>
        <p className="text-xs text-sky-200 mb-3">For urgent referral needing Wound Care (J.D.)</p>
        {bestMatch && (
          <div className="p-4 bg-white/10 rounded-lg border border-white/15">
            <p className="font-semibold text-sm">{bestMatch.name} ({bestMatch.role})</p>
            <p className="text-xs text-sky-200 mt-1">
              {bestMatch.availability} · {bestMatch.location} · {bestMatch.specialties.join(', ')}
            </p>
            <button className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors">
              Assign to Referral
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

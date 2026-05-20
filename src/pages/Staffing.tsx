import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hasBlockingCredential } from '../lib/complianceUtils';
import {
  Users, Calendar, AlertTriangle, UserCheck, Target, Phone, MapPin,
  Plus, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, ArrowRight,
} from 'lucide-react';

export default function Staffing() {
  const { state, addAuditEntry, offerShift, acceptShift, declineShift, createShift, createAlert, resolveAlert, updateReferral } = useAppState();
  const { showToast } = useToast();
  const [filterRole, setFilterRole] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [newShiftReferral, setNewShiftReferral] = useState('');
  const [newShiftDate, setNewShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [newShiftTime, setNewShiftTime] = useState('08:00-16:00');
  const [overrideReason] = useState('');
  const [searchParams] = useSearchParams();
  const deepLinkShift = searchParams.get('shift');
  const [activeTab, setActiveTab] = useState<'staff' | 'shifts'>(deepLinkShift ? 'shifts' : 'staff');

  // Deep link: ?shift=sh1 scrolls to that shift
  useEffect(() => {
    if (deepLinkShift) {
      setTimeout(() => {
        const el = document.getElementById(`shift-${deepLinkShift}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [deepLinkShift]);

  const roles = ['All', 'RN', 'LPN', 'HHA', 'CNA', 'PT', 'OT', 'ST'];
  const availabilities = ['All', 'Available', 'Partially', 'Unavailable'];

  const filteredStaff = useMemo(() => state.staff.filter(s =>
    (filterRole === 'All' || s.role === filterRole) &&
    (filterAvailability === 'All' || s.availability === filterAvailability)
  ), [state.staff, filterRole, filterAvailability]);

  const todayVisits = state.staff.reduce((sum, s) => sum + s.todayVisits, 0);
  const openShiftCount = state.shifts.filter(s => s.status === 'Open').length;
  const highRiskCount = state.staff.filter(s => s.overtimeRisk === 'High').length;

  // Check if a staff member has expired credentials
  const hasExpiredCredentials = (staffId: string) => {
    return hasBlockingCredential(staffId, state.compliance);
  };

  // Best match score calculation
  const getBestMatchScore = (staffId: string, serviceType: string) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (!staff) return { score: 0, reasons: [] as string[] };
    let score = 0;
    const reasons: string[] = [];

    if (staff.availability === 'Available') { score += 30; reasons.push('Available'); }
    else if (staff.availability === 'Partially') { score += 10; reasons.push('Partially available'); }

    if (staff.specialties.some(s => serviceType.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(serviceType.split(' ')[0].toLowerCase()))) {
      score += 30; reasons.push('Specialty match');
    }

    if (staff.overtimeRisk === 'Low') { score += 20; reasons.push('Low OT risk'); }
    else if (staff.overtimeRisk === 'Medium') { score += 10; reasons.push('Medium OT risk'); }

    if (!hasExpiredCredentials(staffId)) { score += 20; reasons.push('Credentials current'); }
    else { reasons.push('⚠️ Expired credential'); }

    return { score, reasons };
  };

  const handleOfferShift = (shiftId: string, staffId: string) => {
    if (hasExpiredCredentials(staffId) && !overrideReason.trim()) {
      showToast('Staff has expired credentials. Enter a demo override reason to proceed, or renew credentials first.', 'error');
      return;
    }
    const staff = state.staff.find(s => s.id === staffId);
    const shift = state.shifts.find(s => s.id === shiftId);
    if (!staff || !shift) return;

    offerShift(shiftId, staffId, staff.name);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Shift', recordId: shiftId,
      details: `Shift offered to ${staff.name} for ${shift.patientInitials}`,
      before: `status: ${shift.status}`, after: `status: Offered, offeredTo: ${staff.name}`,
    });
    showToast(`Shift offered to ${staff.name}`, 'info');
  };

  const handleAcceptShift = (shiftId: string) => {
    const shift = state.shifts.find(s => s.id === shiftId);
    if (!shift) return;

    acceptShift(shiftId);

    // Update the referral with assigned staff
    if (shift.referralId) {
      updateReferral(shift.referralId, { assignedStaffId: shift.offeredTo });
    }

    // Resolve related alerts
    const relatedAlerts = state.alerts.filter(a =>
      (a.sourceRecordType === 'Shift' && a.sourceRecordId === shiftId) ||
      (a.sourceRecordType === 'Referral' && a.sourceRecordId === shift.referralId && a.type === 'Staffing')
    );
    relatedAlerts.forEach(a => { if (!a.resolved) resolveAlert(a.id); });

    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Shift', recordId: shiftId,
      details: `Shift accepted by ${shift.offeredToName} for ${shift.patientInitials}`,
      before: 'status: Offered', after: 'status: Accepted',
    });
    showToast(`Shift accepted by ${shift.offeredToName}`, 'success');
  };

  const handleDeclineShift = (shiftId: string) => {
    const shift = state.shifts.find(s => s.id === shiftId);
    if (!shift) return;
    declineShift(shiftId);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Shift', recordId: shiftId,
      details: `Shift declined (was offered to ${shift.offeredToName})`,
    });
    showToast('Shift declined — returned to Open', 'warning');
  };

  const handleCreateShift = () => {
    const ref = state.referrals.find(r => r.id === newShiftReferral);
    if (!ref) { showToast('Select a referral', 'error'); return; }

    const newId = createShift({
      referralId: ref.id,
      patientInitials: ref.patientInitials,
      serviceType: ref.serviceType,
      status: 'Open',
      date: newShiftDate,
      time: newShiftTime,
      location: ref.dischargeFacility,
      notes: `${ref.serviceType} for ${ref.patientInitials}`,
    });

    createAlert({
      type: 'Open Shift', severity: ref.urgency === 'Immediate' ? 'Critical' : 'High',
      message: `New open shift for ${ref.patientInitials} — ${ref.serviceType}`,
      sourceRecordType: 'Shift', sourceRecordId: newId,
    });

    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'Shift', recordId: newId,
      details: `Shift created for ${ref.patientInitials} on ${newShiftDate}`,
    });

    showToast(`Shift created for ${ref.patientInitials}`, 'success');
    setShowCreateShift(false);
    setNewShiftReferral('');
  };

  const shiftStatusBadge: Record<string, string> = {
    Open: 'badge-urgent', Offered: 'badge-warning', Accepted: 'badge-success', Declined: 'badge-neutral',
  };

  // Staffing-needing referrals for quick shift creation
  const staffingReferrals = state.referrals.filter(r => r.stage === 'Staffing' || (r.serviceType === 'Catastrophic Injury Care' && r.stage !== 'Declined'));

  return (
    <div>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Users size={22} className="text-advisa-accent" />
          Staffing Coverage Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">{state.staff.length} team members · {openShiftCount} open shifts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center mb-2"><Calendar size={16} className="text-sky-600" /></div>
          <p className="stat-label">Today's Visits</p><p className="stat-value text-slate-800">{todayVisits}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-2"><AlertTriangle size={16} className="text-red-600" /></div>
          <p className="stat-label">Open Shifts</p><p className="stat-value text-red-600">{openShiftCount}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2"><UserCheck size={16} className="text-emerald-600" /></div>
          <p className="stat-label">Available</p><p className="stat-value text-emerald-600">{state.staff.filter(s => s.availability === 'Available').length}</p>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2"><AlertTriangle size={16} className="text-amber-600" /></div>
          <p className="stat-label">High OT Risk</p><p className="stat-value text-amber-600">{highRiskCount}</p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 text-xs font-semibold rounded-lg ${activeTab === 'staff' ? 'bg-advisa-accent text-white' : 'bg-white border border-advisa-border text-slate-600 hover:bg-slate-50'}`}>
          Staff Directory
        </button>
        <button onClick={() => setActiveTab('shifts')} className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 ${activeTab === 'shifts' ? 'bg-advisa-accent text-white' : 'bg-white border border-advisa-border text-slate-600 hover:bg-slate-50'}`}>
          Open Shift Board
          {openShiftCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0 rounded-full">{openShiftCount}</span>}
        </button>
      </div>

      {/* Staff Directory Tab */}
      {activeTab === 'staff' && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap">
            <select className="select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
            </select>
            <select className="select" value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}>
              {availabilities.map(a => <option key={a} value={a}>{a === 'All' ? 'All Availability' : a}</option>)}
            </select>
          </div>

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
                  <th className="table-head">Credentials</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => {
                  const expired = hasExpiredCredentials(staff.id);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-semibold text-slate-800">{staff.name}</td>
                      <td className="table-cell"><span className="badge badge-info">{staff.role}</span></td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {staff.specialties.slice(0, 2).map(s => <span key={s} className="badge badge-neutral">{s}</span>)}
                          {staff.specialties.length > 2 && <span className="text-xs text-slate-400">+{staff.specialties.length - 2}</span>}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${staff.availability === 'Available' ? 'badge-success' : staff.availability === 'Partially' ? 'badge-warning' : 'badge-urgent'}`}>{staff.availability}</span>
                      </td>
                      <td className="table-cell font-medium">{staff.todayVisits}</td>
                      <td className="table-cell">
                        <span className={`badge ${staff.overtimeRisk === 'High' ? 'badge-urgent' : staff.overtimeRisk === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{staff.overtimeRisk}</span>
                      </td>
                      <td className="table-cell">
                        {expired ? (
                          <span className="badge badge-urgent">Expired</span>
                        ) : (
                          <span className="badge badge-success">Current</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <button onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)} className="text-advisa-accent hover:text-advisa-accent-dark">
                          {selectedStaff === staff.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedStaff && (() => {
            const staff = state.staff.find(s => s.id === selectedStaff);
            if (!staff) return null;
            const expired = hasExpiredCredentials(staff.id);
            return (
              <div className="card mb-5 bg-sky-50/50 border-sky-200">
                <p className="section-title mb-3">{staff.name} — Detail</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /><div><p className="stat-label">Phone</p><p className="font-medium text-slate-700">{staff.phone}</p></div></div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /><div><p className="stat-label">Location</p><p className="font-medium text-slate-700">{staff.location}</p></div></div>
                  <div><p className="stat-label">License Expiry</p><p className="font-medium text-slate-700">{staff.licenseExpiry}</p></div>
                  <div><p className="stat-label">All Specialties</p><div className="flex flex-wrap gap-1 mt-1">{staff.specialties.map(s => <span key={s} className="badge badge-neutral">{s}</span>)}</div></div>
                </div>
                {expired && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle size={12} />This staff member has expired credentials and cannot be assigned to shifts until renewed.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Best Match for open shifts */}
          {state.shifts.filter(s => s.status === 'Open').length > 0 && (
            <div className="card bg-gradient-to-r from-advisa-primary to-advisa-secondary border-0 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-sky-300" />
                <p className="text-sm font-semibold">Best Staff Matches for Open Shifts</p>
              </div>
              {state.shifts.filter(s => s.status === 'Open').slice(0, 2).map(shift => {
                const ranked = state.staff
                  .filter(s => s.availability !== 'Unavailable')
                  .map(s => ({ ...s, ...getBestMatchScore(s.id, shift.serviceType) }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                return (
                  <div key={shift.id} className="mb-3">
                    <p className="text-xs text-sky-200 mb-2">{shift.patientInitials} — {shift.serviceType} ({shift.date})</p>
                    <div className="space-y-1.5">
                      {ranked.map((s, i) => (
                        <div key={s.id} className="p-3 bg-white/10 rounded-lg border border-white/15 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{i + 1}. {s.name} ({s.role})</p>
                            <p className="text-[10px] text-sky-200 mt-0.5">Score: {s.score}/100 — {s.reasons.join(', ')}</p>
                          </div>
                          <button
                            onClick={() => handleOfferShift(shift.id, s.id)}
                            disabled={hasExpiredCredentials(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              hasExpiredCredentials(s.id) ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/20 hover:bg-white/30 text-white'
                            }`}
                          >
                            {hasExpiredCredentials(s.id) ? 'Blocked' : 'Offer'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Open Shift Board Tab */}
      {activeTab === 'shifts' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowCreateShift(!showCreateShift)} className="btn-primary"><Plus size={15} />Create Shift</button>
          </div>

          {showCreateShift && (
            <div className="card mb-5 bg-sky-50/50 border-sky-200">
              <p className="section-title mb-3">Create New Shift</p>
              <div className="grid grid-cols-3 gap-3">
                <select className="select" value={newShiftReferral} onChange={e => setNewShiftReferral(e.target.value)}>
                  <option value="">Select Referral...</option>
                  {staffingReferrals.map(r => <option key={r.id} value={r.id}>{r.patientInitials} — {r.serviceType}</option>)}
                </select>
                <input type="date" className="input" value={newShiftDate} onChange={e => setNewShiftDate(e.target.value)} />
                <input type="text" className="input" placeholder="Time (e.g. 08:00-16:00)" value={newShiftTime} onChange={e => setNewShiftTime(e.target.value)} />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleCreateShift} className="btn-primary">Create</button>
                <button onClick={() => setShowCreateShift(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {['Open', 'Offered', 'Accepted', 'Declined'].map(status => {
              const shifts = state.shifts.filter(s => s.status === status);
              return (
                <div key={status} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-700">{status}</h4>
                    <span className={`badge ${shiftStatusBadge[status]}`}>{shifts.length}</span>
                  </div>
                  <div className="space-y-2">
                    {shifts.map(shift => (
                      <div key={shift.id} id={`shift-${shift.id}`} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-slate-800">{shift.patientInitials}</span>
                          <span className="text-[10px] text-slate-400">{shift.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{shift.serviceType}</p>
                        {shift.time && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={9} />{shift.time}</p>}
                        <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin size={9} />{shift.location}</p>
                        {shift.offeredToName && <p className="text-[10px] text-sky-600 mt-1">→ {shift.offeredToName}</p>}

                        <div className="flex gap-1 mt-2">
                          {shift.status === 'Open' && (
                            <button
                              onClick={() => { setActiveTab('staff'); }}
                              className="text-[10px] text-advisa-accent hover:underline flex items-center gap-1"
                            >
                              <ArrowRight size={9} />Find Staff
                            </button>
                          )}
                          {shift.status === 'Offered' && (
                            <>
                              <button onClick={() => handleAcceptShift(shift.id)} className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium flex items-center gap-1">
                                <CheckCircle size={9} />Accept
                              </button>
                              <button onClick={() => handleDeclineShift(shift.id)} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium flex items-center gap-1">
                                <XCircle size={9} />Decline
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {shifts.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">None</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

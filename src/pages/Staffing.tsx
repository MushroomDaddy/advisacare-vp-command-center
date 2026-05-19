import { useAppState } from '../context/AppContext';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { findBestMatchStaff, hasWorkRestriction, serviceToStaffRoles } from '../utils/dataLogic';
import type { Referral, StaffMember, ShiftBoardEntry } from '../types';
import {
  Users, UserCheck, Clock, Shield,
  ChevronDown, ChevronUp, Tag,
  ArrowRight, CalendarClock, Check, XCircle, Send
} from 'lucide-react';

function StaffCard({ staff, compliance }: { staff: StaffMember; compliance: ReturnType<typeof useAppState>['state']['compliance'] }) {
  const [expanded, setExpanded] = useState(false);
  const restriction = hasWorkRestriction(staff.id, compliance);
  const loadPct = Math.round((staff.todayVisits / staff.maxVisits) * 100);

  return (
    <div className={`card ${restriction.restricted ? 'border-red-200 bg-red-50/30' : ''}`} data-testid="staff-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${restriction.restricted ? 'bg-red-100 text-red-700' : staff.availability === 'Available' ? 'bg-emerald-100 text-emerald-700' : staff.availability === 'Partially' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            {staff.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{staff.name}</p>
            <p className="text-[10px] text-slate-400">{staff.role} · {staff.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge text-[10px] ${staff.availability === 'Available' ? 'badge-success' : staff.availability === 'Partially' ? 'badge-warning' : 'badge-neutral'}`}>
            {staff.availability}
          </span>
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-slate-100 rounded">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className="text-center p-1.5 bg-slate-50 rounded text-[10px]">
          <p className="font-semibold text-slate-700">{staff.todayVisits}/{staff.maxVisits}</p>
          <p className="text-slate-400">Load</p>
        </div>
        <div className="text-center p-1.5 bg-slate-50 rounded text-[10px]">
          <p className={`font-semibold ${staff.overtimeRisk === 'Low' ? 'text-emerald-600' : staff.overtimeRisk === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>
            {staff.overtimeRisk}
          </p>
          <p className="text-slate-400">OT Risk</p>
        </div>
        <div className="text-center p-1.5 bg-slate-50 rounded text-[10px]">
          <p className={`font-semibold ${staff.shiftStatus === 'Confirmed' ? 'text-emerald-600' : staff.shiftStatus === 'Declined' ? 'text-red-600' : 'text-amber-600'}`}>
            {staff.shiftStatus}
          </p>
          <p className="text-slate-400">Shift</p>
        </div>
        <div className="text-center p-1.5 bg-slate-50 rounded text-[10px]">
          <p className="font-semibold text-slate-700">{staff.certifications.length}</p>
          <p className="text-slate-400">Certs</p>
        </div>
      </div>

      {/* Workload Bar */}
      <div className="mt-2">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${loadPct > 90 ? 'bg-red-500' : loadPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${loadPct}%` }} />
        </div>
        <p className="text-[9px] text-slate-400 mt-0.5">{loadPct}% capacity</p>
      </div>

      {/* Skill Tags */}
      {staff.skillTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {staff.skillTags.map(tag => (
            <span key={tag} className="badge badge-info text-[8px]" data-testid="skill-tag">
              <Tag size={7} /> {tag}
            </span>
          ))}
        </div>
      )}

      {/* Restriction Warning */}
      {restriction.restricted && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <Shield size={12} className="text-red-500" />
          <span><strong>Work restriction:</strong> {restriction.reasons.join(', ')}</span>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-advisa-border space-y-3">
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Specialty</p>
            <div className="flex flex-wrap gap-1">
              {staff.specialty.map(sp => (
                <span key={sp} className="badge badge-neutral text-[9px]">{sp}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Certifications</p>
            <div className="flex flex-wrap gap-1">
              {staff.certifications.map(cert => (
                <span key={cert} className="badge badge-success text-[9px]">{cert}</span>
              ))}
            </div>
          </div>
          {staff.continuityPatients.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Continuity Patients</p>
              <p className="text-xs text-slate-700">{staff.continuityPatients.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchPanel({ referral, staff, compliance }: {
  referral: Referral;
  staff: StaffMember[];
  compliance: ReturnType<typeof useAppState>['state']['compliance'];
}) {
  const { updateReferral, addVisit, addAuditEntry, addToast, state } = useAppState();
  const scores = useMemo(() => findBestMatchStaff(referral, staff, compliance), [referral, staff, compliance]);
  const acceptableRoles = serviceToStaffRoles[referral.serviceType] || [];

  const handleAssign = (staffMember: StaffMember) => {
    const now = new Date().toISOString();
    const nowDate = now.split('T')[0];

    // Update referral
    updateReferral(referral.id, {
      stage: 'Scheduled',
      timeline: [...referral.timeline, { date: nowDate, action: `Staff assigned — ${staffMember.name}`, user: state.currentUser.name, details: `Role: ${staffMember.role}` }],
      stageTimestamps: { ...referral.stageTimestamps, staffAssignedAt: now, socScheduledAt: now },
    });

    // Add visit
    addVisit({
      id: `VIS-${referral.id}-${staffMember.id}`,
      patientInitials: referral.patientInitials,
      address: referral.dischargeFacility + ' (pending address)',
      time: 'TBD',
      serviceType: referral.serviceType,
      visitStatus: 'Scheduled',
      staffName: staffMember.name,
      acuity: referral.urgency === 'Immediate' ? 'High' : 'Medium',
      checklist: [
        { task: 'Verify patient identity', completed: false },
        { task: 'Complete assessment', completed: false },
        { task: 'Document visit', completed: false },
      ],
      evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
      suppliesNeeded: [],
      notes: `SOC visit for ${referral.patientInitials}`,
      evvExceptions: [],
    });

    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Referral', recordId: referral.id,
      details: `Staff assigned — ${staffMember.name} (${staffMember.role})`,
      before: 'Staffing', after: 'Scheduled',
    });

    addToast(`${staffMember.name} assigned to ${referral.patientInitials}`, 'success');
  };

  return (
    <div className="card bg-sky-50/50 border-sky-200" data-testid="match-panel">
      <div className="card-header mb-3 text-sky-800 flex items-center gap-2">
        <UserCheck size={15} /> Staff Match — {referral.patientInitials} ({referral.serviceType})
      </div>
      {acceptableRoles.length > 0 && (
        <p className="text-[10px] text-sky-600 mb-2">
          Acceptable roles: {acceptableRoles.join(', ')}
        </p>
      )}
      <div className="space-y-2">
        {scores.filter(s => s.score > 0).slice(0, 5).map(({ staff: s, score, breakdown }) => (
          <div key={s.id} className={`flex items-center justify-between p-2 bg-white rounded-lg border text-xs ${score > 80 ? 'border-emerald-200' : score > 50 ? 'border-advisa-border' : 'border-red-200'}`}>
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${score > 80 ? 'bg-emerald-100 text-emerald-700' : score > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {Math.round(score)}
              </div>
              <div>
                <p className="font-semibold text-slate-700">{s.name} <span className="text-slate-400">({s.role})</span></p>
                <p className="text-slate-400">{s.location} · {s.todayVisits}/{s.maxVisits} visits</p>
                {/* Show skill tag matches */}
                {s.skillTags.length > 0 && (
                  <div className="flex gap-1 mt-0.5">
                    {s.skillTags.slice(0, 3).map(t => <span key={t} className="badge badge-info text-[7px]">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {breakdown.complianceBlocker < 0 && (
                <span className="badge badge-urgent text-[8px]">BLOCKED</span>
              )}
              {breakdown.complianceBlocker >= 0 && (
                <button onClick={() => handleAssign(s)} className="btn-primary text-[10px] py-1 px-2" data-testid="assign-staff-btn">
                  <ArrowRight size={9} /> Assign
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Open Shift Board ---
const shiftStatusColors: Record<ShiftBoardEntry['status'], string> = {
  Open: 'badge-warning',
  Offered: 'badge-info',
  Accepted: 'badge-success',
  Declined: 'badge-urgent',
};

function ShiftBoard() {
  const { state, updateShiftBoard, addVisit, addAuditEntry, addToast } = useAppState();
  const [filterStatus, setFilterStatus] = useState<ShiftBoardEntry['status'] | 'All'>('All');

  const shifts = filterStatus === 'All' ? state.shiftBoard : state.shiftBoard.filter(s => s.status === filterStatus);

  const handleOfferShift = (shift: ShiftBoardEntry, staffName: string) => {
    updateShiftBoard(shift.id, { status: 'Offered', offeredTo: staffName, offeredAt: new Date().toISOString() });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'ShiftBoard', recordId: shift.id,
      details: `Offered shift to ${staffName}`, before: 'Open', after: 'Offered',
    });
    addToast(`Shift offered to ${staffName}`, 'success');
  };

  const handleAcceptShift = (shift: ShiftBoardEntry) => {
    updateShiftBoard(shift.id, { status: 'Accepted' });
    // Create a visit record
    addVisit({
      id: `VIS-SHIFT-${shift.id}`,
      patientInitials: shift.patientInitials,
      address: 'TBD',
      time: shift.deadline,
      serviceType: shift.serviceType,
      visitStatus: 'Scheduled',
      staffName: shift.offeredTo || state.currentUser.name,
      acuity: shift.acuity,
      checklist: [
        { task: 'Verify patient identity', completed: false },
        { task: 'Complete assessment', completed: false },
        { task: 'Document visit', completed: false },
      ],
      evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
      suppliesNeeded: [],
      notes: `Shift board assignment: ${shift.id}`,
      evvExceptions: [],
    });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'ShiftBoard', recordId: shift.id,
      details: `Shift accepted by ${shift.offeredTo || state.currentUser.name}. Visit created.`,
      before: 'Offered', after: 'Accepted',
    });
    addToast(`Shift accepted — visit created`, 'success');
  };

  const handleDeclineShift = (shift: ShiftBoardEntry) => {
    updateShiftBoard(shift.id, { status: 'Declined' });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'ShiftBoard', recordId: shift.id,
      details: `Shift declined by ${shift.offeredTo || 'unknown'}`, before: shift.status, after: 'Declined',
    });
    addToast('Shift declined', 'warning');
  };

  if (state.shiftBoard.length === 0) return null;

  return (
    <div className="card mb-5" data-testid="shift-board">
      <div className="card-header mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <CalendarClock size={15} className="text-advisa-accent" /> Open Shift Board ({state.shiftBoard.length})
        </div>
        <select className="select text-xs py-1" value={filterStatus} onChange={e => setFilterStatus(e.target.value as ShiftBoardEntry['status'] | 'All')}>
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Offered">Offered</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b">
              <th className="text-left py-2 px-2 font-medium">Patient</th>
              <th className="text-left py-2 px-2 font-medium">Service</th>
              <th className="text-left py-2 px-2 font-medium">Acuity</th>
              <th className="text-left py-2 px-2 font-medium">Needed Role</th>
              <th className="text-left py-2 px-2 font-medium">Deadline</th>
              <th className="text-left py-2 px-2 font-medium">Status</th>
              <th className="text-left py-2 px-2 font-medium">Offered To</th>
              <th className="text-right py-2 px-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(shift => (
              <tr key={shift.id} className="border-b border-advisa-border/50 hover:bg-slate-50" data-testid="shift-row">
                <td className="py-2 px-2 font-semibold">{shift.patientInitials}</td>
                <td className="py-2 px-2">{shift.serviceType}</td>
                <td className="py-2 px-2">
                  <span className={`badge text-[8px] ${shift.acuity === 'High' ? 'badge-urgent' : shift.acuity === 'Medium' ? 'badge-warning' : 'badge-neutral'}`}>
                    {shift.acuity}
                  </span>
                </td>
                <td className="py-2 px-2">{shift.neededRole}</td>
                <td className="py-2 px-2">{shift.deadline}</td>
                <td className="py-2 px-2"><span className={`badge text-[8px] ${shiftStatusColors[shift.status]}`}>{shift.status}</span></td>
                <td className="py-2 px-2">{shift.offeredTo || '—'}</td>
                <td className="py-2 px-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {shift.status === 'Open' && (
                      <button
                        onClick={() => {
                          const available = state.staff.filter(s => s.availability !== 'Unavailable');
                          if (available.length > 0) handleOfferShift(shift, available[0].name);
                          else addToast('No available staff to offer', 'warning');
                        }}
                        className="btn-primary text-[9px] py-0.5 px-1.5"
                        data-testid="offer-shift-btn"
                      >
                        <Send size={8} /> Offer
                      </button>
                    )}
                    {shift.status === 'Offered' && (
                      <>
                        <button onClick={() => handleAcceptShift(shift)} className="btn-primary text-[9px] py-0.5 px-1.5" data-testid="accept-shift-btn">
                          <Check size={8} /> Accept
                        </button>
                        <button onClick={() => handleDeclineShift(shift)} className="btn-secondary text-[9px] py-0.5 px-1.5">
                          <XCircle size={8} /> Decline
                        </button>
                      </>
                    )}
                    {shift.status === 'Accepted' && <span className="text-emerald-600 text-[9px]">✓ Filled</span>}
                    {shift.status === 'Declined' && (
                      <button
                        onClick={() => updateShiftBoard(shift.id, { status: 'Open', offeredTo: undefined, offeredAt: undefined })}
                        className="btn-secondary text-[9px] py-0.5 px-1.5"
                      >
                        Re-open
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Staffing() {
  const { state } = useAppState();
  const [searchParams] = useSearchParams();
  // Deep-link: open specific referral from query param ?ref=
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(() => searchParams.get('ref'));
  const [filterAvailability, setFilterAvailability] = useState('All');

  const staffingReferrals = state.referrals.filter(r => r.stage === 'Staffing');
  const selectedReferral = selectedReferralId ? state.referrals.find(r => r.id === selectedReferralId) : null;

  const filteredStaff = state.staff.filter(s =>
    filterAvailability === 'All' || s.availability === filterAvailability
  );

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Users size={22} className="text-advisa-accent" />
            Staff Management & Matching
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {state.staff.length} staff · {state.staff.filter(s => s.availability === 'Available').length} available · {staffingReferrals.length} awaiting assignment
          </p>
        </div>
      </div>

      {/* Open Shift Board */}
      <ShiftBoard />

      {/* Referrals Awaiting Staffing */}
      {staffingReferrals.length > 0 && (
        <div className="card mb-5 bg-orange-50/50 border-orange-200">
          <div className="card-header mb-3 text-orange-800 flex items-center gap-2">
            <Clock size={15} className="text-orange-500" /> Referrals Awaiting Staffing ({staffingReferrals.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {staffingReferrals.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedReferralId(r.id === selectedReferralId ? null : r.id)}
                className={`px-3 py-2 rounded-lg border text-xs transition-all ${r.id === selectedReferralId ? 'bg-sky-100 border-sky-300 text-sky-800' : 'bg-white border-advisa-border text-slate-700 hover:border-sky-200'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.patientInitials}</span>
                  <span className="badge badge-info text-[8px]">{r.serviceType}</span>
                  <span className={`badge text-[8px] ${r.urgency === 'Immediate' ? 'badge-urgent' : r.urgency.includes('Urgent') ? 'badge-warning' : 'badge-neutral'}`}>
                    {r.urgency.split(' ')[0]}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Roles: {(serviceToStaffRoles[r.serviceType] || ['Any']).join('/')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Match Panel */}
      {selectedReferral && (
        <div className="mb-5">
          <MatchPanel referral={selectedReferral} staff={state.staff} compliance={state.compliance} />
        </div>
      )}

      {/* Staff Filter */}
      <div className="flex gap-3 mb-5">
        <select className="select" value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)}>
          <option value="All">All Availability</option>
          <option value="Available">Available</option>
          <option value="Partially">Partially</option>
          <option value="Unavailable">Unavailable</option>
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStaff.map(s => (
          <StaffCard key={s.id} staff={s} compliance={state.compliance} />
        ))}
      </div>
      {filteredStaff.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No staff match your filter</p>}
    </div>
  );
}

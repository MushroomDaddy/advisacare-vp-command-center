import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import type { CatastrophicCase, ReferralStage } from '../types';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hasBlockingCredential } from '../lib/complianceUtils';
import {
  HeartPulse, AlertTriangle, Phone, Users, Wrench,
  Plus, FileText, Clock, Shield, ChevronRight,
} from 'lucide-react';

export default function CatastrophicCare() {
  const {
    state, updateCatastrophicCase, createShift, addAuditEntry, createAlert,
    offerShift, acceptShift, resolveAlert, updateReferral,
  } = useAppState();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const deepLinkCase = searchParams.get('case');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    deepLinkCase || (state.catastrophicCases.length > 0 ? state.catastrophicCases[0].id : null)
  );

  // Deep link: ?case=cc1 scrolls to that case
  useEffect(() => {
    if (deepLinkCase) {
      setTimeout(() => {
        const el = document.getElementById(`case-${deepLinkCase}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [deepLinkCase]);
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [newShiftDate, setNewShiftDate] = useState('');
  const [newShiftTime, setNewShiftTime] = useState('08:00-16:00');
  const [noteText, setNoteText] = useState('');
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

  const selectedCase = useMemo(
    () => state.catastrophicCases.find(c => c.id === selectedCaseId),
    [state.catastrophicCases, selectedCaseId]
  );

  const caseShifts = useMemo(
    () => selectedCase ? state.shifts.filter(s => selectedCase.shifts.includes(s.id) || s.referralId === selectedCase.referralId) : [],
    [selectedCase, state.shifts]
  );

  const referral = useMemo(
    () => selectedCase ? state.referrals.find(r => r.id === selectedCase.referralId) : null,
    [selectedCase, state.referrals]
  );

  const uncoveredShifts = caseShifts.filter(s => s.status === 'Open');

  const handleCreateShift = () => {
    if (!selectedCase || !newShiftDate) {
      showToast('Date is required', 'error');
      return;
    }
    const newId = createShift({
      referralId: selectedCase.referralId,
      patientInitials: selectedCase.patientInitials,
      serviceType: 'Catastrophic Injury Care',
      status: 'Open',
      date: newShiftDate,
      time: newShiftTime,
      location: referral?.dischargeFacility || 'TBD',
      notes: `Catastrophic care shift for ${selectedCase.patientInitials}`,
    });
    updateCatastrophicCase(selectedCase.id, {
      shifts: [...selectedCase.shifts, newId],
    });
    createAlert({
      type: 'Catastrophic Uncovered Shift',
      severity: 'Critical',
      message: `CATASTROPHIC: Uncovered shift for ${selectedCase.patientInitials} on ${newShiftDate}`,
      sourceRecordType: 'Shift',
      sourceRecordId: newId,
    });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'Shift', recordId: newId,
      details: `Catastrophic shift created for ${selectedCase.patientInitials} on ${newShiftDate}`,
    });
    showToast('Shift created', 'success');
    setShowCreateShift(false);
    setNewShiftDate('');
  };

  const handleAssignStaff = (shiftId: string, staffId: string) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (!staff) return;

    // Fully block expired credentials — no override
    if (hasBlockingCredential(staffId, state.compliance)) {
      showToast('Staff has expired credentials and cannot be assigned. Renew credentials first.', 'error');
      return;
    }

    const shift = state.shifts.find(s => s.id === shiftId);
    if (!shift || !selectedCase) return;

    const beforeStatus = shift.status;

    // 1. Offer + Accept the shift in one step (catastrophic urgency)
    offerShift(shiftId, staffId, staff.name);
    acceptShift(shiftId);

    // 2. Update referral assignedStaffId and stage
    if (selectedCase.referralId) {
      updateReferral(selectedCase.referralId, { assignedStaffId: staffId, stage: 'Scheduled' as ReferralStage });
    }

    // 3. Update catastrophic case coverage status
    const remainingUncovered = caseShifts.filter(s => s.id !== shiftId && s.status === 'Open');
    const newCoverage = remainingUncovered.length === 0 ? 'Fully Covered' : 'Partially Covered';
    updateCatastrophicCase(selectedCase.id, {
      coverageStatus: newCoverage as CatastrophicCase['coverageStatus'],
      incidents: [
        ...selectedCase.incidents,
        {
          timestamp: new Date().toISOString(),
          action: `Staff assigned: ${staff.name}`,
          user: state.currentUser.name,
          details: `${staff.name} (${staff.role}) assigned to shift ${shift.date} ${shift.time}`,
        },
      ],
    });

    // 4. Resolve uncovered shift alerts for this shift
    state.alerts
      .filter(a => !a.resolved && a.sourceRecordType === 'Shift' && a.sourceRecordId === shiftId)
      .forEach(a => resolveAlert(a.id));

    // 5. Audit entry with before/after
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Shift', recordId: shiftId,
      details: `Catastrophic assignment: ${staff.name} to ${selectedCase.patientInitials} shift ${shift.date}`,
      before: `status: ${beforeStatus}, offeredTo: none`,
      after: `status: Accepted, offeredTo: ${staff.name}, coverage: ${newCoverage}`,
    });

    showToast(`${staff.name} assigned — shift accepted, coverage: ${newCoverage}`, 'success');
    setShowAssignModal(null);
  };

  const handleAddNote = () => {
    if (!selectedCase || !noteText.trim()) return;
    const now = new Date().toISOString();
    updateCatastrophicCase(selectedCase.id, {
      notes: selectedCase.notes ? `${selectedCase.notes}\n---\n${now.split('T')[0]}: ${noteText}` : noteText,
      incidents: [
        ...selectedCase.incidents,
        { timestamp: now, action: 'Note added', user: state.currentUser.name, details: noteText },
      ],
    });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Staff', recordId: selectedCase.id,
      details: `Note added to case ${selectedCase.patientInitials}`,
    });
    setNoteText('');
    showToast('Note added', 'success');
  };

  const coverageBadge = (status: CatastrophicCase['coverageStatus']) => {
    if (status === 'Fully Covered') return 'badge-success';
    if (status === 'Partially Covered') return 'badge-warning';
    return 'badge-urgent';
  };

  const suppliesBadge = (status: CatastrophicCase['suppliesStatus']) => {
    if (status === 'Adequate') return 'badge-success';
    if (status === 'Low') return 'badge-warning';
    return 'badge-urgent';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <HeartPulse size={22} className="text-red-500" />
            Catastrophic Care
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {state.catastrophicCases.length} case{state.catastrophicCases.length !== 1 ? 's' : ''} · {uncoveredShifts.length} uncovered shifts
          </p>
        </div>
      </div>

      {state.catastrophicCases.length === 0 ? (
        <div className="card text-center py-16">
          <HeartPulse size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No catastrophic care cases</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cases List */}
          <div className="space-y-3">
            {state.catastrophicCases.map(cc => {
              // Map coverage/supplies status to single-signal pill tones
              const covTone = cc.coverageStatus === 'Fully Covered' ? 'pill-success'
                            : cc.coverageStatus === 'Partially Covered' ? 'pill-warning'
                            : 'pill-critical';
              const supTone = cc.suppliesStatus === 'Adequate' ? 'pill-success'
                            : cc.suppliesStatus === 'Low' ? 'pill-warning'
                            : 'pill-critical';
              return (
                <div
                  key={cc.id}
                  id={`case-${cc.id}`}
                  className={`card cursor-pointer transition-all ${selectedCaseId === cc.id ? 'ring-2 ring-red-400' : 'hover:shadow-card-hover'}`}
                  onClick={() => setSelectedCaseId(cc.id)}
                >
                  {/* Header — patient + acuity pill wraps cleanly on mobile */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold text-sm text-clinical-text">{cc.patientInitials}</h3>
                    <span className={`pill ${cc.acuityLevel === 'Critical' ? 'pill-critical' : 'pill-warning'} text-[10px]`}>
                      <span className="pill-dot" />
                      {cc.acuityLevel}
                    </span>
                  </div>
                  <p className="text-xs text-clinical-muted mb-3">{cc.caseManagerName}</p>

                  {/* Coverage + Supplies — single-signal pills on their own row,
                      flex-wrap so they stack on narrow screens instead of overlapping */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`pill ${covTone} text-[10px]`}>
                      <span className="pill-dot" />
                      {cc.coverageStatus}
                    </span>
                    <span className={`pill ${supTone} text-[10px]`}>
                      <span className="pill-dot" />
                      Supplies · {cc.suppliesStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Case Detail */}
          <div className="lg:col-span-2 space-y-5">
            {selectedCase ? (
              <>
                {/* Header */}
                <div className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{selectedCase.patientInitials}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${selectedCase.acuityLevel === 'Critical' ? 'badge-urgent' : 'badge-warning'}`}>{selectedCase.acuityLevel} Acuity</span>
                        <span className={`badge ${coverageBadge(selectedCase.coverageStatus)}`}>{selectedCase.coverageStatus}</span>
                      </div>
                    </div>
                    {uncoveredShifts.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                        <AlertTriangle size={12} />
                        {uncoveredShifts.length} uncovered shift{uncoveredShifts.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="stat-label">Case Manager</p>
                      <p className="text-sm font-medium text-slate-800">{selectedCase.caseManagerName}</p>
                    </div>
                    <div>
                      <p className="stat-label">Family Contact</p>
                      <p className="text-sm font-medium text-slate-800 flex items-center gap-1"><Phone size={11} />{selectedCase.familyContact}</p>
                    </div>
                    <div>
                      <p className="stat-label">Supplies</p>
                      <span className={`badge ${suppliesBadge(selectedCase.suppliesStatus)}`}>{selectedCase.suppliesStatus}</span>
                    </div>
                    <div>
                      <p className="stat-label">Coverage</p>
                      <span className={`badge ${coverageBadge(selectedCase.coverageStatus)}`}>{selectedCase.coverageStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div className="card">
                  <div className="card-header"><Wrench size={16} className="text-advisa-accent" />Equipment Needed</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.equipmentNeeded.map((eq, i) => (
                      <span key={i} className="badge badge-neutral">{eq}</span>
                    ))}
                  </div>
                </div>

                {/* Shifts */}
                <div className="card">
                  <div className="card-header justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-advisa-accent" />
                      <span>Shifts ({caseShifts.length})</span>
                    </div>
                    <button onClick={() => setShowCreateShift(true)} className="btn-primary text-xs py-1"><Plus size={12} />Create Shift</button>
                  </div>

                  {showCreateShift && (
                    <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="stat-label block mb-1">Date</label>
                          <input type="date" className="input" value={newShiftDate} onChange={e => setNewShiftDate(e.target.value)} />
                        </div>
                        <div>
                          <label className="stat-label block mb-1">Time</label>
                          <input className="input" value={newShiftTime} onChange={e => setNewShiftTime(e.target.value)} placeholder="08:00-16:00" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleCreateShift} className="btn-primary text-xs py-1">Create</button>
                        <button onClick={() => setShowCreateShift(false)} className="btn-secondary text-xs py-1">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {caseShifts.map(shift => (
                      <div key={shift.id} className={`p-3 rounded-lg border ${shift.status === 'Open' ? 'bg-red-50 border-red-200' : shift.status === 'Accepted' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{shift.date} · {shift.time}</p>
                            <p className="text-[11px] text-slate-500">{shift.location}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${shift.status === 'Open' ? 'badge-urgent' : shift.status === 'Accepted' ? 'badge-success' : 'badge-warning'}`}>{shift.status}</span>
                            {shift.status === 'Accepted' && shift.offeredToName && (
                              <span className="text-xs text-emerald-700">{shift.offeredToName}</span>
                            )}
                            {shift.status === 'Open' && (
                              <button onClick={() => setShowAssignModal(shift.id)} className="btn-secondary text-xs py-1">Assign</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {caseShifts.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No shifts created yet</p>
                    )}
                  </div>
                </div>

                {/* Incidents / Timeline */}
                <div className="card">
                  <div className="card-header"><Clock size={16} className="text-advisa-accent" />Incidents & Notes</div>
                  <div className="space-y-3 mb-4">
                    {selectedCase.incidents.slice().reverse().map((inc, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-slate-700 font-medium">{inc.action}</p>
                          <p className="text-slate-400 text-[10px]">{inc.user} · {new Date(inc.timestamp).toLocaleString()}</p>
                          {inc.details && <p className="text-slate-500 text-[10px]">{inc.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Add note..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                    <button onClick={handleAddNote} className="btn-primary text-xs"><FileText size={12} />Add</button>
                  </div>

                  {selectedCase.notes && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="stat-label mb-1">Notes</p>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{selectedCase.notes}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card text-center py-16">
                <Shield size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-400">Select a case to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowAssignModal(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Assign Staff to Shift</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
              {state.staff.filter(s => s.availability !== 'Unavailable').map(s => {
                const blocked = hasBlockingCredential(s.id, state.compliance);
                return (
                  <div key={s.id} className={`p-3 rounded-lg border ${blocked ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{s.name} ({s.role})</p>
                      <p className="text-[10px] text-slate-500">{s.specialties.join(', ')}</p>
                      {blocked && <p className="text-[10px] text-red-600 font-semibold">⚠ Expired credential</p>}
                    </div>
                    <button
                      onClick={() => handleAssignStaff(showAssignModal, s.id)}
                      disabled={blocked}
                      className={`text-xs py-1 ${blocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed px-3 rounded-lg' : 'btn-primary'}`}
                    >
                      <ChevronRight size={12} />{blocked ? 'Blocked' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowAssignModal(null)} className="btn-secondary w-full">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

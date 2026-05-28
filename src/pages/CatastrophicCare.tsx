import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import type { CatastrophicCase, ReferralStage, Shift } from '../types';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hasBlockingCredential } from '../lib/complianceUtils';
import {
  HeartPulse, AlertTriangle, Phone, Users, Wrench,
  Plus, FileText, Clock, Shield, ChevronRight, Sun, Sunset, Moon, CalendarDays,
} from 'lucide-react';

// ─── 24-Hour Coverage Board helpers ─────────────────────────────────────
//
// Classify each catastrophic-care shift into one of four coverage slots
// based on its time string ('HH:MM-HH:MM') and date. Weekend shifts
// (Sat/Sun) bucket separately from weekday Day/Evening/Overnight so the
// board reads "what's covered THIS WEEK" at a glance.

type CoverageSlot = 'day' | 'evening' | 'overnight' | 'weekend';

function slotForShift(shift: Shift): CoverageSlot {
  // Weekend wins — any Sat/Sun shift goes into the weekend bucket
  const date = new Date(shift.date);
  const dow = date.getDay(); // 0 = Sun, 6 = Sat
  if (dow === 0 || dow === 6) return 'weekend';

  // Parse start hour from "HH:MM-HH:MM" time string. If missing, assume Day.
  const startHourStr = shift.time?.split(':')[0];
  const startHour = startHourStr ? parseInt(startHourStr, 10) : 8;
  if (Number.isNaN(startHour)) return 'day';
  if (startHour >= 6 && startHour < 14) return 'day';
  if (startHour >= 14 && startHour < 22) return 'evening';
  return 'overnight';
}

interface SlotCount {
  total: number;
  open: number;
  accepted: number;
}

const EMPTY_SLOT: SlotCount = { total: 0, open: 0, accepted: 0 };

function countByStatus(shifts: Shift[]): SlotCount {
  const open = shifts.filter(s => s.status === 'Open').length;
  const accepted = shifts.filter(s => s.status === 'Accepted').length;
  return { total: shifts.length, open, accepted };
}

const SLOT_LABEL: Record<CoverageSlot, string> = {
  day: 'Day · 06–14',
  evening: 'Evening · 14–22',
  overnight: 'Overnight · 22–06',
  weekend: 'Weekend · Sat–Sun',
};

const SLOT_ICON: Record<CoverageSlot, typeof Sun> = {
  day: Sun,
  evening: Sunset,
  overnight: Moon,
  weekend: CalendarDays,
};

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
        <>
          {/* ─── 24-Hour Coverage Board ─────────────────────────────── */}
          <CoverageBoard
            cases={state.catastrophicCases}
            allShifts={state.shifts}
            onSelectCase={setSelectedCaseId}
            selectedCaseId={selectedCaseId}
          />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          {/* Cases List */}
          <div className="space-y-3">
            {state.catastrophicCases.map(cc => {
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
                  {/* Header — patient + acuity pill, flex-wrap so they stack cleanly on mobile */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold text-sm text-clinical-text">{cc.patientInitials}</h3>
                    <span className={`pill ${cc.acuityLevel === 'Critical' ? 'pill-critical' : 'pill-warning'} text-[10px]`}>
                      <span className="pill-dot" />
                      {cc.acuityLevel}
                    </span>
                  </div>
                  <p className="text-xs text-clinical-muted mb-3">{cc.caseManagerName}</p>

                  {/* Coverage + Supplies — single-signal pills, own row, wrap if needed */}
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
        </>
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

// ─── CoverageBoard — 24-hour staffing coverage at a glance ─────────────
//
// One row per active catastrophic case. Four cells: Day · Evening ·
// Overnight · Weekend. Each cell shows: total shifts in that bucket and
// how many are open (uncovered) vs accepted (covered). Tone rail on the
// row mirrors the case's overall coverage status.
function CoverageBoard({
  cases,
  allShifts,
  selectedCaseId,
  onSelectCase,
}: {
  cases: CatastrophicCase[];
  allShifts: Shift[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
}) {
  // Aggregate per-case slot counts up front
  const rows = useMemo(() => cases.map(cc => {
    const caseShifts = allShifts.filter(s => cc.shifts.includes(s.id));
    const byslot: Record<CoverageSlot, Shift[]> = {
      day: [], evening: [], overnight: [], weekend: [],
    };
    for (const s of caseShifts) byslot[slotForShift(s)].push(s);
    return {
      case: cc,
      slots: {
        day: countByStatus(byslot.day),
        evening: countByStatus(byslot.evening),
        overnight: countByStatus(byslot.overnight),
        weekend: countByStatus(byslot.weekend),
      } as Record<CoverageSlot, SlotCount>,
      totalOpen: caseShifts.filter(s => s.status === 'Open').length,
    };
  }), [cases, allShifts]);

  return (
    <div className="card overflow-x-auto" aria-label="24-hour catastrophic coverage board">
      <div className="card-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Clock size={16} />
          24-Hour Coverage Board
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-clinical-muted">
          Day · Evening · Overnight · Weekend
        </span>
      </div>
      <div className="min-w-[640px]">
        {/* Column headers */}
        <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] gap-2 pb-2 mb-2 border-b border-advisa-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-clinical-muted">Case</span>
          {(['day','evening','overnight','weekend'] as CoverageSlot[]).map(slot => {
            const Icon = SLOT_ICON[slot];
            return (
              <span key={slot} className="text-[10px] font-mono uppercase tracking-wider text-clinical-muted flex items-center gap-1">
                <Icon size={11} aria-hidden />
                {SLOT_LABEL[slot]}
              </span>
            );
          })}
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map(({ case: cc, slots, totalOpen }) => {
            const rowTone =
              cc.coverageStatus === 'Fully Covered' ? 'border-l-[#9BB83F]'
              : cc.coverageStatus === 'Partially Covered' ? 'border-l-[#D97706]'
              : 'border-l-[#DC2626]';
            return (
              <button
                key={cc.id}
                onClick={() => onSelectCase(cc.id)}
                className={`w-full grid grid-cols-[1.4fr_repeat(4,1fr)] gap-2 items-center text-left p-2 rounded-md border border-advisa-border-light hover:bg-advisa-lime-soft/40 transition-colors border-l-[3px] ${rowTone} ${selectedCaseId === cc.id ? 'ring-2 ring-advisa-primary/40' : ''}`}
                aria-label={`Coverage board row for ${cc.patientInitials}, ${totalOpen} uncovered shift${totalOpen === 1 ? '' : 's'}`}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-advisa-secondary truncate">{cc.patientInitials}</p>
                  <p className="text-[10.5px] text-clinical-muted truncate">{cc.acuityLevel} · {cc.caseManagerName}</p>
                </div>
                {(['day','evening','overnight','weekend'] as CoverageSlot[]).map(slot => (
                  <SlotCell key={slot} count={slots[slot] ?? EMPTY_SLOT} />
                ))}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Single coverage cell — shows total / open / accepted as a tiny tile. */
function SlotCell({ count }: { count: SlotCount }) {
  if (count.total === 0) {
    return (
      <span className="inline-flex items-center justify-center text-[10px] font-mono text-clinical-faint h-9 px-2 rounded-md bg-advisa-surface border border-dashed border-advisa-border">
        —
      </span>
    );
  }
  // Tone driven by whether anything is uncovered
  const tone =
    count.open > 0 && count.accepted === 0 ? 'pill-critical'
    : count.open > 0 ? 'pill-warning'
    : 'pill-success';
  return (
    <span className={`inline-flex items-center justify-center gap-1.5 h-9 px-2 rounded-md text-[10.5px] font-semibold tabular-nums ${
      tone === 'pill-critical' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
      : tone === 'pill-warning' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
      : 'bg-advisa-lime-soft text-[#4F6A1A] ring-1 ring-inset ring-[rgba(155,184,63,.45)]'
    }`}>
      <span className="font-mono">{count.accepted}/{count.total}</span>
      {count.open > 0 && <span className="text-[9px] uppercase tracking-wider">{count.open} open</span>}
    </span>
  );
}

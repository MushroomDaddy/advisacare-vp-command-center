import { useAppState } from '../context/AppContext';
import { useState, useMemo } from 'react';
import { findBestMatchStaff, hasWorkRestriction, type StaffScore } from '../utils/dataLogic';
import type { Referral, ShiftBoardEntry } from '../types';
import {
  Users, Star, AlertTriangle, X, ChevronDown, ChevronUp,
  Clock, UserCheck, BarChart3, Briefcase
} from 'lucide-react';

function ScoreBreakdown({ breakdown }: { breakdown: StaffScore['breakdown'] }) {
  const factors = [
    { label: 'Availability', value: breakdown.availability, max: 20 },
    { label: 'Credentials', value: breakdown.credentials, max: 20 },
    { label: 'Specialty', value: breakdown.specialty, max: 15 },
    { label: 'Location', value: breakdown.location, max: 15 },
    { label: 'Workload', value: breakdown.workload, max: 15 },
    { label: 'Overtime Risk', value: breakdown.overtimeRisk, max: 10 },
    { label: 'Continuity', value: breakdown.continuityOfCare, max: 10 },
    { label: 'Compliance', value: breakdown.complianceBlocker, max: 0 },
  ];
  return (
    <div className="space-y-1.5 mt-2">
      {factors.map(f => (
        <div key={f.label} className="flex items-center gap-2 text-[10px]">
          <span className="w-20 text-slate-500 truncate">{f.label}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${f.value < 0 ? 'bg-red-400' : f.value > 0 ? 'bg-advisa-accent' : 'bg-slate-200'}`}
              style={{ width: `${f.max > 0 ? Math.max(0, (f.value / f.max) * 100) : 100}%` }}
            />
          </div>
          <span className={`w-6 text-right font-semibold ${f.value < 0 ? 'text-red-500' : 'text-slate-600'}`}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function StaffMatchCard({ score, referral, onAssign }: { score: StaffScore; referral: Referral; onAssign: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const availColor = score.staff.availability === 'Available' ? 'text-emerald-600' : score.staff.availability === 'Partially' ? 'text-amber-600' : 'text-red-500';
  const scoreColor = score.score >= 70 ? 'bg-emerald-100 text-emerald-800' : score.score >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';

  return (
    <div className={`border rounded-lg p-3 ${score.breakdown.complianceBlocker < 0 ? 'border-red-200 bg-red-50/50' : 'border-advisa-border bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${scoreColor}`}>
            {score.score}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{score.staff.name}</p>
            <p className="text-[10px] text-slate-400">{score.staff.role} · {score.staff.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${availColor}`}>{score.staff.availability}</span>
          {score.breakdown.complianceBlocker < 0 ? (
            <span className="badge badge-urgent text-[9px]">BLOCKED</span>
          ) : (
            <button onClick={onAssign} className="btn-primary text-[10px] py-1 px-2">
              <UserCheck size={10} /> Assign
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-slate-100 rounded">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      <div className="flex gap-2 mt-2 text-[10px]">
        <span className="text-slate-500">{score.staff.todayVisits}/{score.staff.maxVisits} visits</span>
        <span className="text-slate-300">·</span>
        <span className={`${score.staff.overtimeRisk === 'High' ? 'text-red-500' : score.staff.overtimeRisk === 'Medium' ? 'text-amber-500' : 'text-slate-500'}`}>
          OT Risk: {score.staff.overtimeRisk}
        </span>
        <span className="text-slate-300">·</span>
        <span className="text-slate-500">{score.staff.certifications.join(', ')}</span>
      </div>
      {score.staff.continuityPatients.includes(referral.patientInitials) && (
        <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><Star size={9} /> Continuity of care — previously served this patient</p>
      )}
      {expanded && <ScoreBreakdown breakdown={score.breakdown} />}
    </div>
  );
}

function ShiftBoardTable({ entries }: { entries: ShiftBoardEntry[] }) {
  const { updateShiftBoard, addToast } = useAppState();
  if (entries.length === 0) return <p className="text-xs text-slate-400 text-center py-4">No open shifts</p>;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr>
          <th className="table-head">Patient</th>
          <th className="table-head">Service</th>
          <th className="table-head">Acuity</th>
          <th className="table-head">Role Needed</th>
          <th className="table-head">Deadline</th>
          <th className="table-head">Status</th>
          <th className="table-head">Actions</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(e => (
          <tr key={e.id} className="hover:bg-slate-50">
            <td className="table-cell font-medium">{e.patientInitials}</td>
            <td className="table-cell">{e.serviceType}</td>
            <td className="table-cell"><span className={`badge text-[9px] ${e.acuity === 'High' ? 'badge-urgent' : 'badge-warning'}`}>{e.acuity}</span></td>
            <td className="table-cell">{e.neededRole}</td>
            <td className="table-cell text-slate-500">{e.deadline}</td>
            <td className="table-cell">
              <span className={`badge text-[9px] ${e.status === 'Open' ? 'badge-warning' : e.status === 'Offered' ? 'badge-info' : e.status === 'Accepted' ? 'badge-success' : 'badge-urgent'}`}>
                {e.status}
              </span>
            </td>
            <td className="table-cell">
              {e.status === 'Open' && (
                <button onClick={() => { updateShiftBoard(e.id, { status: 'Offered' }); addToast(`Shift offered for ${e.patientInitials}`, 'info'); }} className="text-advisa-accent text-[10px] hover:underline">
                  Offer Shift
                </button>
              )}
              {e.status === 'Offered' && (
                <div className="flex gap-1">
                  <button onClick={() => { updateShiftBoard(e.id, { status: 'Accepted' }); addToast(`Shift accepted for ${e.patientInitials}`, 'success'); }} className="text-emerald-600 text-[10px] hover:underline">Accept</button>
                  <button onClick={() => { updateShiftBoard(e.id, { status: 'Declined' }); addToast(`Shift declined for ${e.patientInitials}`, 'warning'); }} className="text-red-500 text-[10px] hover:underline">Decline</button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Staffing() {
  const { state, updateReferral, updateStaff, addVisit, addAuditEntry, addToast } = useAppState();
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showShiftBoard, setShowShiftBoard] = useState(false);

  const unstaffedReferrals = state.referrals.filter(r => r.stage === 'Staffing');

  const scores = useMemo(() => {
    if (!selectedReferral) return [];
    return findBestMatchStaff(selectedReferral, state.staff, state.compliance);
  }, [selectedReferral, state.staff, state.compliance]);

  const handleAssign = (staffScore: StaffScore) => {
    if (!selectedReferral) return;
    const ref = selectedReferral;
    const staff = staffScore.staff;
    const now = new Date().toISOString().split('T')[0];

    // Update referral → Scheduled, set owner
    updateReferral(ref.id, {
      stage: 'Scheduled',
      assignedOwner: staff.name,
      timeline: [...ref.timeline, {
        date: now,
        action: `Staff assigned — ${staff.name}`,
        user: state.currentUser.name,
        details: `Match score: ${staffScore.score}/105`,
      }],
      readiness: 'Ready for SOC',
      recommendedNextAction: 'Confirm SOC visit with patient and clinician',
    });

    // Update staff visits
    updateStaff(staff.id, { todayVisits: staff.todayVisits + 1 });

    // Create visit record
    addVisit({
      id: crypto.randomUUID(),
      patientInitials: ref.patientInitials,
      address: 'TBD — Pending patient confirmation',
      time: 'TBD',
      serviceType: ref.serviceType,
      visitStatus: 'Scheduled',
      staffName: staff.name,
      acuity: ref.urgency === 'Immediate' ? 'High' : 'Medium',
      checklist: [
        { task: 'Verify patient identity', completed: false },
        { task: 'Complete assessment', completed: false },
        { task: 'Document visit', completed: false },
      ],
      evv: { clockIn: null, clockOut: null, gpsLatitude: null, gpsLongitude: null, gpsAddress: '', syncStatus: 'Pending', patientSignature: false, caregiverSignature: false },
      suppliesNeeded: [],
      notes: '',
      evvExceptions: [],
    });

    // Audit
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Referral',
      recordId: ref.id,
      details: `Assigned ${staff.name} to ${ref.patientInitials} (score: ${staffScore.score})`,
      before: 'Staffing',
      after: 'Scheduled',
    });

    addToast(`${staff.name} assigned to ${ref.patientInitials}`, 'success');
    setSelectedReferral(null);
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Users size={22} className="text-advisa-accent" />
            Staffing & Assignment
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {unstaffedReferrals.length} awaiting assignment · {state.staff.filter(s => s.availability === 'Available').length} available staff · {state.shiftBoard.filter(s => s.status === 'Open').length} open shifts
          </p>
        </div>
        <button onClick={() => setShowShiftBoard(!showShiftBoard)} className="btn-secondary text-xs">
          <Briefcase size={13} /> {showShiftBoard ? 'Hide' : 'Show'} Shift Board
        </button>
      </div>

      {/* Shift Board */}
      {showShiftBoard && (
        <div className="card mb-5">
          <div className="card-header mb-3"><Briefcase size={15} /> Open Shift Board</div>
          <ShiftBoardTable entries={state.shiftBoard} />
        </div>
      )}

      {/* Staff Overview */}
      <div className="card mb-5">
        <div className="card-header mb-3"><BarChart3 size={15} /> Staff Overview</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {state.staff.map(s => {
            const restriction = hasWorkRestriction(s.id, state.compliance);
            const loadPct = Math.round((s.todayVisits / s.maxVisits) * 100);
            return (
              <div key={s.id} className={`p-3 rounded-lg border ${restriction.restricted ? 'border-red-200 bg-red-50' : 'border-advisa-border bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.role} · {s.location}</p>
                  </div>
                  <span className={`badge text-[9px] ${s.availability === 'Available' ? 'badge-success' : s.availability === 'Partially' ? 'badge-warning' : 'badge-urgent'}`}>
                    {s.availability}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${loadPct >= 90 ? 'bg-red-400' : loadPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${loadPct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500">{s.todayVisits}/{s.maxVisits}</span>
                </div>
                {restriction.restricted && (
                  <p className="text-[10px] text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle size={9} /> {restriction.reasons.join(', ')}
                  </p>
                )}
                {s.continuityPatients.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">Continuity: {s.continuityPatients.join(', ')}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unstaffed Referrals */}
      <div className="card mb-5">
        <div className="card-header mb-3"><Clock size={15} /> Awaiting Assignment</div>
        {unstaffedReferrals.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">All referrals are staffed</p>
        ) : (
          <div className="space-y-2">
            {unstaffedReferrals.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-advisa-border hover:shadow-sm transition-shadow">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.patientInitials}</p>
                  <p className="text-[10px] text-slate-500">{r.serviceType} · {r.source} · {r.branch}</p>
                  <span className={`badge text-[9px] ${r.urgency === 'Immediate' ? 'badge-urgent' : r.urgency.includes('Urgent') ? 'badge-warning' : 'badge-neutral'}`}>
                    {r.urgency}
                  </span>
                </div>
                <button onClick={() => setSelectedReferral(r)} className="btn-primary text-xs">
                  <UserCheck size={12} /> Find Match
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Drawer */}
      {selectedReferral && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30" onClick={() => setSelectedReferral(null)} />
          <div className="w-[460px] bg-white shadow-2xl overflow-y-auto border-l border-advisa-border">
            <div className="sticky top-0 bg-white border-b border-advisa-border px-5 py-4 flex items-center justify-between z-10">
              <div>
                <p className="text-lg font-bold text-slate-800">Match Staff</p>
                <p className="text-xs text-slate-400">{selectedReferral.patientInitials} · {selectedReferral.serviceType} · {selectedReferral.urgency}</p>
              </div>
              <button onClick={() => setSelectedReferral(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500 mb-3">8-factor scoring: Availability, Credentials, Specialty, Location, Workload, Overtime Risk, Continuity of Care, Compliance</p>
              {scores.map(score => (
                <StaffMatchCard key={score.staff.id} score={score} referral={selectedReferral} onAssign={() => handleAssign(score)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

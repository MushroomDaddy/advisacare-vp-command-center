import { useAppState } from '../context/AppContext';
import { findBestMatchStaff, hasWorkRestriction, type StaffScore } from '../utils/dataLogic';
import { useState } from 'react';
import type { StaffMember } from '../types';
import {
  Users, AlertTriangle, CheckCircle, Clock, UserCheck,
  BarChart3, Zap, MapPin, Shield, TrendingUp, Send, ToggleLeft, ToggleRight
} from 'lucide-react';

function ScoreBreakdown({ score }: { score: StaffScore }) {
  const items = [
    { label: 'Availability', value: score.breakdown.availability, max: 20, icon: <Clock size={11} /> },
    { label: 'Credentials', value: score.breakdown.credentials, max: 20, icon: <Shield size={11} /> },
    { label: 'Specialty', value: score.breakdown.specialty, max: 15, icon: <Zap size={11} /> },
    { label: 'Location', value: score.breakdown.location, max: 15, icon: <MapPin size={11} /> },
    { label: 'Workload', value: score.breakdown.workload, max: 15, icon: <BarChart3 size={11} /> },
    { label: 'Overtime', value: score.breakdown.overtimeRisk, max: 10, icon: <TrendingUp size={11} /> },
  ];

  return (
    <div className="space-y-1.5">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 w-3">{item.icon}</span>
          <span className="text-slate-600 w-20">{item.label}</span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-advisa-accent rounded-full transition-all"
              style={{ width: `${Math.max(0, (item.value / item.max) * 100)}%` }}
            />
          </div>
          <span className="text-slate-500 w-8 text-right font-mono">{item.value}/{item.max}</span>
        </div>
      ))}
      {score.breakdown.complianceBlocker < 0 && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertTriangle size={11} />
          <span>Compliance blocker: {score.breakdown.complianceBlocker} pts</span>
        </div>
      )}
      <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-700">Total Score</span>
        <span className={`text-sm font-bold ${score.score >= 60 ? 'text-emerald-600' : score.score >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
          {score.score}/95
        </span>
      </div>
    </div>
  );
}

export default function Staffing() {
  const { state, updateStaff, updateReferralStage, addAuditEntry } = useAppState();
  const [selectedReferral, setSelectedReferral] = useState<string>('');
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [showOpenShifts, setShowOpenShifts] = useState(false);

  const referralOptions = state.referrals.filter(r => r.stage !== 'Started' && r.stage !== 'Declined');
  const selectedRef = state.referrals.find(r => r.id === selectedReferral);

  const scores = selectedRef ? findBestMatchStaff(selectedRef, state.staff, state.compliance) : [];

  // Open shifts = referrals in Staffing stage
  const openShifts = state.referrals.filter(r => r.stage === 'Staffing');

  // Staff stats
  const availableCount = state.staff.filter(s => s.availability === 'Available').length;
  const confirmedCount = state.staff.filter(s => s.shiftStatus === 'Confirmed').length;
  const totalVisitsToday = state.staff.reduce((sum, s) => sum + s.todayVisits, 0);

  // Heatmap data
  const heatmapData = state.staff.map(s => ({
    name: s.name,
    load: Math.round((s.todayVisits / s.maxVisits) * 100),
    visits: s.todayVisits,
    max: s.maxVisits,
    overtime: s.overtimeRisk,
  }));

  const handleToggleAvailability = (staffId: string) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (!staff) return;
    const newAvailability = staff.availability === 'Available' ? 'Unavailable' : 'Available';
    updateStaff(staffId, { availability: newAvailability });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Staff',
      recordId: staffId,
      details: `Availability changed to ${newAvailability} for ${staff.name}`,
      before: staff.availability,
      after: newAvailability,
    });
  };

  const handleAssignToReferral = (staffMember: StaffMember) => {
    if (!selectedRef) return;
    updateReferralStage(selectedRef.id, 'Scheduled');
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Referral',
      recordId: selectedRef.id,
      details: `Assigned ${staffMember.name} to ${selectedRef.patientInitials}, stage → Scheduled`,
      before: selectedRef.stage,
      after: 'Scheduled',
    });
  };

  const handleShiftOffer = (staffId: string) => {
    const staff = state.staff.find(s => s.id === staffId);
    if (!staff) return;
    updateStaff(staffId, { shiftStatus: 'Unconfirmed' });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Staff',
      recordId: staffId,
      details: `Shift offer sent to ${staff.name}`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Users size={22} className="text-advisa-accent" />
            Staffing Coverage Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">{state.staff.length} staff · {availableCount} available · {totalVisitsToday} visits today</p>
        </div>
        <button onClick={() => setShowOpenShifts(!showOpenShifts)} className="btn-secondary text-xs">
          <Clock size={13} /> Open Shifts ({openShifts.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><UserCheck size={14} className="text-emerald-500" /><p className="stat-label">Available</p></div>
          <p className="stat-value text-emerald-600">{availableCount}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={14} className="text-sky-500" /><p className="stat-label">Confirmed</p></div>
          <p className="stat-value text-sky-600">{confirmedCount}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><BarChart3 size={14} className="text-amber-500" /><p className="stat-label">Today&apos;s Visits</p></div>
          <p className="stat-value text-amber-600">{totalVisitsToday}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-violet-500" /><p className="stat-label">Open Shifts</p></div>
          <p className="stat-value text-violet-600">{openShifts.length}</p>
        </div>
      </div>

      {/* Open Shift Board */}
      {showOpenShifts && (
        <div className="card mb-5 bg-amber-50/50 border-amber-200">
          <p className="section-title mb-3 flex items-center gap-2"><Clock size={13} /> Open Shift Board</p>
          {openShifts.length === 0 ? (
            <p className="text-xs text-slate-400">No open shifts</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {openShifts.map(r => (
                <div key={r.id} className="bg-white p-3 rounded-lg border border-amber-200 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{r.patientInitials} — {r.serviceType}</span>
                    <span className={`badge ${r.urgency === 'Immediate' ? 'badge-urgent' : 'badge-warning'}`}>{r.urgency}</span>
                  </div>
                  <p className="text-slate-500 mt-1">{r.source} · {r.dischargeFacility}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Best-Match Section */}
      <div className="card mb-5">
        <p className="section-title mb-3 flex items-center gap-2"><Zap size={13} /> Best-Match Staffing</p>
        <div className="mb-3">
          <select className="select" value={selectedReferral} onChange={e => setSelectedReferral(e.target.value)}>
            <option value="">Select a referral to match...</option>
            {referralOptions.map(r => (
              <option key={r.id} value={r.id}>{r.patientInitials} — {r.serviceType} ({r.urgency})</option>
            ))}
          </select>
        </div>

        {selectedRef && scores.length > 0 && (
          <div className="space-y-2">
            {scores.slice(0, 5).map((entry, i) => {
              const restriction = hasWorkRestriction(entry.staff.id, state.compliance);
              return (
                <div key={entry.staff.id} className={`p-3 rounded-lg border ${i === 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-advisa-border'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{entry.staff.name}</p>
                        <p className="text-[10px] text-slate-400">{entry.staff.role} · {entry.staff.location} · {entry.staff.todayVisits}/{entry.staff.maxVisits} visits</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${entry.score >= 60 ? 'text-emerald-600' : entry.score >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                        {entry.score}pts
                      </span>
                      {!restriction.restricted && (
                        <button onClick={() => handleAssignToReferral(entry.staff)} className="btn-primary text-xs py-1 px-2.5">
                          <Send size={11} /> Assign
                        </button>
                      )}
                    </div>
                  </div>
                  {restriction.restricted && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1">
                      <AlertTriangle size={11} /> Work restricted: {restriction.reasons.join(', ')}
                    </div>
                  )}
                  {expandedStaff === entry.staff.id ? (
                    <div>
                      <ScoreBreakdown score={entry} />
                      <button onClick={() => setExpandedStaff(null)} className="text-[10px] text-advisa-accent mt-2">Hide breakdown</button>
                    </div>
                  ) : (
                    <button onClick={() => setExpandedStaff(entry.staff.id)} className="text-[10px] text-advisa-accent">Show score breakdown</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {selectedRef && scores.length === 0 && (
          <p className="text-xs text-slate-400">No eligible staff found for this referral.</p>
        )}
      </div>

      {/* Staff Roster & Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <p className="section-title mb-3 flex items-center gap-2"><Users size={13} /> Staff Roster</p>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">Name</th>
                  <th className="table-head">Role</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Shift</th>
                  <th className="table-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.staff.map(s => {
                  const restriction = hasWorkRestriction(s.id, state.compliance);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell">
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        {restriction.restricted && (
                          <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle size={9} /> Restricted</p>
                        )}
                      </td>
                      <td className="table-cell"><span className="badge badge-neutral">{s.role}</span></td>
                      <td className="table-cell">
                        <span className={`badge ${s.availability === 'Available' ? 'badge-success' : s.availability === 'Partially' ? 'badge-warning' : 'badge-neutral'}`}>
                          {s.availability}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${s.shiftStatus === 'Confirmed' ? 'badge-success' : s.shiftStatus === 'Declined' ? 'badge-urgent' : 'badge-warning'}`}>
                          {s.shiftStatus}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggleAvailability(s.id)} className="text-advisa-accent hover:text-advisa-accent-dark" title="Toggle availability">
                            {s.availability === 'Available' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          {s.shiftStatus !== 'Confirmed' && s.availability !== 'Unavailable' && (
                            <button onClick={() => handleShiftOffer(s.id)} className="text-xs text-sky-600 hover:text-sky-800" title="Send shift offer">
                              <Send size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <p className="section-title mb-3 flex items-center gap-2"><BarChart3 size={13} /> Workload Heatmap</p>
          <div className="space-y-2">
            {heatmapData.map(item => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-28 truncate">{item.name}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${item.load >= 90 ? 'bg-red-500' : item.load >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(item.load, 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-700">
                    {item.visits}/{item.max}
                  </span>
                </div>
                {item.overtime === 'High' && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

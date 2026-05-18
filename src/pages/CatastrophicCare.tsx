import { useAppState } from '../context/AppContext';
import type { CatastrophicCase } from '../types';
import {
  Siren, ShieldAlert, Users, CheckCircle, XCircle,
  Phone, Package, Clock, Activity
} from 'lucide-react';

function CoverageRiskBadge({ risk }: { risk: CatastrophicCase['coverageRisk'] }) {
  const style = risk === 'Covered' ? 'badge-success' : risk === 'Partial' ? 'badge-warning' : 'badge-urgent';
  return <span className={`badge ${style}`}>{risk}</span>;
}

function CaseCard({ caseItem }: { caseItem: CatastrophicCase }) {
  const { state } = useAppState();
  const uncoveredShifts = caseItem.shiftCoverage.filter(s => !s.covered).length;

  // Find best staff match for uncovered shifts
  const availableStaff = state.staff.filter(s =>
    s.availability !== 'Unavailable' &&
    caseItem.requiredSkills.some(skill => s.skillTags.includes(skill))
  );

  return (
    <div className={`card ${caseItem.coverageRisk === 'Uncovered' ? 'border-red-300 bg-red-50/30' : caseItem.coverageRisk === 'Partial' ? 'border-amber-300 bg-amber-50/30' : ''}`} data-testid="catastrophic-case">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${caseItem.coverageRisk === 'Covered' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {caseItem.patientInitials.split('.')[0]}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{caseItem.patientInitials}</p>
            <p className="text-xs text-slate-400">{caseItem.branch} · {caseItem.payerType}</p>
          </div>
        </div>
        <CoverageRiskBadge risk={caseItem.coverageRisk} />
      </div>

      {/* Conditions & Required Skills */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Conditions</p>
          <div className="flex flex-wrap gap-1">
            {caseItem.conditions.map(c => (
              <span key={c} className="badge badge-urgent text-[9px]">{c}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1">Required Skills</p>
          <div className="flex flex-wrap gap-1">
            {caseItem.requiredSkills.map(s => (
              <span key={s} className="badge badge-info text-[9px]">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Shift Coverage */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
          <Clock size={12} /> Shift Coverage
          {uncoveredShifts > 0 && (
            <span className="badge badge-urgent text-[9px] ml-1">{uncoveredShifts} uncovered</span>
          )}
        </p>
        <div className="space-y-1.5">
          {caseItem.shiftCoverage.map((shift, idx) => (
            <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${shift.covered ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {shift.covered ? <CheckCircle size={12} className="text-emerald-600" /> : <XCircle size={12} className="text-red-500" />}
                <span className={shift.covered ? 'text-emerald-700' : 'text-red-700 font-medium'}>{shift.shift}</span>
              </div>
              {shift.covered ? (
                <span className="text-emerald-600 text-[10px]">{shift.staffName}</span>
              ) : (
                <span className="text-red-500 font-medium">UNCOVERED</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Best-Match Staff for Uncovered Shifts */}
      {uncoveredShifts > 0 && availableStaff.length > 0 && (
        <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
          <p className="text-xs font-semibold text-sky-800 mb-2 flex items-center gap-1">
            <Users size={12} /> Best Match Staff for Coverage
          </p>
          <div className="space-y-1">
            {availableStaff.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{s.name} <span className="text-slate-400">({s.role})</span></span>
                <div className="flex items-center gap-2">
                  <span className={`badge text-[9px] ${s.availability === 'Available' ? 'badge-success' : 'badge-warning'}`}>{s.availability}</span>
                  <span className="text-slate-400">{s.todayVisits}/{s.maxVisits}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-2 bg-slate-50 rounded-lg text-xs">
          <p className="text-slate-400 flex items-center gap-1"><Phone size={10} /> Family Contact</p>
          <p className="font-medium text-slate-700 mt-0.5">{caseItem.familyContact}</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg text-xs">
          <p className="text-slate-400 flex items-center gap-1"><Phone size={10} /> Case Manager</p>
          <p className="font-medium text-slate-700 mt-0.5">{caseItem.caseManagerContact}</p>
        </div>
      </div>

      {/* Supply & Equipment */}
      {caseItem.supplyEquipmentNeeds.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"><Package size={12} /> Supply & Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            {caseItem.supplyEquipmentNeeds.map(item => (
              <span key={item} className="badge badge-neutral text-[9px]">{item}</span>
            ))}
          </div>
        </div>
      )}

      {/* Incident Timeline */}
      {caseItem.incidentTimeline.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1"><Activity size={12} /> Incident Timeline</p>
          <div className="space-y-1.5 relative pl-4 border-l-2 border-advisa-border">
            {caseItem.incidentTimeline.map((evt, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white" />
                <p className="text-xs text-slate-700">{evt.event}</p>
                <p className="text-[10px] text-slate-400">{evt.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatastrophicCare() {
  const { state } = useAppState();
  const cases = state.catastrophicCases;
  const uncoveredCount = cases.filter(c => c.coverageRisk !== 'Covered').length;
  const totalUncoveredShifts = cases.reduce((sum, c) => sum + c.shiftCoverage.filter(s => !s.covered).length, 0);

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Siren size={22} className="text-red-500" />
            Catastrophic Care Command Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {cases.length} active case{cases.length !== 1 ? 's' : ''} · {uncoveredCount} with coverage risk · {totalUncoveredShifts} uncovered shift{totalUncoveredShifts !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="stat-card">
          <p className="stat-label">Active Cases</p>
          <p className="stat-value text-sky-600">{cases.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Coverage Risk</p>
          <p className="stat-value text-red-600">{uncoveredCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Uncovered Shifts</p>
          <p className="stat-value text-amber-600">{totalUncoveredShifts}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Staff w/ Skills</p>
          <p className="stat-value text-emerald-600">
            {state.staff.filter(s => s.skillTags.some(t => ['vent/trach', 'TBI', 'SCI', 'wound care'].includes(t))).length}
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      {uncoveredCount > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-5 flex items-start gap-3" data-testid="coverage-warning">
          <ShieldAlert size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Coverage Risk Alert</p>
            <p className="text-xs text-red-700 mt-1">
              {uncoveredCount} catastrophic care case{uncoveredCount > 1 ? 's have' : ' has'} uncovered shifts.
              {totalUncoveredShifts} total shift{totalUncoveredShifts > 1 ? 's' : ''} need{totalUncoveredShifts === 1 ? 's' : ''} immediate staffing.
            </p>
          </div>
        </div>
      )}

      {/* Case Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {cases.map(c => <CaseCard key={c.id} caseItem={c} />)}
      </div>

      {cases.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Siren size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No active catastrophic care cases</p>
        </div>
      )}
    </div>
  );
}

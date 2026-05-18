import { useAppState } from '../context/AppContext';
import type { QualityStatus } from '../types';
import { useState } from 'react';
import {
  Star, AlertTriangle, Clock, CheckCircle, XCircle, BarChart3,
  FileText, Heart, Activity, UserCheck, CalendarClock
} from 'lucide-react';

export default function Quality() {
  const { state, updateQualityStatus, addAuditEntry, updateOASIS, updateHOPE } = useAppState();
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState<'watchboard' | 'oasis' | 'hope'>('watchboard');

  const categories: string[] = ['All', 'Home Health', 'Hospice', 'General QA'];
  const priorities = ['All', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Open', 'In Progress', 'Complete'];

  const filtered = state.quality.filter(item =>
    (filterCategory === 'All' || item.category === filterCategory) &&
    (filterPriority === 'All' || item.priority === filterPriority) &&
    (filterStatus === 'All' || item.status === filterStatus)
  );

  const counts = {
    open: state.quality.filter(i => i.status === 'Open').length,
    inProgress: state.quality.filter(i => i.status === 'In Progress').length,
    complete: state.quality.filter(i => i.status === 'Complete').length,
  };

  // QAO compliance %
  const totalItems = state.quality.length;
  const completeItems = state.quality.filter(i => i.status === 'Complete').length;
  const qaoCompliancePct = totalItems > 0 ? Math.round((completeItems / totalItems) * 100) : 0;

  const handleStatusChange = (id: string, newStatus: string) => {
    updateQualityStatus(id, newStatus as QualityStatus);
    const item = state.quality.find(q => q.id === id);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Quality',
      recordId: id,
      details: `Status changed to ${newStatus} for ${item?.patientInitials} - ${item?.type}`,
      before: item?.status,
      after: newStatus,
    });
  };

  const highPriorityOpen = state.quality.filter(q => q.priority === 'High' && q.status !== 'Complete');

  // Late assessment alerts
  const today = new Date();
  const lateOASIS = state.oasisAssessments.filter(o => o.status === 'Due' && new Date(o.dueDate) < today);
  const lateHOPE = state.hopeAssessments.filter(h => h.status === 'Due' && new Date(h.dueDate) < today);

  // HHCAHPS follow-ups
  const hhcahpsItems = state.quality.filter(q => q.type === 'CAHPS Follow-up');

  return (
    <div>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Star size={22} className="text-advisa-accent" />
          Quality / OASIS / Hospice Watchboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">{state.quality.length} items · {counts.open} open · QAO {qaoCompliancePct}% compliant</p>
      </div>

      {/* Late Assessment Alerts */}
      {(lateOASIS.length > 0 || lateHOPE.length > 0) && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-800 flex items-center gap-2 mb-1">
            <AlertTriangle size={13} /> Late Assessment Risk
          </p>
          {lateOASIS.length > 0 && (
            <p className="text-xs text-red-700">{lateOASIS.length} OASIS assessment{lateOASIS.length > 1 ? 's' : ''} overdue</p>
          )}
          {lateHOPE.length > 0 && (
            <p className="text-xs text-red-700">{lateHOPE.length} HOPE assessment{lateHOPE.length > 1 ? 's' : ''} overdue</p>
          )}
        </div>
      )}

      {highPriorityOpen.length > 0 && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
          <AlertTriangle size={14} />
          {highPriorityOpen.length} high priority items need attention
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-advisa-border">
        <button onClick={() => setActiveTab('watchboard')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'watchboard' ? 'border-advisa-accent text-advisa-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Activity size={13} className="inline mr-1.5" /> Watchboard
        </button>
        <button onClick={() => setActiveTab('oasis')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'oasis' ? 'border-advisa-accent text-advisa-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <FileText size={13} className="inline mr-1.5" /> OASIS Queue
        </button>
        <button onClick={() => setActiveTab('hope')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'hope' ? 'border-advisa-accent text-advisa-accent' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Heart size={13} className="inline mr-1.5" /> Hospice HOPE
        </button>
      </div>

      {activeTab === 'watchboard' && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#dc2626' }}>
              <div className="flex items-center gap-2 mb-1"><XCircle size={15} className="text-red-600" /><p className="stat-label">Open</p></div>
              <p className="stat-value text-red-600">{counts.open}</p>
            </div>
            <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#d97706' }}>
              <div className="flex items-center gap-2 mb-1"><Clock size={15} className="text-amber-600" /><p className="stat-label">In Progress</p></div>
              <p className="stat-value text-amber-600">{counts.inProgress}</p>
            </div>
            <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#059669' }}>
              <div className="flex items-center gap-2 mb-1"><CheckCircle size={15} className="text-emerald-600" /><p className="stat-label">Complete</p></div>
              <p className="stat-value text-emerald-600">{counts.complete}</p>
            </div>
            <div className="stat-card" style={{ borderLeftWidth: '3px', borderLeftColor: '#0ea5e9' }}>
              <div className="flex items-center gap-2 mb-1"><BarChart3 size={15} className="text-sky-600" /><p className="stat-label">QAO %</p></div>
              <p className="stat-value text-sky-600">{qaoCompliancePct}%</p>
            </div>
          </div>

          {/* Category Sections */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <select className="select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
            <select className="select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              {priorities.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
            </select>
            <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          </div>

          {/* Quality Table */}
          <div className="card p-0 overflow-hidden mb-5">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">Category</th>
                  <th className="table-head">Type</th>
                  <th className="table-head">Patient</th>
                  <th className="table-head">Priority</th>
                  <th className="table-head">Due Date</th>
                  <th className="table-head">Assigned To</th>
                  <th className="table-head">Reviewer</th>
                  <th className="table-head">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell">
                      <span className={`badge text-[10px] ${item.category === 'Home Health' ? 'badge-info' : item.category === 'Hospice' ? 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200' : 'badge-neutral'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-slate-800">{item.type}</td>
                    <td className="table-cell">{item.patientInitials}</td>
                    <td className="table-cell">
                      <span className={`badge ${item.priority === 'High' ? 'badge-urgent' : item.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="table-cell text-slate-500">{item.dueDate}</td>
                    <td className="table-cell text-slate-600">{item.assignedTo}</td>
                    <td className="table-cell text-slate-400 text-xs">
                      {item.reviewerName ? (
                        <span className="flex items-center gap-1"><UserCheck size={10} /> {item.reviewerName}</span>
                      ) : '—'}
                      {item.reviewDueDate && <p className="text-[10px] text-slate-300">Due: {item.reviewDueDate}</p>}
                    </td>
                    <td className="table-cell">
                      <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white">
                        <option>Open</option><option>In Progress</option><option>Complete</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* HHCAHPS Follow-up Tracker */}
          {hhcahpsItems.length > 0 && (
            <div className="card mb-5">
              <div className="card-header"><Star size={15} /> HHCAHPS Follow-up Tracker</div>
              <div className="space-y-2 text-sm">
                {hhcahpsItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-slate-600">{item.patientInitials} — Due {item.dueDate}</span>
                    <span className={`badge ${item.status === 'Complete' ? 'badge-success' : item.status === 'In Progress' ? 'badge-warning' : 'badge-urgent'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card">
              <div className="card-header"><BarChart3 size={15} />Breakdown by Type</div>
              <div className="space-y-2 text-sm">
                {['OASIS Due', 'QA Review', 'Readmission Follow-up', 'CAHPS Follow-up', 'Hospice Comfort', 'Missed Visit', 'Late Note', 'Incident'].map(type => {
                  const count = state.quality.filter(q => q.type === type && q.status !== 'Complete').length;
                  return (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-slate-600">{type}</span>
                      <span className={`font-semibold text-xs ${count > 0 ? 'text-red-600' : 'text-slate-300'}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><AlertTriangle size={15} />Open by Priority</div>
              <div className="space-y-2 text-sm">
                {['High', 'Medium', 'Low'].map(priority => {
                  const count = state.quality.filter(q => q.priority === priority && q.status !== 'Complete').length;
                  return (
                    <div key={priority} className="flex justify-between items-center">
                      <span className={priority === 'High' ? 'text-red-600 font-medium' : priority === 'Medium' ? 'text-amber-600' : 'text-slate-600'}>{priority}</span>
                      <span className="font-semibold text-xs">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'oasis' && (
        <div>
          <p className="section-title mb-3 flex items-center gap-2"><FileText size={13} /> OASIS Assessment Queue</p>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">Patient</th>
                  <th className="table-head">Type</th>
                  <th className="table-head">Due Date</th>
                  <th className="table-head">Assigned To</th>
                  <th className="table-head">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.oasisAssessments.map(oa => (
                  <tr key={oa.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-semibold text-slate-800">{oa.patientInitials}</td>
                    <td className="table-cell">{oa.type}</td>
                    <td className="table-cell text-slate-500">{oa.dueDate}</td>
                    <td className="table-cell text-slate-600">{oa.assignedTo}</td>
                    <td className="table-cell">
                      <select
                        value={oa.status}
                        onChange={e => {
                          updateOASIS(oa.id, { status: e.target.value as typeof oa.status });
                          addAuditEntry({ user: state.currentUser.name, role: state.currentUser.role, action: 'Updated', recordType: 'Quality', recordId: oa.id, details: `OASIS ${oa.type} status → ${e.target.value}`, before: oa.status, after: e.target.value });
                        }}
                        className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white"
                      >
                        <option>Due</option><option>Submitted</option><option>Accepted</option><option>Rejected</option>
                      </select>
                      {oa.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-0.5">{oa.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'hope' && (
        <div>
          <p className="section-title mb-3 flex items-center gap-2"><Heart size={13} /> Hospice HOPE Assessment Tracker</p>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">Patient</th>
                  <th className="table-head">Type</th>
                  <th className="table-head">Due Date</th>
                  <th className="table-head">Assigned To</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">iQIES</th>
                </tr>
              </thead>
              <tbody>
                {state.hopeAssessments.map(ha => (
                  <tr key={ha.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-semibold text-slate-800">{ha.patientInitials}</td>
                    <td className="table-cell">{ha.type}</td>
                    <td className="table-cell text-slate-500">{ha.dueDate}</td>
                    <td className="table-cell text-slate-600">{ha.assignedTo}</td>
                    <td className="table-cell">
                      <select
                        value={ha.status}
                        onChange={e => {
                          updateHOPE(ha.id, { status: e.target.value as typeof ha.status });
                          addAuditEntry({ user: state.currentUser.name, role: state.currentUser.role, action: 'Updated', recordType: 'Quality', recordId: ha.id, details: `HOPE ${ha.type} status → ${e.target.value}`, before: ha.status, after: e.target.value });
                        }}
                        className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white"
                      >
                        <option>Due</option><option>Submitted</option><option>Accepted</option><option>Rejected</option>
                      </select>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${ha.iqiesStatus === 'Accepted' ? 'badge-success' : ha.iqiesStatus === 'Error' ? 'badge-urgent' : ha.iqiesStatus === 'Submitted' ? 'badge-info' : 'badge-neutral'}`}>
                        {ha.iqiesStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* HOPE Timeline */}
          <div className="mt-5 card">
            <div className="card-header"><CalendarClock size={15} /> HOPE Assessment Timeline</div>
            <div className="space-y-3">
              {['HOPE Admission', 'HOPE Update Visit 1', 'HOPE Update Visit 2', 'HOPE Discharge'].map(type => {
                const items = state.hopeAssessments.filter(h => h.type === type);
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-36">{type.replace('HOPE ', '')}</span>
                    <div className="flex-1 flex gap-1">
                      {items.map(item => (
                        <span key={item.id} className={`badge text-[10px] ${item.status === 'Accepted' ? 'badge-success' : item.status === 'Submitted' ? 'badge-info' : item.status === 'Rejected' ? 'badge-urgent' : 'badge-neutral'}`}>
                          {item.patientInitials}: {item.status}
                        </span>
                      ))}
                      {items.length === 0 && <span className="text-[10px] text-slate-300">—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

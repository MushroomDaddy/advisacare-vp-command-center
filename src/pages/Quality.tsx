import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import { calculateQAOFromOASIS, calculateQualityRiskScore } from '../utils/dataLogic';
import { getDaysUntilExpiry, formatDate } from '../lib/dateUtils';
import type { QualityItem, OASISAssessment, HOPEAssessment } from '../types';
import {
  Star, Activity,
  FileText, Eye, BarChart3, Shield
} from 'lucide-react';

type QualityTab = 'watchboard' | 'oasis' | 'hope' | 'cahps';

function Watchboard() {
  const { state, updateQuality, addAuditEntry, addToast } = useAppState();
  const riskScore = calculateQualityRiskScore(state.quality, state.oasisAssessments, state.hopeAssessments, state.visits);
  const [filterType, setFilterType] = useState('All');

  const types = ['All', ...new Set(state.quality.map(q => q.type))];
  const filtered = state.quality.filter(q => filterType === 'All' || q.type === filterType);

  const handleStatusChange = (id: string, status: QualityItem['status']) => {
    const item = state.quality.find(q => q.id === id);
    updateQuality(id, { status });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Quality',
      recordId: id,
      details: `Quality item ${item?.patientInitials} status → ${status}`,
    });
    addToast(`Quality item updated to ${status}`, 'success');
  };

  return (
    <div>
      {/* Quality Risk Score */}
      <div className={`p-4 rounded-lg border mb-5 ${riskScore > 50 ? 'bg-red-50 border-red-200' : riskScore > 25 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`} data-testid="quality-risk-score">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Shield size={15} /> Quality Risk Score
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Based on: overdue OASIS, rejected OASIS, late notes, missed visits, unresolved incidents, HOPE overdue
            </p>
          </div>
          <div className={`text-3xl font-bold ${riskScore > 50 ? 'text-red-600' : riskScore > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {riskScore}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
      </div>

      {/* Quality Items Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Type</th>
              <th className="table-head">Patient</th>
              <th className="table-head">Due Date</th>
              <th className="table-head">Priority</th>
              <th className="table-head">Assigned To</th>
              <th className="table-head">Reviewer</th>
              <th className="table-head">Status</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(q => {
              const overdue = getDaysUntilExpiry(q.dueDate) < 0;
              return (
                <tr key={q.id} className={`hover:bg-slate-50 ${overdue && q.status !== 'Complete' ? 'bg-red-50/50' : ''}`}>
                  <td className="table-cell"><span className="badge badge-info text-[10px]">{q.type}</span></td>
                  <td className="table-cell font-semibold">{q.patientInitials}</td>
                  <td className="table-cell">
                    <span className={overdue && q.status !== 'Complete' ? 'text-red-600 font-medium' : 'text-slate-500'}>{formatDate(q.dueDate)}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge text-[10px] ${q.priority === 'High' ? 'badge-urgent' : q.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'}`}>{q.priority}</span>
                  </td>
                  <td className="table-cell text-xs">{q.assignedTo}</td>
                  <td className="table-cell text-xs text-slate-400">{q.reviewerName || '—'}</td>
                  <td className="table-cell">
                    <select
                      value={q.status}
                      onChange={e => handleStatusChange(q.id, e.target.value as QualityItem['status'])}
                      className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Complete">Complete</option>
                    </select>
                  </td>
                  <td className="table-cell">
                    <button className="text-advisa-accent hover:text-advisa-accent-dark"><Eye size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No quality items</div>}
      </div>
    </div>
  );
}

function OASISQueue() {
  const { state, updateOASIS, addAuditEntry, addToast } = useAppState();
  const qao = calculateQAOFromOASIS(state.oasisAssessments);

  const handleStatusChange = (id: string, status: OASISAssessment['status']) => {
    updateOASIS(id, { status });
    const item = state.oasisAssessments.find(o => o.id === id);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'OASIS',
      recordId: id,
      details: `OASIS ${item?.patientInitials} ${item?.type} → ${status}`,
    });
    addToast(`OASIS status updated to ${status}`, 'success');
  };

  return (
    <div>
      {/* QAO Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5" data-testid="qao-summary">
        <div className="stat-card">
          <p className="stat-label">Eligible</p>
          <p className="stat-value text-sky-600">{qao.eligible}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Accepted</p>
          <p className="stat-value text-emerald-600">{qao.accepted}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Submitted</p>
          <p className="stat-value text-amber-600">{state.oasisAssessments.filter(o => o.status === 'Submitted').length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rejected</p>
          <p className="stat-value text-red-600">{state.oasisAssessments.filter(o => o.status === 'Rejected').length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">QAO %</p>
          <p className={`stat-value ${qao.qaoPct >= 70 ? 'text-emerald-600' : qao.qaoPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{qao.qaoPct}%</p>
        </div>
      </div>

      {/* OASIS Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Patient</th>
              <th className="table-head">Type</th>
              <th className="table-head">Due Date</th>
              <th className="table-head">Days Left</th>
              <th className="table-head">Assigned To</th>
              <th className="table-head">Status</th>
              <th className="table-head">Rejection Reason</th>
            </tr>
          </thead>
          <tbody>
            {state.oasisAssessments.map(o => {
              const daysLeft = getDaysUntilExpiry(o.dueDate);
              return (
                <tr key={o.id} className={`hover:bg-slate-50 ${daysLeft < 0 && o.status === 'Due' ? 'bg-red-50/50' : ''}`}>
                  <td className="table-cell font-semibold">{o.patientInitials}</td>
                  <td className="table-cell"><span className="badge badge-info text-[10px]">{o.type}</span></td>
                  <td className="table-cell text-slate-500">{formatDate(o.dueDate)}</td>
                  <td className="table-cell">
                    <span className={`font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                    </span>
                  </td>
                  <td className="table-cell text-xs">{o.assignedTo}</td>
                  <td className="table-cell">
                    <select
                      value={o.status}
                      onChange={e => handleStatusChange(o.id, e.target.value as OASISAssessment['status'])}
                      className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white"
                    >
                      <option value="Due">Due</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="table-cell text-xs text-red-500">{o.rejectionReason || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HOPEQueue() {
  const { state, updateHOPE, addAuditEntry, addToast } = useAppState();

  const handleStatusChange = (id: string, status: HOPEAssessment['status']) => {
    updateHOPE(id, { status });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'HOPE',
      recordId: id,
      details: `HOPE assessment status → ${status}`,
    });
    addToast(`HOPE status updated to ${status}`, 'success');
  };

  return (
    <div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Patient</th>
              <th className="table-head">Type</th>
              <th className="table-head">Due Date</th>
              <th className="table-head">Days Left</th>
              <th className="table-head">Assigned To</th>
              <th className="table-head">Status</th>
              <th className="table-head">iQIES Status</th>
            </tr>
          </thead>
          <tbody>
            {state.hopeAssessments.map(h => {
              const daysLeft = getDaysUntilExpiry(h.dueDate);
              return (
                <tr key={h.id} className={`hover:bg-slate-50 ${daysLeft < 0 && h.status === 'Due' ? 'bg-red-50/50' : ''}`}>
                  <td className="table-cell font-semibold">{h.patientInitials}</td>
                  <td className="table-cell"><span className="badge badge-info text-[10px]">{h.type}</span></td>
                  <td className="table-cell text-slate-500">{formatDate(h.dueDate)}</td>
                  <td className="table-cell">
                    <span className={`font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                    </span>
                  </td>
                  <td className="table-cell text-xs">{h.assignedTo}</td>
                  <td className="table-cell">
                    <select
                      value={h.status}
                      onChange={e => handleStatusChange(h.id, e.target.value as HOPEAssessment['status'])}
                      className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white"
                    >
                      <option value="Due">Due</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="table-cell">
                    <span className={`badge text-[10px] ${h.iqiesStatus === 'Accepted' ? 'badge-success' : h.iqiesStatus === 'Error' ? 'badge-urgent' : 'badge-warning'}`}>
                      {h.iqiesStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CAHPSTab() {
  const { state } = useAppState();
  const cahpsItems = state.quality.filter(q => q.type === 'CAHPS Follow-up');

  return (
    <div>
      {cahpsItems.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No CAHPS follow-up items</p>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-head">Patient</th>
                <th className="table-head">Due Date</th>
                <th className="table-head">Assigned To</th>
                <th className="table-head">Priority</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody>
              {cahpsItems.map(q => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="table-cell font-semibold">{q.patientInitials}</td>
                  <td className="table-cell text-slate-500">{formatDate(q.dueDate)}</td>
                  <td className="table-cell text-xs">{q.assignedTo}</td>
                  <td className="table-cell"><span className={`badge text-[10px] ${q.priority === 'High' ? 'badge-urgent' : q.priority === 'Medium' ? 'badge-warning' : 'badge-neutral'}`}>{q.priority}</span></td>
                  <td className="table-cell"><span className={`badge text-[10px] ${q.status === 'Complete' ? 'badge-success' : 'badge-warning'}`}>{q.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Quality() {
  const [activeTab, setActiveTab] = useState<QualityTab>('watchboard');

  const tabs: { key: QualityTab; label: string; icon: React.ReactNode }[] = [
    { key: 'watchboard', label: 'Watchboard', icon: <Activity size={13} /> },
    { key: 'oasis', label: 'OASIS Queue', icon: <FileText size={13} /> },
    { key: 'hope', label: 'HOPE Queue', icon: <Star size={13} /> },
    { key: 'cahps', label: 'CAHPS', icon: <BarChart3 size={13} /> },
  ];

  return (
    <div>
      <h2 className="page-title flex items-center gap-2 mb-5">
        <Star size={22} className="text-advisa-accent" />
        Quality Management
      </h2>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all ${activeTab === tab.key ? 'bg-white text-advisa-accent shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'watchboard' && <Watchboard />}
      {activeTab === 'oasis' && <OASISQueue />}
      {activeTab === 'hope' && <HOPEQueue />}
      {activeTab === 'cahps' && <CAHPSTab />}
    </div>
  );
}

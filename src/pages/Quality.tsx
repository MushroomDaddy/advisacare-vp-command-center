import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import type { QualityStatus, QualityItem } from '../types';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { calculateQAO, summarizeOasisCounts } from '../utils/dataLogic';
import {
  Star, AlertTriangle, FileText, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Pencil, Activity, ClipboardCheck, Heart, MessageSquare,
} from 'lucide-react';

const STATUS_OPTIONS: QualityStatus[] = ['Open', 'In Progress', 'Submitted', 'Accepted', 'Resolved', 'Rejected'];

type QualityTab = 'watchboard' | 'oasis' | 'hope' | 'cahps';

export default function Quality() {
  const { state, updateQualityStatus, updateQualityItem, addAuditEntry, createAlert, resolveAlert, runAlertEngine } = useAppState();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const deepLinkQid = searchParams.get('qid');
  const highlightId = deepLinkQid;
  const [activeTab, setActiveTab] = useState<QualityTab>('watchboard');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editReviewerItem, setEditReviewerItem] = useState<string | null>(null);
  const [editReviewerText, setEditReviewerText] = useState('');
  const [reviewNotesItem, setReviewNotesItem] = useState<string | null>(null);
  const [reviewNotesText, setReviewNotesText] = useState('');

  // Fix #2: react to ?qid= changes — switch to the correct tab, expand, highlight, scroll.
  useEffect(() => {
    if (!deepLinkQid) return;
    const item: QualityItem | undefined = state.quality.find(q => q.id === deepLinkQid);
    const timeoutId = window.setTimeout(() => {
      if (item) {
        let targetTab: QualityTab = 'watchboard';
        if (item.type === 'OASIS Due' || item.type === 'OASIS Review') targetTab = 'oasis';
        else if (item.type === 'HOPE Assessment') targetTab = 'hope';
        else if (item.type === 'CAHPS Follow-up') targetTab = 'cahps';
        setActiveTab(targetTab);
        setFilterType('All');
        setFilterStatus('All');
        setFilterPriority('All');
        setExpandedItem(deepLinkQid);
      }
      const el = document.getElementById(`quality-${deepLinkQid}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => window.clearTimeout(timeoutId);
  }, [deepLinkQid, state.quality]);

  // Fix #7: QAO breakdown — submitted, accepted, rejected counts and percentage.
  // Renamed/labeled as "Demo OASIS Quality Score" so it isn't mistaken for a certified CMS metric.
  const qaoScore = useMemo(() => calculateQAO(state.quality), [state.quality]);
  const qaoCounts = useMemo(() => summarizeOasisCounts(state.quality), [state.quality]);

  const counts = useMemo(() => ({
    total: state.quality.length,
    open: state.quality.filter(q => q.status === 'Open').length,
    inProgress: state.quality.filter(q => q.status === 'In Progress').length,
    resolved: state.quality.filter(q => q.status === 'Resolved' || q.status === 'Accepted').length,
    rejected: state.quality.filter(q => q.status === 'Rejected').length,
    oasisPending: state.quality.filter(q => (q.type === 'OASIS Due' || q.type === 'OASIS Review') && q.status !== 'Resolved' && q.status !== 'Accepted').length,
    hopeOverdue: state.quality.filter(q => q.type === 'HOPE Assessment' && q.status === 'Open' && new Date(q.dueDate) < new Date()).length,
    cahpsPending: state.quality.filter(q => q.type === 'CAHPS Follow-up' && q.status !== 'Resolved').length,
  }), [state.quality]);

  // Filter items per tab
  const tabItems = useMemo(() => {
    let items = state.quality;
    switch (activeTab) {
      case 'oasis':
        items = items.filter(q => q.type === 'OASIS Due' || q.type === 'OASIS Review');
        break;
      case 'hope':
        items = items.filter(q => q.type === 'HOPE Assessment');
        break;
      case 'cahps':
        items = items.filter(q => q.type === 'CAHPS Follow-up');
        break;
      default:
        // watchboard: everything
        break;
    }
    return items.filter(q =>
      (filterType === 'All' || q.type === filterType) &&
      (filterStatus === 'All' || q.status === filterStatus) &&
      (filterPriority === 'All' || q.priority === filterPriority)
    );
  }, [state.quality, activeTab, filterType, filterStatus, filterPriority]);

  const handleStatusChange = (id: string, newStatus: QualityStatus) => {
    const item = state.quality.find(q => q.id === id);
    if (!item) return;

    updateQualityStatus(id, newStatus);

    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Quality', recordId: id,
      details: `${item.type} for ${item.patientInitials}: status → ${newStatus}`,
      before: `status: ${item.status}`, after: `status: ${newStatus}`,
    });

    // OASIS specific handling
    if (item.type === 'OASIS Due' || item.type === 'OASIS Review') {
      if (newStatus === 'Rejected') {
        createAlert({
          type: 'OASIS Rejected', severity: 'High',
          message: `OASIS rejected for ${item.patientInitials} — action required`,
          sourceRecordType: 'Quality', sourceRecordId: id,
        });
        showToast(`OASIS rejected for ${item.patientInitials} — alert created`, 'warning');
        return;
      } else if (newStatus === 'Accepted' || newStatus === 'Resolved') {
        // Resolve any related OASIS alerts
        const relatedAlerts = state.alerts.filter(a => a.sourceRecordId === id && !a.resolved);
        relatedAlerts.forEach(a => resolveAlert(a.id));
        showToast(`OASIS accepted for ${item.patientInitials}`, 'success');
        setTimeout(() => runAlertEngine(), 100);
        return;
      }
    }

    // HOPE specific
    if (item.type === 'HOPE Assessment' && (newStatus === 'Resolved' || newStatus === 'Accepted')) {
      const relatedAlerts = state.alerts.filter(a => a.sourceRecordId === id && !a.resolved);
      relatedAlerts.forEach(a => resolveAlert(a.id));
      setTimeout(() => runAlertEngine(), 100);
    }

    // CAHPS follow-up updates state and audit
    if (item.type === 'CAHPS Follow-up' && newStatus === 'In Progress') {
      showToast(`CAHPS follow-up started for ${item.patientInitials}`, 'info');
      return;
    }

    showToast(`${item.type} → ${newStatus}`, 'success');
  };

  const handleSaveReviewer = (id: string) => {
    if (!editReviewerText.trim()) return;
    updateQualityItem(id, { assignedTo: editReviewerText });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Quality', recordId: id,
      details: `Reviewer changed to ${editReviewerText}`,
    });
    showToast('Reviewer updated', 'success');
    setEditReviewerItem(null);
    setEditReviewerText('');
  };

  const handleSaveReviewNotes = (id: string) => {
    if (!reviewNotesText.trim()) return;
    updateQualityItem(id, { reviewNotes: reviewNotesText });
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Quality', recordId: id,
      details: `Review notes updated`,
    });
    showToast('Review notes saved', 'success');
    setReviewNotesItem(null);
    setReviewNotesText('');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Open') return 'badge-urgent';
    if (status === 'In Progress') return 'badge-warning';
    if (status === 'Submitted') return 'badge-info';
    if (status === 'Accepted' || status === 'Resolved') return 'badge-success';
    if (status === 'Rejected') return 'bg-red-100 text-red-700 border border-red-200';
    return 'badge-neutral';
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const tabs: { id: QualityTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'watchboard', label: 'Watchboard', icon: <Activity size={14} />, count: counts.open },
    { id: 'oasis', label: 'OASIS Queue', icon: <ClipboardCheck size={14} />, count: counts.oasisPending },
    { id: 'hope', label: 'HOPE Queue', icon: <Heart size={14} />, count: counts.hopeOverdue },
    { id: 'cahps', label: 'CAHPS', icon: <MessageSquare size={14} />, count: counts.cahpsPending },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Star size={22} className="text-advisa-accent" />
            Quality & Outcome Tracking
          </h2>
          <p className="text-xs text-slate-400 mt-1">{counts.total} items · {counts.open} open · QAO: {qaoScore !== null ? `${qaoScore}%` : 'N/A'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="stat-card cursor-pointer" onClick={() => { setActiveTab('watchboard'); setFilterStatus('Open'); }}>
          <p className="stat-label">Open</p><p className="stat-value text-red-600">{counts.open}</p>
        </div>
        <div className="stat-card cursor-pointer" onClick={() => { setActiveTab('watchboard'); setFilterStatus('In Progress'); }}>
          <p className="stat-label">In Progress</p><p className="stat-value text-amber-600">{counts.inProgress}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Resolved</p><p className="stat-value text-emerald-600">{counts.resolved}</p>
        </div>
        <div className="stat-card" data-testid="qao-card">
          <p className="stat-label">Demo OASIS Quality Score</p>
          <p
            className={`stat-value ${qaoScore !== null && qaoScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}
            data-testid="qao-percentage"
          >
            {qaoCounts.percentage !== null ? `${qaoCounts.percentage}%` : qaoScore !== null ? `${qaoScore}%` : 'N/A'}
          </p>
          <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-slate-500" data-testid="qao-breakdown">
            <div><span className="font-semibold text-slate-700" data-testid="qao-submitted">{qaoCounts.submitted}</span> submitted</div>
            <div><span className="font-semibold text-emerald-600" data-testid="qao-accepted">{qaoCounts.accepted}</span> accepted</div>
            <div><span className="font-semibold text-red-600" data-testid="qao-rejected">{qaoCounts.rejected}</span> rejected</div>
          </div>
          <p className="text-[9px] text-amber-600 mt-1">Demo heuristic — not a certified CMS calculation</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">HOPE Overdue</p>
          <p className={`stat-value ${counts.hopeOverdue > 0 ? 'text-red-600' : 'text-slate-800'}`}>{counts.hopeOverdue}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setFilterType('All'); setFilterStatus('All'); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-advisa-accent text-white'
                : 'bg-white border border-advisa-border text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {activeTab === 'watchboard' && (
          <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            <option>OASIS Due</option><option>OASIS Review</option><option>QA Review</option>
            <option>Readmission Follow-up</option><option>Hospice Comfort</option><option>CAHPS Follow-up</option>
            <option>Missed Visit</option><option>Late Note</option><option>HOPE Assessment</option><option>Incident</option>
          </select>
        )}
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="All">All Priorities</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
      </div>

      {/* Quality Items Table */}
      <div className="card p-0 overflow-hidden scroll-hint-right">
        <div className="table-wrap">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr>
              <th className="table-head">Type</th>
              <th className="table-head">Patient</th>
              <th className="table-head">Due Date</th>
              <th className="table-head">Priority</th>
              <th className="table-head">Status</th>
              {(activeTab === 'oasis') && <th className="table-head">Score</th>}
              <th className="table-head">Assigned</th>
              <th className="table-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tabItems.map(item => (
              <>
                <tr key={item.id} id={`quality-${item.id}`} className={`hover:bg-slate-50 transition-colors ${isOverdue(item.dueDate) && item.status === 'Open' ? 'bg-red-50/30' : ''} ${highlightId === item.id ? 'bg-sky-50 ring-2 ring-sky-300' : ''}`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      {item.type === 'HOPE Assessment' && isOverdue(item.dueDate) ? (
                        <AlertTriangle size={12} className="text-red-500" />
                      ) : (item.type === 'OASIS Due' || item.type === 'OASIS Review') ? (
                        <FileText size={12} className="text-sky-500" />
                      ) : null}
                      <span className="font-medium text-slate-800">{item.type}</span>
                    </div>
                  </td>
                  <td className="table-cell font-semibold text-slate-800">{item.patientInitials}</td>
                  <td className="table-cell">
                    <span className={isOverdue(item.dueDate) && item.status !== 'Resolved' && item.status !== 'Accepted' ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                      {item.dueDate}
                    </span>
                    {isOverdue(item.dueDate) && item.status !== 'Resolved' && item.status !== 'Accepted' && (
                      <span className="text-[9px] text-red-500 block">OVERDUE</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${item.priority === 'High' ? 'badge-urgent' : item.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{item.priority}</span>
                  </td>
                  <td className="table-cell">
                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item.id, e.target.value as QualityStatus)}
                      className={`text-xs px-2 py-1 border rounded-md bg-white ${getStatusBadge(item.status).split(' ').includes('badge-urgent') ? 'border-red-200' : 'border-advisa-border'}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  {(activeTab === 'oasis') && (
                    <td className="table-cell">
                      {item.oasisScore !== undefined ? (
                        <span className={`font-semibold ${item.oasisScore >= 80 ? 'text-emerald-600' : item.oasisScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{item.oasisScore}%</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  )}
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-600">{item.assignedTo}</span>
                      <button onClick={() => { setEditReviewerItem(item.id); setEditReviewerText(item.assignedTo); }} className="text-slate-400 hover:text-advisa-accent">
                        <Pencil size={10} />
                      </button>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {expandedItem === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Detail */}
                {expandedItem === item.id && (
                  <tr key={`${item.id}-detail`}>
                    <td colSpan={activeTab === 'oasis' ? 8 : 7} className="px-4 py-3 bg-slate-50">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-slate-500 mb-1">Review Notes</p>
                          {item.reviewNotes ? (
                            <p className="text-slate-600 bg-white p-2 rounded border">{item.reviewNotes}</p>
                          ) : (
                            <p className="text-slate-400 italic">No review notes</p>
                          )}
                          <button onClick={() => { setReviewNotesItem(item.id); setReviewNotesText(item.reviewNotes || ''); }}
                            className="text-advisa-accent hover:underline mt-1 text-[10px]">
                            {item.reviewNotes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 mb-1">Quick Actions</p>
                          <div className="flex flex-wrap gap-1">
                            {item.status !== 'Resolved' && item.status !== 'Accepted' && (
                              <button onClick={() => handleStatusChange(item.id, (item.type === 'OASIS Due' || item.type === 'OASIS Review') ? 'Accepted' : 'Resolved')} className="badge badge-success cursor-pointer hover:opacity-80">
                                <CheckCircle size={10} /> Accept
                              </button>
                            )}
                            {item.status !== 'Rejected' && (item.type === 'OASIS Due' || item.type === 'OASIS Review') && (
                              <button onClick={() => handleStatusChange(item.id, 'Rejected')} className="badge badge-urgent cursor-pointer hover:opacity-80">
                                <XCircle size={10} /> Reject OASIS
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {/* Edit Reviewer Inline */}
                {editReviewerItem === item.id && (
                  <tr key={`${item.id}-reviewer`}>
                    <td colSpan={activeTab === 'oasis' ? 8 : 7} className="px-4 py-3 bg-sky-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Update Reviewer:</span>
                        <input type="text" className="input text-xs max-w-[200px]" value={editReviewerText} onChange={e => setEditReviewerText(e.target.value)} />
                        <button onClick={() => handleSaveReviewer(item.id)} className="btn-primary text-xs py-1">Save</button>
                        <button onClick={() => setEditReviewerItem(null)} className="btn-secondary text-xs py-1">Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}
                {/* Review Notes Inline */}
                {reviewNotesItem === item.id && (
                  <tr key={`${item.id}-notes`}>
                    <td colSpan={activeTab === 'oasis' ? 8 : 7} className="px-4 py-3 bg-amber-50">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-slate-600">Review Notes:</span>
                        <textarea className="input text-xs" rows={2} value={reviewNotesText} onChange={e => setReviewNotesText(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveReviewNotes(item.id)} className="btn-primary text-xs py-1">Save</button>
                          <button onClick={() => setReviewNotesItem(null)} className="btn-secondary text-xs py-1">Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {tabItems.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">No quality items match your filters</div>
      )}
    </div>
  );
}

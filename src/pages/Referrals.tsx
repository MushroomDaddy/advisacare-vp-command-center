import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import type { Referral, ReferralStage, DemoDocument } from '../types';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList, Plus, Search, Bot, FileText, ArrowRight, AlertTriangle,
  Upload, LayoutGrid, List, X, Clock, CheckCircle, Timer, ShieldCheck,
} from 'lucide-react';

const STAGES: ReferralStage[] = ['New', 'Missing Docs', 'Eligibility', 'Staffing', 'Scheduled', 'Started', 'Declined'];

const stageBg: Record<string, string> = {
  New: 'border-sky-300 bg-sky-50',
  'Missing Docs': 'border-amber-300 bg-amber-50',
  Eligibility: 'border-violet-300 bg-violet-50',
  Staffing: 'border-indigo-300 bg-indigo-50',
  Scheduled: 'border-emerald-300 bg-emerald-50',
  Started: 'border-emerald-400 bg-emerald-50',
  Declined: 'border-red-300 bg-red-50',
};

export default function Referrals() {
  const { state, updateReferralStage, addAuditEntry, addReferral, uploadDocument, createAlert } = useAppState();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const deepLinkRef = searchParams.get('ref');
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(deepLinkRef);

  // Deep link: ?ref=r1 scrolls to that referral
  useEffect(() => {
    if (deepLinkRef) {
      setTimeout(() => {
        const el = document.getElementById(`referral-${deepLinkRef}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [deepLinkRef]);
  const [filter, setFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // New referral form
  const [newPatientInitials, setNewPatientInitials] = useState('');
  const [newServiceType, setNewServiceType] = useState<Referral['serviceType']>('Home Health');
  const [newUrgency, setNewUrgency] = useState<Referral['urgency']>('Routine');
  const [newFacility, setNewFacility] = useState('');

  const selectedReferral = useMemo(
    () => state.referrals.find(r => r.id === selectedReferralId),
    [state.referrals, selectedReferralId]
  );

  const filtered = useMemo(() => state.referrals.filter((r) => {
    const matchesText = r.patientInitials.toLowerCase().includes(filter.toLowerCase()) ||
      r.source.toLowerCase().includes(filter.toLowerCase());
    const matchesStage = stageFilter === 'All Stages' || r.stage === stageFilter;
    return matchesText && matchesStage;
  }), [state.referrals, filter, stageFilter]);

  // Duplicate detection
  const checkDuplicate = useCallback((initials: string, source: string) => {
    return state.referrals.some(r =>
      r.patientInitials.toLowerCase() === initials.toLowerCase() &&
      r.source.toLowerCase() === source.toLowerCase() &&
      r.stage !== 'Declined'
    );
  }, [state.referrals]);

  const handleStageChange = useCallback((id: string, newStage: string) => {
    if (newStage === 'Declined') {
      setShowDeclineModal(id);
      return;
    }
    const r = state.referrals.find(ref => ref.id === id);
    if (!r) return;

    updateReferralStage(id, newStage as ReferralStage);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Referral', recordId: id,
      details: `Stage changed to ${newStage} for ${r.patientInitials}`,
      before: `stage: ${r.stage}`, after: `stage: ${newStage}`,
    });

    // Create alerts for relevant stages
    if (newStage === 'Staffing' && (r.urgency === 'Immediate' || r.urgency === 'Urgent 24-48 hours')) {
      createAlert({
        type: 'Staffing', severity: r.urgency === 'Immediate' ? 'Critical' : 'High',
        message: `${r.patientInitials} needs staffing — ${r.urgency}`,
        sourceRecordType: 'Referral', sourceRecordId: id,
      });
    }

    showToast(`${r.patientInitials} moved to ${newStage}`, 'success');
  }, [state, updateReferralStage, addAuditEntry, createAlert, showToast]);

  const handleDeclineConfirm = () => {
    if (!showDeclineModal || !declineReason.trim()) {
      showToast('Decline reason is required', 'error');
      return;
    }
    const r = state.referrals.find(ref => ref.id === showDeclineModal);
    if (!r) return;
    updateReferralStage(showDeclineModal, 'Declined', declineReason);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Referral', recordId: showDeclineModal,
      details: `Declined: ${declineReason}`,
      before: `stage: ${r.stage}`, after: `stage: Declined, reason: ${declineReason}`,
    });
    showToast(`${r.patientInitials} declined`, 'warning');
    setShowDeclineModal(null);
    setDeclineReason('');
  };

  const handleNewReferral = () => {
    if (!newPatientInitials.trim()) {
      showToast('Patient initials required', 'error');
      return;
    }

    // Duplicate check
    if (checkDuplicate(newPatientInitials, 'Manual Entry')) {
      showToast('⚠️ Possible duplicate referral detected — same initials from Manual Entry already exists', 'warning', 5000);
    }

    const newRef: Referral = {
      id: `ref_${Date.now()}`,
      source: 'Manual Entry',
      patientInitials: newPatientInitials || 'J.D.',
      serviceType: newServiceType,
      urgency: newUrgency,
      dischargeFacility: newFacility || 'Demo Hospital',
      dischargeDate: new Date().toISOString().split('T')[0],
      physicianOrders: 'Pending',
      insuranceStatus: 'Pending',
      documentsUploaded: 0,
      assignedCoordinator: state.currentUser.name,
      stage: 'New',
      missingItems: ['Physician Orders', 'Discharge Summary', 'Insurance Card'],
      createdAt: new Date().toISOString(),
      stageTimestamps: { New: new Date().toISOString() },
      timeline: [{ timestamp: new Date().toISOString(), action: 'Referral Created', user: state.currentUser.name }],
    };

    addReferral(newRef);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'Referral', recordId: newRef.id,
      details: `New referral ${newRef.patientInitials} from Manual Entry`,
    });

    if (newUrgency === 'Immediate') {
      createAlert({
        type: 'Urgent Referral', severity: 'Critical',
        message: `Immediate referral ${newPatientInitials} — ${newServiceType}`,
        sourceRecordType: 'Referral', sourceRecordId: newRef.id,
      });
    }

    showToast(`Referral ${newPatientInitials} created`, 'success');
    setNewPatientInitials('');
    setNewServiceType('Home Health');
    setNewUrgency('Routine');
    setNewFacility('');
    setShowNewForm(false);
  };

  const handleDocUpload = (referralId: string, category: string) => {
    const r = state.referrals.find(ref => ref.id === referralId);
    if (!r) return;

    uploadDocument({
      referralId,
      fileName: `demo_${category.toLowerCase().replace(/ /g, '_')}.pdf`,
      fileType: 'application/pdf',
      uploadedBy: state.currentUser.name,
      category: category as DemoDocument['category'],
    });

    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'Document', recordId: referralId,
      details: `Uploaded ${category} for ${r.patientInitials}`,
    });

    // Check if all docs now complete
    const updatedMissing = r.missingItems.filter(i => i !== category);
    if (updatedMissing.length === 0 && r.stage === 'Missing Docs') {
      showToast(`All documents complete for ${r.patientInitials} — Ready for Eligibility Review`, 'success', 5000);
    } else {
      showToast(`${category} uploaded for ${r.patientInitials}`, 'success');
    }
  };

  const handleMoveToEligibility = (id: string) => {
    const r = state.referrals.find(ref => ref.id === id);
    if (!r) return;
    if (r.missingItems.length > 0) {
      showToast(`Cannot move — ${r.missingItems.length} missing items remaining`, 'error');
      return;
    }
    handleStageChange(id, 'Eligibility');
  };

  // SOC analytics
  const getSOCTime = (r: Referral) => {
    const created = r.stageTimestamps['New'];
    const started = r.stageTimestamps['Started'];
    if (!created || !started) return null;
    const diff = new Date(started).getTime() - new Date(created).getTime();
    return (diff / (1000 * 60 * 60 * 24)).toFixed(1);
  };

  const getAISummary = (referral: Referral) => {
    const missing = referral.missingItems.length > 0 ? referral.missingItems.join(', ') : 'None';
    let action: string;
    if (referral.stage === 'Missing Docs') action = `Request missing documents (${missing}) from ${referral.dischargeFacility}`;
    else if (referral.stage === 'Eligibility') action = `Verify insurance coverage — current status: ${referral.insuranceStatus}`;
    else if (referral.stage === 'Staffing') action = `Match staff with: ${referral.serviceType} certification needed`;
    else if (referral.stage === 'New') action = 'Begin intake process — verify eligibility and request documents';
    else if (referral.stage === 'Declined') action = `Review decline reason: ${referral.declineReason || 'Not specified'}`;
    else action = `Continue to next stage`;
    return { missing, action, followUp: referral.assignedCoordinator, socDays: getSOCTime(referral) };
  };

  const referralDocs = useMemo(
    () => selectedReferralId ? state.documents.filter(d => d.referralId === selectedReferralId) : [],
    [state.documents, selectedReferralId]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <ClipboardList size={22} className="text-advisa-accent" />
            Referral Intake Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">{filtered.length} referrals · {state.referrals.filter(r => r.urgency === 'Immediate').length} immediate</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-advisa-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'table' ? 'bg-advisa-accent text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'kanban' ? 'bg-advisa-accent text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
          <button onClick={() => setShowNewForm(!showNewForm)} className="btn-primary"><Plus size={15} />New Referral</button>
        </div>
      </div>

      {/* New Referral Form */}
      {showNewForm && (
        <div className="card mb-5 bg-sky-50/50 border-sky-200">
          <p className="section-title mb-3">New Referral Form</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Patient Initials (e.g. J.D.) *" className="input" value={newPatientInitials} onChange={(e) => setNewPatientInitials(e.target.value)} />
            <select className="select" value={newServiceType} onChange={(e) => setNewServiceType(e.target.value as Referral['serviceType'])}>
              <option>Home Health</option><option>Hospice</option><option>Personal Care</option><option>Therapy</option><option>Catastrophic Injury Care</option>
            </select>
            <select className="select" value={newUrgency} onChange={(e) => setNewUrgency(e.target.value as Referral['urgency'])}>
              <option>Routine</option><option>Urgent 24-48 hours</option><option>Immediate</option>
            </select>
            <input placeholder="Discharge Facility" className="input" value={newFacility} onChange={(e) => setNewFacility(e.target.value)} />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={handleNewReferral}>Submit Referral</button>
            <button className="btn-secondary" onClick={() => setShowNewForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by initials or source..." className="input pl-9" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <select className="select" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option>All Stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-head">Patient</th>
                  <th className="table-head">Service</th>
                  <th className="table-head">Urgency</th>
                  <th className="table-head">Source</th>
                  <th className="table-head">Stage</th>
                  <th className="table-head">Docs</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((referral) => (
                  <tr
                    key={referral.id}
                    id={`referral-${referral.id}`}
                    className={`cursor-pointer transition-colors ${selectedReferralId === referral.id ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedReferralId(referral.id)}
                  >
                    <td className="table-cell font-semibold text-slate-800">{referral.patientInitials}</td>
                    <td className="table-cell text-xs">{referral.serviceType}</td>
                    <td className="table-cell">
                      <span className={`badge ${referral.urgency === 'Immediate' ? 'badge-urgent' : referral.urgency === 'Urgent 24-48 hours' ? 'badge-warning' : 'badge-success'}`}>{referral.urgency}</span>
                    </td>
                    <td className="table-cell text-slate-500 text-xs">{referral.source}</td>
                    <td className="table-cell">
                      <select
                        value={referral.stage}
                        onChange={(e) => handleStageChange(referral.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-advisa-border rounded-md bg-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STAGES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="table-cell">
                      <div className={`flex items-center gap-1 text-xs font-medium ${referral.missingItems.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        <FileText size={13} />{referral.documentsUploaded}
                        {referral.missingItems.length > 0 && <span className="text-[10px]">({referral.missingItems.length} missing)</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Drawer */}
          <div className="card">
            <div className="card-header">
              <Bot size={16} className="text-advisa-accent" />
              Referral Detail
            </div>
            {selectedReferral ? (() => {
              const summary = getAISummary(selectedReferral);
              return (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="stat-label">Patient</p>
                    <p className="text-lg font-bold text-slate-800">{selectedReferral.patientInitials}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="stat-label">Service</p><p className="font-medium text-slate-700 mt-0.5">{selectedReferral.serviceType}</p></div>
                    <div><p className="stat-label">Urgency</p><p className="font-medium text-slate-700 mt-0.5">{selectedReferral.urgency}</p></div>
                    <div><p className="stat-label">Stage</p><p className="font-medium text-slate-700 mt-0.5">{selectedReferral.stage}</p></div>
                    <div><p className="stat-label">Insurance</p><p className="font-medium text-slate-700 mt-0.5">{selectedReferral.insuranceStatus}</p></div>
                  </div>

                  {/* Readiness & SLA */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedReferral.readiness && (
                      <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-xs">
                        <p className="stat-label flex items-center gap-1"><ShieldCheck size={11} />Readiness</p>
                        <p className={`font-semibold mt-0.5 ${selectedReferral.readiness === 'Missing Docs' ? 'text-red-600' : selectedReferral.readiness === 'Ready for SOC' ? 'text-emerald-600' : 'text-sky-600'}`}>{selectedReferral.readiness}</p>
                      </div>
                    )}
                    {selectedReferral.slaDeadline && (
                      <div className={`p-2 rounded-lg border text-xs ${selectedReferral.slaStatus === 'Breach' ? 'bg-red-50 border-red-200' : selectedReferral.slaStatus === 'Risk' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <p className="stat-label flex items-center gap-1"><Timer size={11} />SLA</p>
                        <p className={`font-semibold mt-0.5 ${selectedReferral.slaStatus === 'Breach' ? 'text-red-600' : selectedReferral.slaStatus === 'Risk' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {selectedReferral.slaStatus || 'OK'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Deadline: {new Date(selectedReferral.slaDeadline).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {summary.socDays && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                      <Clock size={12} />Referral to SOC: {summary.socDays} days
                    </div>
                  )}

                  {selectedReferral.declineReason && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      <p className="font-semibold">Decline Reason</p>
                      <p className="mt-0.5">{selectedReferral.declineReason}</p>
                    </div>
                  )}

                  {/* Missing Items */}
                  {selectedReferral.missingItems.length > 0 && (
                    <div>
                      <p className="stat-label mb-1">Missing Items</p>
                      <div className="space-y-1.5">
                        {selectedReferral.missingItems.map((item) => (
                          <div key={item} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <span className="flex items-center gap-1.5 text-xs text-red-600"><AlertTriangle size={11} />{item}</span>
                            <button
                              onClick={() => handleDocUpload(selectedReferral.id, item)}
                              className="text-[10px] font-medium text-advisa-accent hover:underline flex items-center gap-1"
                            >
                              <Upload size={10} />Upload (Demo)
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Documents */}
                  {referralDocs.length > 0 && (
                    <div>
                      <p className="stat-label mb-1">Uploaded Documents</p>
                      <div className="space-y-1">
                        {referralDocs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-2 text-xs p-1.5 bg-emerald-50 rounded">
                            <CheckCircle size={11} className="text-emerald-600" />
                            <span className="text-slate-700">{doc.category}</span>
                            <span className="text-slate-400 text-[10px] ml-auto">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Move to Eligibility */}
                  {selectedReferral.stage === 'Missing Docs' && (
                    <button
                      onClick={() => handleMoveToEligibility(selectedReferral.id)}
                      disabled={selectedReferral.missingItems.length > 0}
                      className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${
                        selectedReferral.missingItems.length > 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-advisa-accent text-white hover:bg-advisa-accent-dark'
                      }`}
                    >
                      <ArrowRight size={13} />
                      {selectedReferral.missingItems.length > 0 ? 'Complete all docs to move' : 'Move to Eligibility'}
                    </button>
                  )}

                  {/* Recommended Action */}
                  <div className="pt-3 border-t border-advisa-border">
                    <p className="stat-label">Recommended Action</p>
                    <div className="mt-1.5 p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs text-slate-700 flex items-start gap-2">
                      <ArrowRight size={13} className="text-advisa-accent mt-0.5 flex-shrink-0" />
                      {summary.action}
                    </div>
                  </div>

                  {/* Timeline */}
                  {selectedReferral.timeline.length > 0 && (
                    <div>
                      <p className="stat-label mb-2">Timeline</p>
                      <div className="space-y-2">
                        {selectedReferral.timeline.slice(-5).reverse().map((t, i) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-advisa-accent mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-slate-700 font-medium">{t.action}</p>
                              <p className="text-slate-400 text-[10px]">{t.user} · {new Date(t.timestamp).toLocaleString()}</p>
                              {t.details && <p className="text-slate-500 text-[10px] mt-0.5">{t.details}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg">
                    <p className="text-[10px] text-amber-700">⚠️ Demo data only — no real PHI. Do not upload actual patient information.</p>
                  </div>
                </div>
              );
            })() : (
              <div className="text-center py-8">
                <ClipboardList size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">Select a referral to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.filter(s => s !== 'Declined' || filtered.some(r => r.stage === 'Declined')).map(stage => {
            const stageReferrals = filtered.filter(r => r.stage === stage);
            return (
              <div key={stage} className={`flex-shrink-0 w-[240px] rounded-lg border-t-2 ${stageBg[stage]} p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-700">{stage}</h3>
                  <span className="text-[10px] font-semibold bg-white px-1.5 py-0.5 rounded-full text-slate-500">{stageReferrals.length}</span>
                </div>
                <div className="space-y-2">
                  {stageReferrals.map(r => (
                    <div
                      key={r.id}
                      onClick={() => { setSelectedReferralId(r.id); setViewMode('table'); }}
                      className={`bg-white rounded-lg p-3 border border-slate-200 cursor-pointer hover:shadow-md transition-shadow text-xs ${
                        r.urgency === 'Immediate' ? 'ring-1 ring-red-300' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{r.patientInitials}</span>
                        <span className={`badge text-[9px] px-1.5 py-0 ${r.urgency === 'Immediate' ? 'badge-urgent' : r.urgency === 'Urgent 24-48 hours' ? 'badge-warning' : 'badge-success'}`}>
                          {r.urgency === 'Urgent 24-48 hours' ? 'Urgent' : r.urgency}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[10px]">{r.serviceType}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{r.source}</p>
                      {r.missingItems.length > 0 && (
                        <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1"><AlertTriangle size={9} />{r.missingItems.length} missing</p>
                      )}
                    </div>
                  ))}
                  {stageReferrals.length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-4">No referrals</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowDeclineModal(null); setDeclineReason(''); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-red-700">Decline Referral</h3>
              <button onClick={() => { setShowDeclineModal(null); setDeclineReason(''); }} className="p-1 hover:bg-slate-100 rounded"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-600 mb-3">A reason is required when declining a referral.</p>
            <textarea
              className="input"
              rows={3}
              placeholder="Enter decline reason..."
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={handleDeclineConfirm} className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">Confirm Decline</button>
              <button onClick={() => { setShowDeclineModal(null); setDeclineReason(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

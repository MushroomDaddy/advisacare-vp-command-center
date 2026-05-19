import { useAppState } from '../context/AppContext';
import { useToast } from '../components/Toast';
import type { QualityItem } from '../types';
import { useState, useMemo } from 'react';
import {
  Smartphone, Clock, MapPin, CheckCircle, Save, AlertTriangle, FileText,
  ChevronRight, Play, Square, Pen, WifiOff, RefreshCw, Wifi,
} from 'lucide-react';

export default function FieldAssistant() {
  const {
    state, updateVisitChecklist, updateVisitNotes, addIncidentReport, addAuditEntry,
    clockInVisit, clockOutVisit, createAlert, addOfflineQueueItem, syncOfflineItem,
  } = useAppState();
  const { showToast } = useToast();
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationText, setEscalationText] = useState('');
  const [showIncident, setShowIncident] = useState(false);
  const [incidentText, setIncidentText] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [evvExceptionNote, setEvvExceptionNote] = useState('');
  const [showEvvExceptionModal, setShowEvvExceptionModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const selectedVisitData = useMemo(
    () => state.visits.find(v => v.id === selectedVisit),
    [state.visits, selectedVisit]
  );

  // Filter visits for field staff role
  const visibleVisits = useMemo(() => {
    if (state.currentUser.role === 'Field Staff') {
      return state.visits.filter(v => v.staffName === state.currentUser.name);
    }
    return state.visits;
  }, [state.visits, state.currentUser]);

  const completedCount = visibleVisits.filter(v => v.documentationStatus === 'Complete').length;
  const pendingOffline = state.offlineQueue.filter(i => i.status === 'Pending').length;

  const handleChecklistToggle = (visitId: string, taskIndex: number) => {
    if (isOffline) {
      addOfflineQueueItem({ visitId, action: 'toggle_checklist', data: JSON.stringify({ taskIndex }) });
      showToast('Saved to offline queue', 'info');
    }
    updateVisitChecklist(visitId, taskIndex);
    const visit = state.visits.find(v => v.id === visitId);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: visitId,
      details: `Checklist item ${taskIndex + 1} toggled for ${visit?.patientInitials}`,
    });
  };

  const handleSaveNote = () => {
    if (!selectedVisit || !noteText.trim()) return;
    updateVisitNotes(selectedVisit, noteText);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: selectedVisit,
      details: `Note added for ${selectedVisitData?.patientInitials}`,
    });
    setNoteText('');
    showToast('Note saved', 'success');
  };

  const handleClockIn = () => {
    if (!selectedVisit || !selectedVisitData) return;
    if (selectedVisitData.evvStatus !== 'Not Started') {
      showToast('Already clocked in', 'warning');
      return;
    }
    clockInVisit(selectedVisit);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: selectedVisit,
      details: `Clock-in for ${selectedVisitData.patientInitials} at ${selectedVisitData.address}`,
    });
    showToast(`Clocked in for ${selectedVisitData.patientInitials}`, 'success');
  };

  const handleClockOut = () => {
    if (!selectedVisit || !selectedVisitData) return;
    if (selectedVisitData.evvStatus !== 'Clocked In') {
      showToast('Must clock in first', 'error');
      return;
    }

    // Check if all checklist items done
    const allComplete = selectedVisitData.checklist.every(i => i.completed);
    if (!allComplete) {
      showToast('Complete all checklist items before clocking out', 'warning');
    }

    // Show signature modal
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = () => {
    if (!selectedVisit || !selectedVisitData) return;

    clockOutVisit(selectedVisit, signatureConfirmed, undefined);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: selectedVisit,
      details: `Clock-out for ${selectedVisitData.patientInitials}${signatureConfirmed ? ', signature captured' : ', no signature'}`,
    });

    showToast(`Clocked out for ${selectedVisitData.patientInitials}${signatureConfirmed ? ' — signature captured' : ''}`, 'success');
    setShowSignatureModal(false);
    setSignatureConfirmed(false);
  };

  const handleEvvException = () => {
    if (!selectedVisit || !selectedVisitData || !evvExceptionNote.trim()) return;

    clockOutVisit(selectedVisit, false, evvExceptionNote);

    createAlert({
      type: 'EVV Exception', severity: 'High',
      message: `EVV exception for ${selectedVisitData.patientInitials}: ${evvExceptionNote}`,
      sourceRecordType: 'Visit', sourceRecordId: selectedVisit,
    });

    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Updated', recordType: 'Visit', recordId: selectedVisit,
      details: `EVV EXCEPTION: ${evvExceptionNote} for ${selectedVisitData.patientInitials}`,
    });

    showToast('EVV exception logged — alert created', 'warning');
    setShowEvvExceptionModal(false);
    setEvvExceptionNote('');
    setShowSignatureModal(false);
  };

  const handleEscalation = () => {
    if (!escalationText.trim()) return;
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'Quality', recordId: selectedVisit || 'N/A',
      details: `ESCALATION: ${escalationText}`,
    });
    createAlert({
      type: 'Escalation', severity: 'High',
      message: `Field escalation: ${escalationText}`,
      sourceRecordType: 'Visit', sourceRecordId: selectedVisit || 'N/A',
    });
    setEscalationText('');
    setShowEscalation(false);
    showToast('Escalation submitted', 'warning');
  };

  const handleIncidentReport = () => {
    if (!incidentText.trim() || !selectedVisitData) return;
    const incident: Omit<QualityItem, 'id'> = {
      type: 'Missed Visit',
      patientInitials: selectedVisitData.patientInitials,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Open',
      priority: 'High',
      assignedTo: state.currentUser.name,
    };
    addIncidentReport(incident);
    addAuditEntry({
      user: state.currentUser.name, role: state.currentUser.role,
      action: 'Created', recordType: 'Quality', recordId: selectedVisit || 'N/A',
      details: `INCIDENT REPORT: ${incidentText}`,
    });
    setIncidentText('');
    setShowIncident(false);
    showToast('Incident report submitted to Quality team', 'info');
  };

  const handleRetrySync = () => {
    state.offlineQueue.filter(i => i.status === 'Pending').forEach(item => {
      syncOfflineItem(item.id);
    });
    showToast('Offline queue synced', 'success');
  };

  const getEvvBadge = (status: string) => {
    if (status === 'Clocked In') return 'badge-info';
    if (status === 'Clocked Out') return 'badge-success';
    if (status === 'Exception') return 'badge-urgent';
    return 'badge-neutral';
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Smartphone size={22} className="text-advisa-accent" />
            Field Visit Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-1">{visibleVisits.length} visits today · {completedCount} documented</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Offline toggle (demo) */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              isOffline ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {isOffline ? <WifiOff size={12} /> : <Wifi size={12} />}
            {isOffline ? 'Offline' : 'Online'}
          </button>
          {pendingOffline > 0 && (
            <button onClick={handleRetrySync} className="btn-secondary text-xs py-1.5 gap-1">
              <RefreshCw size={12} />Sync ({pendingOffline})
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="card border-advisa-accent/30">
          <div className="flex justify-between items-center mb-4">
            <p className="section-title">Today's Route</p>
            <div className="flex gap-2">
              <span className="badge badge-info">{visibleVisits.length} Visits</span>
              <span className="badge badge-success">{completedCount} Done</span>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {visibleVisits.map((visit) => (
              <div
                key={visit.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedVisit === visit.id
                    ? 'border-advisa-accent bg-sky-50/50 shadow-card-hover'
                    : 'border-advisa-border hover:bg-slate-50 hover:border-slate-300'
                }`}
                onClick={() => setSelectedVisit(selectedVisit === visit.id ? null : visit.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-slate-800">{visit.patientInitials}</p>
                      <span className="badge badge-neutral">{visit.serviceType}</span>
                      <span className={`badge ${getEvvBadge(visit.evvStatus)}`}>{visit.evvStatus}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} />{visit.time} · {visit.staffName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={10} />{visit.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      visit.documentationStatus === 'Complete' ? 'badge-success' :
                      visit.documentationStatus === 'Pending' ? 'badge-warning' : 'badge-urgent'
                    }`}>{visit.documentationStatus}</span>
                    <ChevronRight size={14} className={`text-slate-400 transition-transform ${selectedVisit === visit.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Checklist progress</span>
                    <span>{visit.checklist.filter(i => i.completed).length}/{visit.checklist.length}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-advisa-accent h-1.5 rounded-full transition-all" style={{ width: `${(visit.checklist.filter(i => i.completed).length / visit.checklist.length) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visit Detail */}
          {selectedVisitData && (
            <div className="border-t border-advisa-border pt-4">
              <p className="section-title mb-3">Visit Detail — {selectedVisitData.patientInitials}</p>

              {/* EVV Status & Clock In/Out */}
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1"><Clock size={12} />EVV Status</p>
                <div className="flex items-center gap-3">
                  <span className={`badge ${getEvvBadge(selectedVisitData.evvStatus)}`}>{selectedVisitData.evvStatus}</span>
                  {selectedVisitData.clockIn && <span className="text-[10px] text-slate-500">In: {new Date(selectedVisitData.clockIn).toLocaleTimeString()}</span>}
                  {selectedVisitData.clockOut && <span className="text-[10px] text-slate-500">Out: {new Date(selectedVisitData.clockOut).toLocaleTimeString()}</span>}
                  {selectedVisitData.signatureCaptured && <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><Pen size={9} />Signed</span>}
                </div>
                <div className="flex gap-2 mt-2">
                  {selectedVisitData.evvStatus === 'Not Started' && (
                    <button onClick={handleClockIn} className="btn-primary text-xs py-1.5 gap-1"><Play size={11} />Start Visit (Clock In)</button>
                  )}
                  {selectedVisitData.evvStatus === 'Clocked In' && (
                    <>
                      <button onClick={handleClockOut} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">
                        <Square size={11} />End Visit
                      </button>
                      <button onClick={() => setShowEvvExceptionModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-200 border border-amber-200">
                        <AlertTriangle size={11} />EVV Exception
                      </button>
                    </>
                  )}
                </div>
                {selectedVisitData.evvException && (
                  <p className="text-[10px] text-red-600 mt-2">⚠️ Exception: {selectedVisitData.evvException}</p>
                )}
              </div>

              {/* Checklist */}
              <div className="mb-4">
                <p className="stat-label mb-2">Checklist</p>
                <div className="space-y-1">
                  {selectedVisitData.checklist.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <input type="checkbox" checked={item.completed} onChange={() => handleChecklistToggle(selectedVisitData.id, idx)}
                        className="w-4 h-4 rounded border-slate-300 text-advisa-accent focus:ring-advisa-accent" />
                      <span className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.task}</span>
                      {item.completed && <CheckCircle size={13} className="text-emerald-500 ml-auto" />}
                    </label>
                  ))}
                </div>
              </div>

              {/* Supplies */}
              <div className="mb-4">
                <p className="stat-label mb-2">Supplies Needed</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVisitData.suppliesNeeded.map(s => <span key={s} className="badge badge-neutral">{s}</span>)}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="stat-label mb-2 block">Notes</label>
                {selectedVisitData.notes && (
                  <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-600 mb-2 whitespace-pre-wrap">{selectedVisitData.notes}</div>
                )}
                <textarea className="input" rows={3} placeholder="Record or type visit notes..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <button onClick={handleSaveNote} className="btn-primary mt-2 text-xs"><Save size={13} />Save Note</button>
              </div>

              {/* Timeline */}
              {selectedVisitData.timeline.length > 0 && (
                <div className="mb-4">
                  <p className="stat-label mb-2">Visit Timeline</p>
                  <div className="space-y-1.5">
                    {selectedVisitData.timeline.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-advisa-accent flex-shrink-0" />
                        <span className="text-slate-700 font-medium">{t.action}</span>
                        <span className="text-slate-400 text-[10px]">{new Date(t.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button onClick={() => setShowEscalation(!showEscalation)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200">
                  <AlertTriangle size={13} />Escalate
                </button>
                <button onClick={() => setShowIncident(!showIncident)}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-50 text-sky-700 py-2 rounded-lg text-xs font-semibold hover:bg-sky-100 transition-colors border border-sky-200">
                  <FileText size={13} />Incident Report
                </button>
              </div>

              {showIncident && (
                <div className="mt-3 p-3 bg-sky-50/50 border border-sky-200 rounded-lg">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Incident Report</p>
                  <textarea className="input" rows={3} placeholder="Describe the incident..." value={incidentText} onChange={(e) => setIncidentText(e.target.value)} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleIncidentReport} className="btn-primary text-xs">Submit</button>
                    <button onClick={() => { setShowIncident(false); setIncidentText(''); }} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </div>
              )}

              {showEscalation && (
                <div className="mt-3 p-3 bg-red-50/50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 mb-2">Escalation</p>
                  <textarea className="input border-red-200" rows={3} placeholder="Describe the issue..." value={escalationText} onChange={(e) => setEscalationText(e.target.value)} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleEscalation} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700">Submit</button>
                    <button onClick={() => { setShowEscalation(false); setEscalationText(''); }} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowSignatureModal(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Signature Capture</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex items-center justify-center mb-3 bg-slate-50">
              {signatureConfirmed ? (
                <div className="text-center">
                  <Pen size={24} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-emerald-600 font-medium">Signature captured (demo)</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Tap to capture signature</p>
              )}
            </div>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={signatureConfirmed} onChange={e => setSignatureConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-advisa-accent" />
              <span className="text-xs text-slate-700">Patient/caregiver signature obtained</span>
            </label>
            <div className="flex gap-2">
              <button onClick={handleSignatureComplete} className="btn-primary flex-1">
                Complete Visit
              </button>
              <button onClick={() => setShowEvvExceptionModal(true)} className="btn-secondary flex-1 text-amber-700">
                EVV Exception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVV Exception Modal */}
      {showEvvExceptionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={() => setShowEvvExceptionModal(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-amber-700 mb-3">EVV Exception</h3>
            <p className="text-xs text-slate-600 mb-3">Document the reason for the EVV exception. This will create an alert for review.</p>
            <textarea className="input" rows={3} placeholder="Reason for EVV exception..." value={evvExceptionNote} onChange={e => setEvvExceptionNote(e.target.value)} />
            <div className="flex gap-2 mt-3">
              <button onClick={handleEvvException} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 flex-1">Submit Exception</button>
              <button onClick={() => { setShowEvvExceptionModal(false); setEvvExceptionNote(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useAppState } from '../context/AppContext';
import { useState } from 'react';
import type { FieldVisit, QualityItem } from '../types';
import {
  Smartphone, MapPin, Clock, CheckCircle, Play, Square,
  Wifi, WifiOff, MessageSquare, AlertTriangle, FileText, Navigation,
  Save, Send, Menu, X
} from 'lucide-react';

function EVVPanel({ visit, onUpdate }: { visit: FieldVisit; onUpdate: (updates: Partial<FieldVisit>) => void }) {
  const evv = visit.evv;
  const isClocked = !!evv.clockIn && !evv.clockOut;

  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-advisa-border">
      <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <Clock size={12} /> Electronic Visit Verification (EVV)
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-slate-500">Clock In</p>
          <p className="font-mono text-slate-700">{evv.clockIn ? new Date(evv.clockIn).toLocaleTimeString() : '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">Clock Out</p>
          <p className="font-mono text-slate-700">{evv.clockOut ? new Date(evv.clockOut).toLocaleTimeString() : '—'}</p>
        </div>
        <div>
          <p className="text-slate-500">GPS Location</p>
          <p className="font-mono text-slate-700 text-[10px]">{evv.gpsAddress || 'Not captured'}</p>
        </div>
        <div>
          <p className="text-slate-500">Sync Status</p>
          <span className={`badge ${evv.syncStatus === 'Synced' ? 'badge-success' : evv.syncStatus === 'Failed' ? 'badge-urgent' : 'badge-warning'}`}>
            {evv.syncStatus}
          </span>
        </div>
        <div>
          <p className="text-slate-500">Patient Signature</p>
          <p className="text-slate-700">{evv.patientSignature ? '✓ Captured' : '⬜ Placeholder'}</p>
        </div>
        <div>
          <p className="text-slate-500">Caregiver Signature</p>
          <p className="text-slate-700">{evv.caregiverSignature ? '✓ Captured' : '⬜ Placeholder'}</p>
        </div>
      </div>
      {evv.exceptionReason && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          Exception: {evv.exceptionReason}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {!evv.clockIn && (
          <button
            onClick={() => onUpdate({
              visitStatus: 'In Progress',
              evv: { ...evv, clockIn: new Date().toISOString(), gpsLatitude: '29.7604', gpsLongitude: '-95.3698', gpsAddress: `${visit.address} (GPS verified)`, syncStatus: 'Synced' }
            })}
            className="btn-primary text-xs py-1.5"
          >
            <Play size={11} /> Start Visit
          </button>
        )}
        {isClocked && (
          <button
            onClick={() => onUpdate({
              visitStatus: 'Completed',
              evv: { ...evv, clockOut: new Date().toISOString(), patientSignature: true, syncStatus: 'Synced' }
            })}
            className="btn-primary text-xs py-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <Square size={11} /> End Visit
          </button>
        )}
      </div>
    </div>
  );
}

export default function FieldAssistant() {
  const { state, updateVisitChecklist, updateVisit, addAuditEntry, addQualityItem, addAlert } = useAppState();
  const [selectedVisitId, setSelectedVisitId] = useState<string>(state.visits[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isOnline] = useState(true);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState('');
  const [escalationMsg, setEscalationMsg] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);

  // Filter visits for Field Staff role
  const visibleVisits = state.currentUser.role === 'Field Staff'
    ? state.visits.filter(v => v.staffName === state.currentUser.name)
    : state.visits;

  const selectedVisit = visibleVisits.find(v => v.id === selectedVisitId);

  const handleChecklistToggle = (taskIndex: number, completed: boolean) => {
    if (!selectedVisit) return;
    updateVisitChecklist(selectedVisit.id, taskIndex, completed);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Visit',
      recordId: selectedVisit.id,
      details: `Checklist item "${selectedVisit.checklist[taskIndex].task}" ${completed ? 'completed' : 'unchecked'}`,
    });
  };

  const handleSaveNotes = () => {
    if (!selectedVisit || !notes.trim()) return;
    updateVisit(selectedVisit.id, { notes: selectedVisit.notes ? `${selectedVisit.notes}\n${notes}` : notes });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Visit',
      recordId: selectedVisit.id,
      details: `Notes added for visit ${selectedVisit.patientInitials}`,
    });
    setNotes('');
  };

  const handleVisitUpdate = (updates: Partial<FieldVisit>) => {
    if (!selectedVisit) return;
    updateVisit(selectedVisit.id, updates);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Visit',
      recordId: selectedVisit.id,
      details: `Visit ${updates.visitStatus === 'In Progress' ? 'started' : updates.visitStatus === 'Completed' ? 'ended' : 'updated'} for ${selectedVisit.patientInitials}`,
    });
  };

  const handleIncidentReport = () => {
    if (!selectedVisit || !incidentDesc.trim()) return;
    const now = Date.now(); // eslint-disable-line react-hooks/purity
    const newQualityItem: QualityItem = {
      id: 'qi' + now,
      type: 'Incident',
      category: 'General QA',
      patientInitials: selectedVisit.patientInitials,
      dueDate: new Date(now + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Open',
      priority: 'High',
      assignedTo: state.currentUser.name,
    };
    addQualityItem(newQualityItem);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Quality',
      recordId: newQualityItem.id,
      details: `Incident reported for ${selectedVisit.patientInitials}: ${incidentDesc}`,
    });
    setIncidentDesc('');
    setShowIncidentForm(false);
  };

  const handleEscalation = () => {
    if (!selectedVisit || !escalationMsg.trim()) return;
    addAlert({
      type: 'escalation',
      severity: 'high',
      title: `Escalation: ${selectedVisit.patientInitials}`,
      details: `${state.currentUser.name}: ${escalationMsg}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      sourceRecordType: 'Visit',
      sourceRecordId: selectedVisit.id,
    });
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Visit',
      recordId: selectedVisit.id,
      details: `Escalation raised for ${selectedVisit.patientInitials}: ${escalationMsg}`,
    });
    setEscalationMsg('');
    setShowEscalation(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="page-title flex items-center gap-2">
          <Smartphone size={22} className="text-advisa-accent" />
          Field Visit Assistant
        </h2>
        <div className="flex items-center gap-2">
          {/* Offline Indicator */}
          <span className={`flex items-center gap-1 text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {/* Mobile hamburger menu */}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden btn-secondary p-1.5">
            {showMobileMenu ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden card mb-4 bg-slate-50">
          <div className="space-y-1">
            {visibleVisits.map(v => (
              <button
                key={v.id}
                onClick={() => { setSelectedVisitId(v.id); setShowMobileMenu(false); }}
                className={`w-full text-left px-3 py-2 rounded text-sm ${v.id === selectedVisitId ? 'bg-advisa-accent text-white' : 'hover:bg-slate-100'}`}
              >
                {v.time} — {v.patientInitials} ({v.visitStatus})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Route */}
      <div className="mb-4">
        <p className="section-title mb-2 flex items-center gap-2"><Navigation size={13} /> Today&apos;s Route</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleVisits.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVisitId(v.id)}
              className={`text-left p-3 rounded-lg border transition-all ${v.id === selectedVisitId ? 'border-advisa-accent bg-sky-50 shadow-sm' : 'border-advisa-border hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800">{v.time} — {v.patientInitials}</span>
                <span className={`badge text-[10px] ${v.visitStatus === 'Completed' ? 'badge-success' : v.visitStatus === 'In Progress' ? 'badge-info' : v.visitStatus === 'Missed' ? 'badge-urgent' : 'badge-neutral'}`}>
                  {v.visitStatus}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><MapPin size={9} /> {v.address}</p>
              <p className="text-[10px] text-slate-400">{v.serviceType}</p>
            </button>
          ))}
        </div>
        {/* Map Placeholder */}
        <div className="mt-3 h-32 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400 border border-advisa-border">
          <MapPin size={16} className="mr-2" /> Route map placeholder — integrate with mapping API
        </div>
      </div>

      {visibleVisits.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">No visits assigned for today</div>
      )}

      {/* Selected Visit Detail */}
      {selectedVisit && (
        <div className="space-y-4">
          {/* Visit Header */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-lg font-bold text-slate-800">{selectedVisit.patientInitials}</p>
                <p className="text-xs text-slate-400">{selectedVisit.address} · {selectedVisit.serviceType}</p>
              </div>
              <span className={`badge ${selectedVisit.visitStatus === 'Completed' ? 'badge-success' : selectedVisit.visitStatus === 'In Progress' ? 'badge-info' : 'badge-neutral'}`}>
                {selectedVisit.visitStatus}
              </span>
            </div>

            {/* EVV Panel */}
            <EVVPanel visit={selectedVisit} onUpdate={handleVisitUpdate} />
          </div>

          {/* Checklist */}
          <div className="card">
            <p className="section-title mb-3 flex items-center gap-2"><CheckCircle size={13} /> Visit Checklist</p>
            <div className="space-y-1.5">
              {selectedVisit.checklist.map((task, idx) => (
                <label key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={e => handleChecklistToggle(idx, e.target.checked)}
                    className="rounded border-slate-300 text-advisa-accent focus:ring-advisa-accent"
                  />
                  <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.task}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {selectedVisit.checklist.filter(t => t.completed).length}/{selectedVisit.checklist.length} completed
            </p>
          </div>

          {/* Supplies */}
          {selectedVisit.suppliesNeeded.length > 0 && (
            <div className="card">
              <p className="section-title mb-2">Supplies Needed</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedVisit.suppliesNeeded.map(s => (
                  <span key={s} className="badge badge-neutral">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="card">
            <p className="section-title mb-2 flex items-center gap-2"><FileText size={13} /> Visit Notes</p>
            {selectedVisit.notes && (
              <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-600 mb-2 whitespace-pre-wrap">{selectedVisit.notes}</div>
            )}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add visit notes..."
              className="input h-20 resize-none text-sm"
            />
            <button onClick={handleSaveNotes} className="btn-primary text-xs mt-2" disabled={!notes.trim()}>
              <Save size={11} /> Save Notes
            </button>
          </div>

          {/* Actions Row */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowEscalation(!showEscalation)} className="btn-secondary text-xs justify-center">
              <MessageSquare size={13} /> Escalate
            </button>
            <button onClick={() => setShowIncidentForm(!showIncidentForm)} className="btn-secondary text-xs justify-center text-red-600 border-red-200 hover:bg-red-50">
              <AlertTriangle size={13} /> Incident Report
            </button>
          </div>

          {/* Escalation Form */}
          {showEscalation && (
            <div className="card bg-amber-50/50 border-amber-200">
              <p className="section-title mb-2 flex items-center gap-2"><Send size={12} /> Secure Escalation</p>
              <textarea
                value={escalationMsg}
                onChange={e => setEscalationMsg(e.target.value)}
                placeholder="Describe the escalation..."
                className="input h-16 resize-none text-sm mb-2"
              />
              <button onClick={handleEscalation} className="btn-primary text-xs" disabled={!escalationMsg.trim()}>
                <Send size={11} /> Send Escalation
              </button>
            </div>
          )}

          {/* Incident Form */}
          {showIncidentForm && (
            <div className="card bg-red-50/50 border-red-200">
              <p className="section-title mb-2 flex items-center gap-2 text-red-700"><AlertTriangle size={12} /> Incident Report</p>
              <p className="text-[10px] text-red-500 mb-2">This creates a quality item and audit entry</p>
              <textarea
                value={incidentDesc}
                onChange={e => setIncidentDesc(e.target.value)}
                placeholder="Describe the incident..."
                className="input h-16 resize-none text-sm mb-2"
              />
              <button onClick={handleIncidentReport} className="btn-primary text-xs bg-red-600 hover:bg-red-700" disabled={!incidentDesc.trim()}>
                <AlertTriangle size={11} /> Submit Incident
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

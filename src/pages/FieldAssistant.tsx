import { useAppState } from '../context/AppContext';
import type { QualityItem } from '../types';
import { useState } from 'react';
import { Smartphone, Clock, MapPin, CheckCircle, Save, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

export default function FieldAssistant() {
  const { state, updateVisitChecklist, updateVisitNotes, addIncidentReport, addAuditEntry } = useAppState();
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationText, setEscalationText] = useState('');
  const [showIncident, setShowIncident] = useState(false);
  const [incidentText, setIncidentText] = useState('');
  
  const selectedVisitData = state.visits.find(v => v.id === selectedVisit);
  
  const handleChecklistToggle = (visitId: string, taskIndex: number) => {
    updateVisitChecklist(visitId, taskIndex);
    const visit = state.visits.find(v => v.id === visitId);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Quality',
      recordId: visitId,
      details: `Checklist item ${taskIndex} toggled for ${visit?.patientInitials}`,
    });
  };

  const handleSaveNote = () => {
    if (!selectedVisit || !noteText.trim()) return;
    updateVisitNotes(selectedVisit, noteText);
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Updated',
      recordType: 'Visit',
      recordId: selectedVisit,
      details: `Voice note added for ${selectedVisitData?.patientInitials}`,
    });
    setNoteText('');
    alert('Note saved successfully!');
  };

  const handleEscalation = () => {
    if (!escalationText.trim()) return;
    addAuditEntry({
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Quality',
      recordId: selectedVisit || 'N/A',
      details: `ESCALATION: ${escalationText}`,
    });
    setEscalationText('');
    setShowEscalation(false);
    alert('Escalation submitted!');
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
      user: state.currentUser.name,
      role: state.currentUser.role,
      action: 'Created',
      recordType: 'Quality',
      recordId: selectedVisit || 'N/A',
      details: `INCIDENT REPORT: ${incidentText}`,
    });
    setIncidentText('');
    setShowIncident(false);
    alert('Incident report submitted to Quality team!');
  };

  const completedCount = state.visits.filter(v => v.documentationStatus === 'Complete').length;
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Smartphone size={22} className="text-advisa-accent" />
          Field Visit Assistant
        </h2>
        <p className="text-xs text-slate-400 mt-1">{state.visits.length} visits today · {completedCount} documented</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="card border-advisa-accent/30">
          <div className="flex justify-between items-center mb-4">
            <p className="section-title">Today's Route</p>
            <div className="flex gap-2">
              <span className="badge badge-info">{state.visits.length} Visits</span>
              <span className="badge badge-success">{completedCount} Done</span>
            </div>
          </div>
          
          <div className="space-y-2 mb-5">
            {state.visits.map((visit) => (
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

          {selectedVisitData && (
            <div className="border-t border-advisa-border pt-4">
              <p className="section-title mb-3">Visit Detail — {selectedVisitData.patientInitials}</p>
              
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
              
              <div className="mb-4">
                <p className="stat-label mb-2">Supplies Needed</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVisitData.suppliesNeeded.map(s => <span key={s} className="badge badge-neutral">{s}</span>)}
                </div>
              </div>

              <div className="mb-4">
                <label className="stat-label mb-2 block">Notes</label>
                <textarea className="input" rows={3} placeholder="Record or type visit notes..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <button onClick={handleSaveNote} className="btn-primary mt-2 text-xs"><Save size={13} />Save Note</button>
              </div>

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
                    <button onClick={handleEscalation} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">Submit</button>
                    <button onClick={() => { setShowEscalation(false); setEscalationText(''); }} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
